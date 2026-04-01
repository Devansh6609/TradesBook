'use client'

import { Trophy, TrendingDown, Flame, AlertCircle, Target, Activity, Percent, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisStatsProps {
    data: {
        avgWinner: number | string
        avgLoser: number | string
        bestTrade: number | string
        worstTrade: number | string
        winStreak: number
        lossStreak: number
        riskRewardRatio: number | string
        openTrades: number
    }
}

export function AnalysisStats({ data }: AnalysisStatsProps) {
    const StatItem = ({ label, value, colorClass }: { label: string, value: string | number, colorClass?: string }) => (
        <div className="flex flex-col gap-1">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{label}</p>
            <p className={cn("text-base font-black tracking-tight font-jakarta", colorClass || "text-white")}>{value}</p>
        </div>
    )

    const formatCurrency = (val: string | number | undefined | null) => {
        if (val === undefined || val === null) return '$0.00'
        const num = typeof val === 'string' ? parseFloat(val) : val
        if (isNaN(num as number)) return '$0.00'
        return `$${Math.abs(num as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const rr = data?.riskRewardRatio ? (typeof data.riskRewardRatio === 'number' ? data.riskRewardRatio : parseFloat(data.riskRewardRatio)) : 0

    return (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Activity size={16} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Quick Stats</h3>
            </div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-4 flex-1">
                <StatItem
                    label="Avg Winner"
                    value={formatCurrency(data?.avgWinner)}
                    colorClass="text-blue-500"
                />
                <StatItem
                    label="Avg Loser"
                    value={formatCurrency(data?.avgLoser)}
                    colorClass="text-red-500"
                />

                <StatItem
                    label="Best Trade"
                    value={formatCurrency(data?.bestTrade)}
                    colorClass="text-blue-500"
                />
                <StatItem
                    label="Worst Trade"
                    value={formatCurrency(data?.worstTrade)}
                    colorClass="text-red-500"
                />

                <StatItem
                    label="Win Streak"
                    value={`${data?.winStreak ?? 0} TRADES`}
                    colorClass="text-blue-500"
                />
                <StatItem
                    label="Loss Streak"
                    value={`${data?.lossStreak ?? 0} TRADES`}
                    colorClass="text-white/40"
                />

                <StatItem
                    label="Risk:Reward"
                    value={`1:${isNaN(rr) ? '0.00' : rr.toFixed(2)}`}
                    colorClass="text-blue-500"
                />
                <StatItem
                    label="Open Trades"
                    value={data?.openTrades ?? 0}
                    colorClass="text-white"
                />
            </div>
        </div>
    )
}
