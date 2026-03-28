'use client'

import { SessionMetrics } from '@/lib/backtesting/types'
import { cn } from '@/lib/utils'
import { Square } from 'lucide-react'

interface Props {
    metrics: SessionMetrics
    symbol: string
    onEndSession: () => void
}

export function SessionStats({ metrics, symbol, onEndSession }: Props) {
    const isProfit = metrics.netPnl >= 0

    const stats = [
        {
            label: 'Session P&L',
            value: `${isProfit ? '+' : ''}$${metrics.netPnl.toFixed(2)}`,
            cls: isProfit ? 'text-emerald-400' : 'text-red-400',
        },
        {
            label: 'Return',
            value: `${isProfit ? '+' : ''}${metrics.netPnlPct.toFixed(2)}%`,
            cls: isProfit ? 'text-emerald-400' : 'text-red-400',
        },
        {
            label: 'Trades',
            value: `${metrics.winningTrades}W · ${metrics.losingTrades}L`,
            cls: 'text-[var(--foreground)]',
        },
        {
            label: 'Win Rate',
            value: metrics.totalTrades > 0 ? `${metrics.winRate.toFixed(1)}%` : '—',
            cls: metrics.winRate >= 50 ? 'text-emerald-400' : 'text-[var(--foreground-muted)]',
        },
        {
            label: 'Max DD',
            value: metrics.totalTrades > 0 ? `-${metrics.maxDrawdown.toFixed(2)}%` : '—',
            cls: metrics.maxDrawdown > 5 ? 'text-red-400' : 'text-[var(--foreground-muted)]',
        },
    ]

    return (
        <div className="flex-shrink-0 h-9 flex items-center px-4 gap-6 border-t border-[var(--border)] bg-[var(--background)]">
            <span className="text-[10px] font-bold text-[var(--foreground-disabled)] uppercase tracking-wider mr-2">{symbol}</span>

            {stats.map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[var(--foreground-disabled)]">{s.label}:</span>
                    <span className={cn('text-[10px] font-bold font-mono', s.cls)}>{s.value}</span>
                </div>
            ))}

            <div className="flex-1" />

            <button
                onClick={onEndSession}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-colors"
                title="End replay session and view results"
            >
                <Square size={9} />
                End Session
            </button>
        </div>
    )
}
