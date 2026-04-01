import { StatCard } from './StatCard'
import { TrendingUp, TrendingDown, Trophy, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

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
    const [monitorId, setMonitorId] = useState<string>('')

    useEffect(() => {
        setMonitorId(Math.random().toString(16).slice(2, 8).toUpperCase())
    }, [])

    const formatCurrency = (val: number | undefined) => {
        if (val === undefined || val === null) return '$0.00'
        return `${val >= 0 ? '+' : ''}$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return (
        <div className="bg-background-secondary border border-border rounded-2xl p-6 h-full flex flex-col relative overflow-hidden group">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-0.5">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground flex items-center gap-2">
                        <span className="w-1 h-3 bg-blue-500 rounded-full" />
                        Performance_Matrix
                    </h3>
                    <p className="text-[9px] font-bold text-foreground-disabled uppercase tracking-widest pl-3 opacity-50">Aggregate_Metrics_v2.0</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                    <span className="text-[8px] font-mono text-foreground-disabled/50 uppercase tracking-tighter">Live_Telemetry</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="relative p-4 rounded-xl bg-background-tertiary border border-white/5 space-y-3 group/stat hover:border-blue-500/20 transition-all">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-profit animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground-disabled">Avg_Yield_Win</span>
                    </div>
                    <p className="text-xl font-black font-mono text-profit-light tracking-tighter">
                        {formatCurrency(data?.averageWin)}
                    </p>
                    <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-profit/10 to-transparent" />
                </div>

                <div className="relative p-4 rounded-xl bg-background-tertiary border border-white/5 space-y-3 group/stat hover:border-red-500/20 transition-all">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-loss animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground-disabled">Avg_Yield_Loss</span>
                    </div>
                    <p className="text-xl font-black font-mono text-loss-light tracking-tighter">
                        {formatCurrency(data?.averageLoss)}
                    </p>
                    <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-loss/10 to-transparent" />
                </div>

                <div className="relative p-4 rounded-xl bg-background-tertiary border border-white/5 space-y-3 group/stat hover:shadow-inner transition-all">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500/50" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground-disabled">Peak_Signal</span>
                    </div>
                    <p className="text-xl font-black font-mono text-foreground tracking-tighter">
                        {formatCurrency(data?.bestTrade)}
                    </p>
                    <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/5 to-transparent" />
                </div>

                <div className="relative p-4 rounded-xl bg-background-tertiary border border-white/5 space-y-3 group/stat hover:shadow-inner transition-all">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground-disabled">Delta_Floor</span>
                    </div>
                    <p className="text-xl font-black font-mono text-foreground tracking-tighter">
                        {formatCurrency(data?.worstTrade)}
                    </p>
                    <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
            </div>

            {/* Terminal Decoration */}
            <div className="mt-6 pt-4 border-t border-white/[0.03] flex items-center justify-between">
                <div className="h-1 flex-1 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent" />
                <span className="text-[7px] font-mono text-foreground-disabled/30 ml-4">MNTR_ID: {monitorId || '------'}</span>
            </div>
        </div>
    )
}
