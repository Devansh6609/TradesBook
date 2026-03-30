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
        <div className="bg-[#121212] p-4 rounded-xl border border-white/5 flex flex-col justify-center min-h-[90px]">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">{label}</p>
            <p className={cn(
                "text-lg font-bold tracking-tight",
                type === 'win' ? "text-blue-400" : type === 'loss' ? "text-white" : "text-white"
            )}>{value}</p>
        </div>
    )

    return (
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 h-full flex flex-col group relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-sm font-bold text-white tracking-tight">Quick Stats</h3>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 flex-1">
                <StatItem label="AVG WIN" value={formatCurrency(data?.averageWin)} type="win" />
                <StatItem label="AVG LOSS" value={formatCurrency(data?.averageLoss)} type="loss" />
                <StatItem label="BEST TRADE" value={formatCurrency(data?.bestTrade)} type="win" />
                <StatItem label="WORST TRADE" value={formatCurrency(data?.worstTrade)} type="loss" />
                <div className="col-span-2">
                    <StatItem label="PROFIT FACTOR" value="∞" type="neutral" />
                </div>
            </div>
        </div>
    )
}

