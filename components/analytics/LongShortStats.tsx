'use client'

import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LongShortStatsProps {
    data: {
        long: {
            trades: number
            pnl: number
            winRate: number
            bestTrade: number
        }
        short: {
            trades: number
            pnl: number
            winRate: number
            bestTrade: number
        }
    }
}

export function LongShortStats({ data }: LongShortStatsProps) {
    const StatRow = ({ label, value, isPnl = false, highlight = false }: any) => (
        <div className="flex justify-between items-center text-sm py-1">
            <span className="text-[var(--foreground-muted)]">{label}</span>
            <span className={cn(
                "font-medium",
                isPnl ? (value >= 0 ? "text-green-400" : "text-red-400") : "text-[var(--foreground)]",
                highlight && "text-blue-400"
            )}>
                {isPnl ? `${value >= 0 ? '+' : ''}$${Math.abs(value).toFixed(2)}` : value}
            </span>
        </div>
    )

    const SideCard = ({ type, stats }: { type: 'long' | 'short', stats: any }) => (
        <div className="bg-[var(--background-tertiary)] p-4 rounded-xl border border-[var(--border)] flex-1">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border)]">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    type === 'long' ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"
                )}>
                    {type === 'long' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <span className="font-bold text-[var(--foreground)] uppercase tracking-wider text-sm">
                    {type === 'long' ? 'Long' : 'Short'}
                </span>
            </div>

            <div className="space-y-2">
                <StatRow label="Trades" value={stats.trades} />
                <StatRow label="P&L" value={stats.pnl} isPnl />
                <StatRow label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} highlight />
            </div>
        </div>
    )

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <span>⚖️</span> Long vs Short
            </h3>
            <div className="flex gap-4">
                <SideCard type="long" stats={data.long} />
                <SideCard type="short" stats={data.short} />
            </div>
        </div>
    )
}
