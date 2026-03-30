'use client'
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
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-center min-h-[90px] group/item">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 group-hover/item:text-zinc-500 transition-colors">{label}</p>
            <p className={cn(
                "text-lg font-bold tracking-tight",
                type === 'win' ? "text-green-500" : type === 'loss' ? "text-red-500" : "text-white"
            )}>{value}</p>
        </div>
    )

    return (
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 h-full flex flex-col group relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest leading-none">Ratio Analysis</h3>
                    <p className="text-sm font-bold text-white mt-1.5 tracking-tight">Quick Stats</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 flex-1">
                <StatItem label="Avg Win" value={formatCurrency(data?.averageWin)} type="win" />
                <StatItem label="Avg Loss" value={formatCurrency(data?.averageLoss)} type="loss" />
                <StatItem label="Best Trade" value={formatCurrency(data?.bestTrade)} type="win" />
                <StatItem label="Worst Trade" value={formatCurrency(data?.worstTrade)} type="loss" />
            </div>
            {/* Ambient Glow */}
            <div className="absolute -top-8 -left-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>
    )
}

