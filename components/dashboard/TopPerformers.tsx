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
        <div className="bg-zinc-950/30 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 h-full flex flex-col group relative overflow-hidden transition-all duration-700 hover:border-blue-500/10 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none transition-all duration-1000 group-hover:scale-125" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                    <div className="flex flex-col gap-1">
                        <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] leading-none">Asset Alpha</h3>
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-none">Top_Ranking_Nodes</p>
                    </div>
                </div>
                <Trophy size={18} className="text-blue-500/40 group-hover:text-blue-500 transition-colors duration-500" strokeWidth={2.5} />
            </div>

            <div className="space-y-2 flex-1 overflow-auto scrollbar-none relative z-10 px-1">
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/[0.02] animate-pulse rounded-2xl" />)}
                    </div>
                ) : topPerformers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-50 border border-dashed border-white/5 rounded-3xl">
                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-white/5">
                            <Trophy size={20} className="text-zinc-800" />
                        </div>
                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">RANK_BUFFER_EMPTY</p>
                    </div>
                ) : (
                    topPerformers.map((item, index) => (
                        <div key={item.symbol} className="flex items-center justify-between p-4 rounded-2xl border border-white/0 hover:border-white/5 hover:bg-zinc-900/40 transition-all group/item duration-500">
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center font-black text-[9px] transition-all duration-500 group-hover/item:scale-105 shadow-lg relative overflow-hidden",
                                    index === 0 ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" :
                                    index === 1 ? "bg-zinc-900 text-zinc-400 border border-white/5" :
                                    "bg-zinc-950 text-zinc-600 border border-white/5"
                                )}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                    <span className="relative z-10">#{index + 1}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-[14px] font-black text-white tracking-widest uppercase leading-none">{item.symbol}</p>
                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none opacity-60 group-hover/item:opacity-100 transition-opacity">{item.count} EXECUTIONS</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn(
                                    "text-[16px] font-black tracking-tighter font-mono transition-all duration-500 tabular-nums drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]",
                                    item.pnl >= 0 ? "text-profit-light" : "text-loss-light"
                                )}>
                                    {formatCurrency(item.pnl)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* Ambient Glow */}
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
        </div>
    )
}

