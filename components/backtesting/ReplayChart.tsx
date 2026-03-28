'use client'

import { useEffect, useRef } from 'react'
import {
    createChart,
    ColorType,
    CandlestickData,
    CrosshairMode,
    SeriesMarker,
    Time,
    LineData,
    IChartApi,
    ISeriesApi,
    PriceLineOptions,
} from 'lightweight-charts'
import { OHLCVBar, OpenPosition, SimulatedTrade, SYMBOL_OPTIONS } from '@/lib/backtesting/types'

interface Props {
    bars: OHLCVBar[]
    currentBar: OHLCVBar | null
    openPositions: OpenPosition[]
    closedTrades: SimulatedTrade[]
    symbol: string
    timeframe: string
    status?: string
    onChartClick?: (time: number) => void
}

// Format price with correct decimal places based on pipSize
function fmtPrice(price: number, pipSize: number): string {
    const dp = pipSize >= 1 ? 1 : pipSize >= 0.1 ? 2 : pipSize >= 0.01 ? 2 : pipSize >= 0.001 ? 3 : 5
    return price.toFixed(dp)
}

export function ReplayChart({ bars, currentBar, openPositions, closedTrades, symbol, timeframe, status, onChartClick }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
    const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null)
    const cursorRef = useRef<ISeriesApi<'Line'> | null>(null)

    // Use a ref for the callback so we don't need to re-subscribe to chart clicks on every render
    const clickHandlerRef = useRef(onChartClick)
    useEffect(() => { clickHandlerRef.current = onChartClick }, [onChartClick])
    const statusRef = useRef(status)
    useEffect(() => { statusRef.current = status }, [status])

    const BG = '#000000'
    const GRID = '#1a2236'
    const TEXT = '#64748b'

    const sym = SYMBOL_OPTIONS.find(s => s.value === symbol)
    const pipSize = sym?.pipSize ?? 0.0001

    // ── Init chart once ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return

        const chart = createChart(containerRef.current, {
            layout: { background: { type: ColorType.Solid, color: BG }, textColor: TEXT, fontFamily: 'Inter, sans-serif', fontSize: 11 },
            grid: { vertLines: { color: GRID }, horzLines: { color: GRID } },
            crosshair: { mode: CrosshairMode.Normal },
            rightPriceScale: { borderColor: GRID },
            timeScale: { borderColor: GRID, timeVisible: true, secondsVisible: false },
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
        })
        chartRef.current = chart

        // Candle series
        const candles = chart.addCandlestickSeries({
            upColor: '#10b981', downColor: '#ef4444',
            borderUpColor: '#10b981', borderDownColor: '#ef4444',
            wickUpColor: '#10b981', wickDownColor: '#ef4444',
        })
        candleRef.current = candles

        // Volume series
        const vol = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol' })
        chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } })
        volumeRef.current = vol

        const ro = new ResizeObserver(() => {
            if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
        })
        ro.observe(containerRef.current)

        // Handle chart clicks for Select mode
        chart.subscribeClick((param) => {
            if (!param.time || statusRef.current !== 'select') return
            clickHandlerRef.current?.(param.time as number)
        })

        return () => { ro.disconnect(); chart.remove() }
    }, [])

    // ── Update candles ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!candleRef.current || !volumeRef.current || bars.length === 0) return

        candleRef.current.setData(
            bars.map(b => ({ time: b.time as Time, open: b.open, high: b.high, low: b.low, close: b.close }))
        )
        volumeRef.current.setData(
            bars.map(b => ({
                time: b.time as Time,
                value: b.volume ?? 0,
                color: b.close >= b.open ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
            } as any))
        )

        // Closed trade entry/exit markers
        const markers: SeriesMarker<Time>[] = []
        for (const t of closedTrades) {
            markers.push({ time: t.entryTime as Time, position: t.direction === 'LONG' ? 'belowBar' : 'aboveBar', color: '#3b82f6', shape: t.direction === 'LONG' ? 'arrowUp' : 'arrowDown', text: `${t.direction}`, size: 1 })
            markers.push({ time: t.exitTime as Time, position: t.direction === 'LONG' ? 'aboveBar' : 'belowBar', color: t.pnl >= 0 ? '#10b981' : '#ef4444', shape: t.direction === 'LONG' ? 'arrowDown' : 'arrowUp', text: `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(0)}`, size: 1 })
        }
        markers.sort((a, b) => (a.time as number) - (b.time as number))
        candleRef.current.setMarkers(markers)

        // Auto-scroll: keep latest bar at ~80% from left, so there's empty space ahead
        if (chartRef.current) {
            chartRef.current.timeScale().scrollToPosition(-3, false)
        }
    }, [bars, closedTrades])

    // ── Open position price lines ─────────────────────────────────────────────────
    useEffect(() => {
        if (!candleRef.current) return
        const series = candleRef.current
        const existing = (series as any).getPricelines?.() ?? []
        existing.forEach((l: any) => series.removePriceLine(l))
        for (const pos of openPositions) {
            const color = pos.direction === 'LONG' ? '#10b981' : '#f97316'
            const isProfit = pos.floatingPnl >= 0
            series.createPriceLine({ price: pos.entryPrice, color, lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: `${pos.direction} ${fmtPrice(pos.entryPrice, pipSize)} (${isProfit ? '+' : ''}$${pos.floatingPnl.toFixed(2)})` } as PriceLineOptions)
            if (pos.slPrice !== null) series.createPriceLine({ price: pos.slPrice, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'SL' } as PriceLineOptions)
            if (pos.tpPrice !== null) series.createPriceLine({ price: pos.tpPrice, color: '#10b981', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: 'TP' } as PriceLineOptions)
        }
    }, [openPositions, pipSize])

    // ── OHLCV display values ──────────────────────────────────────────────────────
    const bar = currentBar
    const isUp = bar ? bar.close >= bar.open : true
    const ohlcColor = isUp ? '#10b981' : '#ef4444'

    return (
        <div className="relative w-full h-full">
            {/* Chart canvas */}
            <div ref={containerRef} className="w-full h-full" />

            {/* OHLCV overlay — top-left, matches TradingView style */}
            {bar && (
                <div className="absolute top-3 left-3 flex items-center gap-3 pointer-events-none z-10">
                    <span className="text-xs font-bold text-[var(--foreground)]">{symbol.replace('=X', '').replace('-', '/').replace('^', '')}</span>
                    <span className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase">{timeframe}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                        O <span className={isUp ? 'text-emerald-500' : 'text-red-500'}>{fmtPrice(bar.open, pipSize)}</span>
                        {'  '}H <span className="text-emerald-500">{fmtPrice(bar.high, pipSize)}</span>
                        {'  '}L <span className="text-red-500">{fmtPrice(bar.low, pipSize)}</span>
                        {'  '}C <span className={isUp ? 'text-emerald-500' : 'text-red-500'}>{fmtPrice(bar.close, pipSize)}</span>
                    </span>
                </div>
            )}
        </div>
    )
}
