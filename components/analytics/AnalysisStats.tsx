'use client'

import { Trophy, TrendingDown, Flame, AlertCircle, Target, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface AnalysisStatsProps {
    data: {
        bestTrade: string | number
        worstTrade: string | number
        winStreak: number
        lossStreak: number
        riskRewardRatio: number | string
        openTrades: number
    }
}

export function AnalysisStats({ data }: AnalysisStatsProps) {
    const StatItem = ({ label, value, subValue, icon: Icon, colorClass }: any) => (
        <div className="bg-[var(--background-tertiary)] p-4 rounded-xl border border-[var(--border)] flex flex-col justify-between min-h-[100px]">
            <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest">{label}</p>
                {Icon && <Icon className={cn("w-4 h-4 opacity-50", colorClass)} />}
            </div>
            <div>
                <p className={cn("text-xl font-bold text-[var(--foreground)]", colorClass)}>{value}</p>
                {subValue && <p className="text-xs text-[var(--foreground-muted)] mt-1">{subValue}</p>}
            </div>
        </div>
    )

    const formatCurrency = (val: string | number | undefined | null) => {
        if (val === undefined || val === null) return '$0.00'
        const num = typeof val === 'string' ? parseFloat(val) : val
        if (isNaN(num as number)) return '$0.00'
        return `$${(num as number).toFixed(2)}`
    }

    const rr = data?.riskRewardRatio ? (typeof data.riskRewardRatio === 'number' ? data.riskRewardRatio : parseFloat(data.riskRewardRatio)) : 0

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Best Trade */}
            <StatItem
                label="Best Trade"
                value={formatCurrency(data?.bestTrade)}
                icon={Trophy}
                colorClass="text-blue-400"
            />

            {/* Worst Trade */}
            <StatItem
                label="Worst Trade"
                value={formatCurrency(data?.worstTrade)}
                icon={TrendingDown}
                colorClass="text-red-400"
            />

            {/* Win Streak */}
            <StatItem
                label="Win Streak"
                value={`${data?.winStreak ?? 0} trades`}
                icon={Flame}
                colorClass="text-orange-400"
            />

            {/* Loss Streak */}
            <StatItem
                label="Loss Streak"
                value={`${data?.lossStreak ?? 0} trades`}
                icon={AlertCircle}
                colorClass="text-gray-400"
            />

            {/* Risk Reward */}
            <StatItem
                label="Risk:Reward"
                value={`1:${isNaN(rr) ? '0.00' : rr.toFixed(2)}`}
                icon={Target}
                colorClass="text-purple-400"
            />

            {/* Open Trades */}
            <StatItem
                label="Open Trades"
                value={data?.openTrades ?? 0}
                icon={Activity}
                colorClass="text-[var(--foreground)]"
            />
        </div>
    )
}
