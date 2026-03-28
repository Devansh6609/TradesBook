'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, ISeriesApi, Time, CandlestickData, SeriesMarker } from 'lightweight-charts'
import { format } from 'date-fns'

interface Trade {
    id: string
    symbol: string
    type: 'BUY' | 'SELL'
    entryDate: string
    exitDate?: string
    entryPrice: string
    pnl?: string | number
    netPnl?: string | number
    status: 'OPEN' | 'CLOSED'
    quantity?: string | number
}

interface TradeChartProps {
    trade: Trade
    height?: number
}

export function TradeChart({ trade, height = 300 }: TradeChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<any>(null)
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

    useEffect(() => {
        if (!chartContainerRef.current) return

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
            }
        }

        const chart = createChart(chartContainerRef.current, {
            height,
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
                scaleMargins: { top: 0.2, bottom: 0.2 },
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

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            priceLineVisible: false,
            lastValueVisible: false,
        })
        seriesRef.current = candlestickSeries

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            chart.remove()
        }
    }, [height])

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!trade || !trade.exitDate || !seriesRef.current || !chartRef.current) return

        const entryTime = Math.floor(new Date(trade.entryDate).getTime() / 1000)
        const exitTime = Math.floor(new Date(trade.exitDate).getTime() / 1000)
        const entryPrice = parseFloat(trade.entryPrice)
        const parsedPnl = parseFloat((trade.netPnl || trade.pnl || '0').toString())
        const parsedQty = parseFloat((trade.quantity || '1').toString())
        const exitPrice = entryPrice + parsedPnl / (parsedQty > 0 ? parsedQty : 1)

        const isWin = parsedPnl >= 0
        const isBuy = trade.type === 'BUY'

        const fetchRealData = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const res = await fetch(`/api/market/history?symbol=${trade.symbol}&start=${entryTime}&end=${exitTime}&anchorPrice=${entryPrice}&anchorTime=${entryTime}`)

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}))
                    throw new Error(errData.error || 'Failed to fetch market data')
                }

                const json = await res.json()
                const realData = json.data

                if (realData && realData.length > 0) {
                    // Check and eliminate duplicate timestamps which crash lightweight-charts
                    const uniqueMap = new Map()
                    realData.forEach((item: any) => {
                        if (!uniqueMap.has(item.time)) {
                            uniqueMap.set(item.time, item)
                        }
                    })
                    const uniqueData = Array.from(uniqueMap.values()).sort((a: any, b: any) => a.time - b.time)

                    seriesRef.current?.setData(uniqueData)
                } else {
                    throw new Error('No valid historical data points found')
                }

            } catch (err: any) {
                console.error('Simulation error:', err)
                setError(err.message || 'Error loading real market data.')
            } finally {
                // Always plot the entry and exit markers, even if chart history fails
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
                        position: isBuy ? 'aboveBar' : 'belowBar',
                        color: isWin ? '#22c55e' : '#ef4444',
                        shape: isBuy ? 'arrowDown' : 'arrowUp',
                        text: `EXIT | ${isWin ? '+' : ''}$${Math.abs(parsedPnl).toFixed(2)}`,
                    }
                ]

                // Sort markers by time as strictly required by lightweight-charts
                seriesRef.current?.setMarkers(markers.sort((a, b) => (a.time as number) - (b.time as number)))
                chartRef.current?.timeScale().fitContent()

                setIsLoading(false)
            }
        }

        fetchRealData()

    }, [trade])

    if (!trade.exitDate) {
        return (
            <div className="flex flex-col items-center justify-center border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--foreground-muted)]" style={{ height }}>
                Position must be CLOSED to run Trade Simulation mapping.
            </div>
        )
    }

    return (
        <div className="relative w-full" style={{ height }}>
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--background)]/50 backdrop-blur-sm rounded-lg">
                    <div className="flex flex-col items-center">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-xs font-mono text-blue-400">Loading Market History...</span>
                    </div>
                </div>
            )}
            {error && !isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="flex flex-col items-center">
                        <p className="text-xs font-mono text-red-400 mb-1">Live Chart Unavailable</p>
                        <p className="text-[10px] text-[var(--foreground-muted)]">{error}</p>
                    </div>
                </div>
            )}
            <div ref={chartContainerRef} className="w-full h-full" />
        </div>
    )
}
