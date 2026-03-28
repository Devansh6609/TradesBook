'use client'

import { useState, useEffect, useRef } from 'react'
import { createChart, ColorType, ISeriesApi, Time, LineData, SeriesMarker } from 'lightweight-charts'
import { ChevronDown, Activity, PlayCircle } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Trade {
    id: string
    symbol: string
    type: 'BUY' | 'SELL'
    entryDate: string
    exitDate?: string
    entryPrice: string
    pnl?: number
    netPnl?: number
    status: 'OPEN' | 'CLOSED'
    quantity?: number
}

interface TradeSimulationProps {
    trades: Trade[]
}

export function TradeSimulation({ trades }: TradeSimulationProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<any>(null)
    const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)

    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.exitDate)
    const [selectedTradeId, setSelectedTradeId] = useState<string>(closedTrades[0]?.id || '')

    const selectedTrade = closedTrades.find(t => t.id === selectedTradeId)

    useEffect(() => {
        if (!chartContainerRef.current) return

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
            }
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#888',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
                tickMarkFormatter: (time: number) => format(new Date(time * 1000), 'MMM d, HH:mm'),
            },
            crosshair: {
                vertLine: { labelBackgroundColor: '#1a1a1a' },
                horzLine: { labelBackgroundColor: '#1a1a1a' },
            },
        })

        chartRef.current = chart

        const lineSeries = chart.addLineSeries({
            color: '#3b82f6',
            lineWidth: 2,
            crosshairMarkerVisible: true,
            lastValueVisible: false,
            priceLineVisible: false,
        })
        seriesRef.current = lineSeries

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            chart.remove()
        }
    }, [])

    useEffect(() => {
        if (!selectedTrade || !seriesRef.current || !chartRef.current) return

        const entryTime = new Date(selectedTrade.entryDate).getTime() / 1000
        const exitTime = new Date(selectedTrade.exitDate!).getTime() / 1000
        const entryPrice = parseFloat(selectedTrade.entryPrice)
        const exitPrice = entryPrice + parseFloat((selectedTrade.netPnl || selectedTrade.pnl || 0).toString()) / (selectedTrade.quantity || 1) // Rough approximation if exit price isn't explicitly saved

        const isWin = (selectedTrade.netPnl || selectedTrade.pnl || 0) >= 0
        const isBuy = selectedTrade.type === 'BUY'

        // We'll simulate a 5-point path to make the line look like a real trade instead of a straight shot
        const duration = exitTime - entryTime
        const stepX = duration / 4
        const diffY = exitPrice - entryPrice
        const stepY = diffY / 4

        // Add some random simulated volatility between entry and exit
        const volatility = Math.abs(diffY) * 0.5

        const data: LineData<Time>[] = [
            { time: entryTime as Time, value: entryPrice },
            { time: (entryTime + stepX * 1) as Time, value: entryPrice + stepY * 1 + (Math.random() > 0.5 ? volatility : -volatility) },
            { time: (entryTime + stepX * 2) as Time, value: entryPrice + stepY * 2 - (Math.random() > 0.5 ? volatility : -volatility) },
            { time: (entryTime + stepX * 3) as Time, value: entryPrice + stepY * 3 + (Math.random() > 0.5 ? volatility : -volatility) },
            { time: exitTime as Time, value: exitPrice },
        ]

        // Ensure strict ascending times
        const uniqueData = Array.from(new Map(data.map(item => [item.time, item])).values()).sort((a, b) => (a.time as number) - (b.time as number))

        seriesRef.current.setData(uniqueData)

        const markers: SeriesMarker<Time>[] = [
            {
                time: entryTime as Time,
                position: isBuy ? 'belowBar' : 'aboveBar',
                color: isBuy ? '#3b82f6' : '#ef4444',
                shape: isBuy ? 'arrowUp' : 'arrowDown',
                text: `ENTRY @ ${entryPrice.toFixed(5)}`,
            },
            {
                time: exitTime as Time,
                position: isBuy ? 'aboveBar' : 'belowBar', // Usually exit is opposite side of entry
                color: isWin ? '#22c55e' : '#ef4444',
                shape: isBuy ? 'arrowDown' : 'arrowUp',
                text: `EXIT | ${isWin ? '+' : ''}$${(selectedTrade.netPnl || selectedTrade.pnl || 0).toFixed(2)}`,
            }
        ]

        seriesRef.current.setMarkers(markers.sort((a, b) => (a.time as number) - (b.time as number)))
        seriesRef.current.applyOptions({
            color: isWin ? '#22c55e' : '#ef4444'
        })

        chartRef.current.timeScale().fitContent()

    }, [selectedTrade])


    if (closedTrades.length === 0) {
        return (
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 h-[350px] flex flex-col items-center justify-center text-[var(--foreground-muted)]">
                <Activity className="w-8 h-8 opacity-20 mb-3" />
                <p className="text-sm font-medium">No closed trades available for simulation.</p>
            </div>
        )
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-[var(--foreground)]">Trade Simulation</h3>
                </div>

                <div className="relative">
                    <select
                        value={selectedTradeId}
                        onChange={(e) => setSelectedTradeId(e.target.value)}
                        className="w-full md:w-[280px] appearance-none bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] text-sm rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    >
                        {closedTrades.slice(0, 20).map(t => {
                            const pnlVal = parseFloat((t.netPnl || t.pnl || 0).toString())
                            return (
                                <option key={t.id} value={t.id}>
                                    {format(new Date(t.entryDate), 'MMM d, HH:mm')} | {t.symbol} | {pnlVal >= 0 ? '+' : '-'}${Math.abs(pnlVal).toFixed(2)}
                                </option>
                            )
                        })}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] pointer-events-none" />
                </div>
            </div>

            <div className="h-[300px] w-full relative group">
                <div ref={chartContainerRef} className="w-full h-full" />
                {/* Overlay showing roughly what the trade was */}
                {selectedTrade && (
                    <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[var(--border)] p-3 rounded-lg font-mono text-xs">
                            <p className="text-[var(--foreground)] mb-1"><span className="text-[var(--foreground-muted)]">Asset:</span> {selectedTrade.symbol}</p>
                            <p className="text-[var(--foreground)] mb-1"><span className="text-[var(--foreground-muted)]">Type:</span> <span className={selectedTrade.type === 'BUY' ? 'text-blue-400' : 'text-red-400'}>{selectedTrade.type}</span></p>
                            <p className={cn("font-bold mt-2", (selectedTrade.netPnl || selectedTrade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                                PnL: ${parseFloat((selectedTrade.netPnl || selectedTrade.pnl || 0).toString()).toFixed(2)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-center text-[10px] text-[var(--foreground-muted)] mt-4">
                * Simulated path showing localized volatility between exact recorded entry and exit timestamps.
            </p>
        </div>
    )
}
