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
        <div className="bg-zinc-900/40 p-5 rounded-[1.5rem] border border-white/5 hover:border-blue-500/20 hover:bg-zinc-800/40 transition-all flex flex-col group/item relative overflow-hidden group/it">
            <div className="flex items-center justify-between mb-4 relative z-10">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] group-hover/item:text-zinc-500 transition-colors uppercase leading-none">{label}</p>
                <Icon size={14} strokeWidth={2.5} className={cn(
                    "transition-all duration-500 group-hover/item:scale-110",
                    type === 'win' ? "text-profit-light" : type === 'loss' ? "text-loss-light" : "text-zinc-500"
                )} />
            </div>
            <p className={cn(
                "text-xl font-black tracking-tighter font-mono tabular-nums relative z-10 leading-none",
                type === 'win' ? "text-white" : type === 'loss' ? "text-loss-light/90" : "text-white"
            )}>{value}</p>
            
            {/* Hover Accent */}
            <div className={cn(
                "absolute -bottom-4 -right-4 w-12 h-12 blur-2xl opacity-0 group-hover/item:opacity-10 transition-opacity duration-500",
                type === 'win' ? "bg-profit-light" : type === 'loss' ? "bg-loss-light" : "bg-zinc-500"
            )} />
        </div>
    )

    return (
        <div className="bg-zinc-950/30 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 h-full flex flex-col group relative overflow-hidden transition-all duration-700 hover:border-blue-500/10 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-10 relative z-10 px-1">
                <div className="flex flex-col gap-1">
                    <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] leading-none">Execution Matrix</h3>
                    <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-none">Quick_Telemetry_Stats</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-all duration-500">
                    <Zap size={20} strokeWidth={2.5} className="text-blue-500 group-hover:fill-blue-500/20 transition-all" />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 flex-1 relative z-10">
                <StatItem label="Avg Profit" value={formatCurrency(data?.averageWin)} type="win" icon={TrendingUp} />
                <StatItem label="Avg Loss" value={formatCurrency(data?.averageLoss)} type="loss" icon={TrendingDown} />
                <StatItem label="Peak" value={formatCurrency(data?.bestTrade)} type="win" icon={Target} />
                <StatItem label="Bottom" value={formatCurrency(data?.worstTrade)} type="loss" icon={TrendingDown} />
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
                <div className="bg-zinc-900/40 border border-blue-500/10 rounded-[1.8rem] p-6 flex items-center justify-between group/pf hover:bg-zinc-800/40 hover:border-blue-500/30 transition-all duration-700 shadow-xl overflow-hidden relative">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl pointer-events-none group-hover/pf:bg-blue-600/10 transition-all" />
                    
                    <div className="flex flex-col gap-2 relative z-10">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] leading-none opacity-80">Alpha Factor</span>
                        <div className="flex items-baseline gap-2">
                             <span className="text-3xl font-black text-white tracking-tighter font-mono tabular-nums leading-none">{profitFactor}</span>
                             <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">PF_RATING</span>
                        </div>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-blue-600/10 border-2 border-blue-500/20 flex items-center justify-center relative shadow-inner group-hover/pf:scale-110 transition-all duration-500">
                         <div className="w-8 h-8 rounded-full bg-blue-500/10 animate-pulse-slow" />
                         <span className="absolute text-[10px] font-black text-blue-400">PF</span>
                    </div>
                </div>
            </div>

            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/[0.03] rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-150 transition-all duration-[1500ms]" />
        </div>
    )
}

