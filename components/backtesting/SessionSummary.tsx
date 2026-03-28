'use client'

import { useEffect, useRef, useState } from 'react'
import { SessionMetrics, SimulatedTrade, ReplayConfig } from '@/lib/backtesting/types'
import { createChart, ColorType, LineData, Time } from 'lightweight-charts'
import { cn } from '@/lib/utils'
import { Trophy, TrendingUp, TrendingDown, Target, BarChart2, AlertTriangle, X, BookOpen, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'

// ─── Equity mini-chart ────────────────────────────────────────────────────────
function EquityMini({ metrics, initial }: { metrics: SessionMetrics; initial: number }) {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!ref.current || metrics.equityCurve.length === 0) return
        const chart = createChart(ref.current, {
            layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#64748b', fontFamily: 'Inter', fontSize: 10 },
            grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
            rightPriceScale: { borderColor: '#1e293b' },
            timeScale: { borderColor: '#1e293b', timeVisible: false },
            width: ref.current.clientWidth,
            height: ref.current.clientHeight,
            handleScroll: false,
            handleScale: false,
        })
        const isProfit = metrics.netPnl >= 0
        const area = chart.addAreaSeries({
            lineColor: isProfit ? '#10b981' : '#ef4444',
            topColor: isProfit ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            bottomColor: 'transparent',
            lineWidth: 2,
        })
        const data: LineData[] = [
            { time: metrics.equityCurve[0].time as Time, value: initial },
            ...metrics.equityCurve.map(p => ({ time: p.time as Time, value: p.value }))
        ]
        area.setData(data)
        chart.timeScale().fitContent()
        return () => chart.remove()
    }, [metrics, initial])
    return <div ref={ref} className="w-full h-full" />
}

// ─── Main Modal ────────────────────────────────────────────────────────────────
interface Props {
    isOpen: boolean
    metrics: SessionMetrics
    trades: SimulatedTrade[]
    config: ReplayConfig
    onClose: () => void
    onNewSession: () => void
    onSaveToJournal: () => Promise<void>
}

export function SessionSummary({ isOpen, metrics, trades, config, onClose, onNewSession, onSaveToJournal }: Props) {
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    if (!isOpen) return null

    const isProfit = metrics.netPnl >= 0

    const handleSave = async () => {
        setSaving(true)
        await onSaveToJournal()
        setSaving(false)
        setSaved(true)
    }

    const METRICS = [
        {
            label: 'Net P&L',
            value: `${isProfit ? '+' : ''}$${metrics.netPnl.toFixed(2)}`,
            sub: `${isProfit ? '+' : ''}${metrics.netPnlPct.toFixed(2)}% return`,
            icon: isProfit ? TrendingUp : TrendingDown,
            color: isProfit ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20',
        },
        {
            label: 'Win Rate',
            value: `${metrics.winRate.toFixed(1)}%`,
            sub: `${metrics.winningTrades}W / ${metrics.losingTrades}L`,
            icon: Target,
            color: metrics.winRate >= 50 ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        },
        {
            label: 'Max Drawdown',
            value: `-${metrics.maxDrawdown.toFixed(2)}%`,
            sub: `PF: ${metrics.profitFactor.toFixed(2)}x`,
            icon: AlertTriangle,
            color: metrics.maxDrawdown > 10 ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-[var(--foreground)] bg-[var(--background)] border-[var(--border)]',
        },
        {
            label: 'Total Trades',
            value: String(metrics.totalTrades),
            sub: `Avg: ${metrics.avgWin > 0 ? '+' : ''}$${metrics.avgWin.toFixed(0)} / -$${metrics.avgLoss.toFixed(0)}`,
            icon: BarChart2,
            color: 'text-[var(--foreground)] bg-[var(--background)] border-[var(--border)]',
        },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                {/* Blue top glow */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

                {/* Header */}
                <div className="px-6 py-5 flex items-start justify-between border-b border-[var(--border)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                            <Trophy size={22} className="text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[var(--foreground)]">Session Complete</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-[var(--foreground-muted)]">{config.displaySymbol} · {config.timeframe.toUpperCase()}</span>
                                <span className={cn(
                                    'text-[10px] font-bold px-2 py-0.5 rounded-md',
                                    isProfit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                                )}>
                                    {isProfit ? 'Profitable' : 'Net Loss'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} title="Close summary" aria-label="Close summary" className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Metrics */}
                <div className="px-6 pt-5 pb-4 grid grid-cols-4 gap-3">
                    {METRICS.map(m => {
                        const Icon = m.icon
                        return (
                            <div key={m.label} className={cn('rounded-xl border p-3', m.color.split(' ').slice(1).join(' '))}>
                                <Icon size={16} className={m.color.split(' ')[0] + ' mb-2'} />
                                <div className={cn('text-lg font-black font-mono', m.color.split(' ')[0])}>{m.value}</div>
                                <div className="text-[10px] text-[var(--foreground-muted)] mt-0.5">{m.sub}</div>
                                <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--foreground-disabled)] mt-1">{m.label}</div>
                            </div>
                        )
                    })}
                </div>

                {/* Equity curve */}
                {metrics.equityCurve.length > 0 && (
                    <div className="px-6 pb-4">
                        <div className="h-28 rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--background)]">
                            <EquityMini metrics={metrics} initial={config.initialCapital} />
                        </div>
                    </div>
                )}

                {/* Trade table */}
                {trades.length > 0 && (
                    <div className="px-6 pb-4">
                        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                            <div className="max-h-40 overflow-y-auto scrollbar-thin">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-[var(--border)] bg-[var(--background-tertiary)]">
                                            {['#', 'Entry', 'Exit', 'Dir', 'Entry$', 'Exit$', 'P&L', 'Reason'].map(h => (
                                                <th key={h} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-[var(--foreground-disabled)]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {trades.map((t, i) => (
                                            <tr key={t.id} className="hover:bg-[var(--background-tertiary)/60] transition-colors">
                                                <td className="px-3 py-2 text-[var(--foreground-muted)]">{i + 1}</td>
                                                <td className="px-3 py-2 font-mono">{format(new Date(t.entryTime * 1000), 'MMM d HH:mm')}</td>
                                                <td className="px-3 py-2 font-mono">{format(new Date(t.exitTime * 1000), 'MMM d HH:mm')}</td>
                                                <td className="px-3 py-2">
                                                    <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold', t.direction === 'LONG' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400')}>
                                                        {t.direction}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 font-mono">{t.entryPrice.toFixed(4)}</td>
                                                <td className="px-3 py-2 font-mono">{t.exitPrice.toFixed(4)}</td>
                                                <td className={cn('px-3 py-2 font-mono font-semibold', t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                                                    {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2 text-[var(--foreground-muted)] capitalize">{t.exitReason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer buttons */}
                <div className="px-6 py-4 border-t border-[var(--border)] flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-400 transition-all disabled:opacity-60"
                    >
                        <BookOpen size={14} />
                        {saved ? 'Saved to Journal ✓' : saving ? 'Saving…' : 'Save to Journal'}
                    </button>
                    <button
                        onClick={onNewSession}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors"
                    >
                        <RotateCcw size={14} />
                        New Session
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                        Continue Replay
                    </button>
                </div>
            </div>
        </div>
    )
}
