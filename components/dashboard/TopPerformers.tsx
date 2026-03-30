'use client'

import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

import { type Trade } from '@/lib/apiClient'

export function TopPerformers() {
    const { data, isLoading } = useQuery({
        queryKey: ['trades', 'all-closed'],
        queryFn: async () => {
            const { api } = await import('@/lib/apiClient')
            const res = await api.trades.list({ status: 'CLOSED', limit: 50 })
            return { trades: res.trades }
        },
        refetchInterval: 1000, 
    })

    const performanceMap = data?.trades?.reduce((acc, trade) => {
        const symbol = trade.symbol
        const pnl = trade.pnl || 0

        const key = symbol || 'Unknown'
        if (!acc[key]) {
            acc[key] = { symbol: key, pnl: 0, count: 0 }
        }
        acc[key].pnl += Number(pnl)
        acc[key].count += 1
        return acc
    }, {} as Record<string, { symbol: string, pnl: number, count: number }>)

    const topPerformers = Object.values(performanceMap || {})
        .sort((a, b) => b.pnl - a.pnl)
        .slice(0, 3)

    const formatCurrency = (num: number) => {
        return `${num >= 0 ? '+' : ''}$${Math.abs(num).toFixed(2)}`
    }

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 h-full flex flex-col group relative overflow-hidden transition-all duration-500 hover:border-white/10">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-blue-500/10" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                    <div>
                        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] leading-none mb-1">Asset_Alpha</h3>
                        <p className="text-[8px] font-bold text-foreground-disabled uppercase tracking-widest">Top_Performers_Rank</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 flex-1 overflow-auto scrollbar-none">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-zinc-900 animate-pulse rounded-xl" />)}
                    </div>
                ) : topPerformers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-50">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
                            <Trophy size={16} className="text-zinc-600" />
                        </div>
                        <p className="text-xs text-zinc-500 font-medium">No Performance Data</p>
                    </div>
                ) : (
                    topPerformers.map((item, index) => (
                        <div key={item.symbol} className="flex items-center justify-between p-4 rounded-2xl border border-white/0 hover:border-white/5 hover:bg-white/[0.02] transition-all group/item duration-500">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-11 h-11 rounded-xl flex items-center justify-center font-black text-[10px] ring-1 ring-white/10 transition-all duration-500 group-hover/item:scale-105",
                                    index === 0 ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" :
                                    index === 1 ? "bg-zinc-800/50 text-zinc-300 border border-white/10" :
                                    "bg-zinc-900/50 text-zinc-500 border border-white/5"
                                )}>
                                    RANK_{index + 1}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-black text-white tracking-widest uppercase">{item.symbol}</p>
                                    <p className="text-[9px] font-black text-foreground-disabled mt-1 uppercase tracking-widest opacity-40 group-hover/item:opacity-80 transition-opacity">{item.count} EXECUTIONS</p>
                                </div>
                            </div>
                            <p className={cn(
                                "text-sm font-black tracking-tight font-mono transition-all duration-500 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                                item.pnl >= 0 ? "text-green-400 group-hover/item:text-green-300" : "text-red-400 group-hover/item:text-red-300"
                            )}>
                                {formatCurrency(item.pnl)}
                            </p>
                        </div>
                    ))
                )}
            </div>
            {/* Ambient Glow */}
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>
    )
}

