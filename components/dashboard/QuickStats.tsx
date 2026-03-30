'use client'
import { TrendingUp, TrendingDown, Target, Zap } from 'lucide-react'
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
        return `${val >= 0 ? '+' : '-'}$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const profitFactor = data ? (Math.abs(data.averageWin) / Math.abs(data.averageLoss || 1)).toFixed(2) : '0.00'

    const StatItem = ({ label, value, type, icon: Icon }: { label: string, value: string, type: 'win' | 'loss' | 'neutral', icon: any }) => (
        <div className="bg-[#121212]/50 p-5 rounded-[1.5rem] border border-white/5 hover:border-blue-500/20 transition-all flex flex-col group/item relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] group-hover/item:text-zinc-400 transition-colors">{label}</p>
                <Icon size={14} className={cn(
                    "transition-transform group-hover/item:scale-110",
                    type === 'win' ? "text-blue-400" : type === 'loss' ? "text-red-400" : "text-zinc-500"
                )} />
            </div>
            <p className={cn(
                "text-lg font-black tracking-tighter font-mono",
                type === 'win' ? "text-white" : type === 'loss' ? "text-red-500" : "text-white"
            )}>{value}</p>
        </div>
    )

    return (
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[2rem] p-7 h-full flex flex-col group relative overflow-hidden transition-all duration-500 hover:border-white/10">
            <div className="flex items-center justify-between mb-8 relative z-10 px-1">
                <div>
                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] leading-none mb-2">Execution_Matrix</h3>
                    <p className="text-xl font-black text-white tracking-tighter">Quick Analytics</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <Zap size={18} className="text-blue-400" />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 flex-1 relative z-10">
                <StatItem label="Avg Profit" value={formatCurrency(data?.averageWin)} type="win" icon={TrendingUp} />
                <StatItem label="Avg Loss" value={formatCurrency(data?.averageLoss)} type="loss" icon={TrendingDown} />
                <StatItem label="Peak Trade" value={formatCurrency(data?.bestTrade)} type="win" icon={Target} />
                <StatItem label="Bottom" value={formatCurrency(data?.worstTrade)} type="loss" icon={TrendingDown} />
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
                <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-[1.5rem] p-5 flex items-center justify-between group/pf hover:from-blue-600/20 transition-all duration-500">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Profit Factor</span>
                        <span className="text-2xl font-black text-white tracking-tighter font-mono">{profitFactor}</span>
                    </div>
                    <div className="h-10 w-10 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
                         <div className="w-6 h-6 rounded-full bg-blue-500 animate-pulse opacity-20" />
                         <span className="absolute text-[8px] font-black text-blue-400">PF</span>
                    </div>
                </div>
            </div>

            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-blue-500/10" />
        </div>
    )
}

