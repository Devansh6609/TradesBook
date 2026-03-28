import { StatCard } from './StatCard'
import { TrendingUp, TrendingDown, Trophy, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickStatsProps {
    data: {
        averageWin: number
        averageLoss: number
        bestTrade: number
        worstTrade: number
        [key: string]: any
    } | undefined
}

export function QuickStats({ data }: QuickStatsProps) {
    const formatCurrency = (val: number | undefined) => {
        if (val === undefined || val === null) return '$0.00'
        return `${val >= 0 ? '+' : ''}$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const StatItem = ({ label, value, type }: { label: string, value: string, type: 'win' | 'loss' | 'neutral' }) => (
        <div className="bg-[var(--background-tertiary)] p-4 rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors flex flex-col justify-center min-h-[100px]">
            <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-2">{label}</p>
            <p className={cn(
                "text-xl font-bold",
                type === 'win' ? "text-blue-400" : type === 'loss' ? "text-red-400" : "text-[var(--foreground)]"
            )}>{value}</p>
        </div>
    )

    return (
        <div className="hover-card bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4 flex-1">
                <StatItem label="Avg Win" value={formatCurrency(data?.averageWin)} type="win" />
                <StatItem label="Avg Loss" value={formatCurrency(data?.averageLoss)} type="loss" />
                <StatItem label="Best Trade" value={formatCurrency(data?.bestTrade)} type="win" />
                <StatItem label="Worst Trade" value={formatCurrency(data?.worstTrade)} type="loss" />

                {/* Profit Factor - Optional Addition if available in data, else placeholder/removed */}
                {/* <div className="col-span-2 bg-[#12161f] p-4 rounded-xl border border-gray-800/50">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Profit Factor</p>
                    <p className="text-xl font-bold text-white">∞</p>
                </div> */}
            </div>
        </div>
    )
}
