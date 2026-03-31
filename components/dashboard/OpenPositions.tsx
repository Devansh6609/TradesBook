'use client'

import { useQuery } from '@tanstack/react-query'
import { TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, Trade } from '@/lib/apiClient'

export function OpenPositions() {
    const { data: trades, isLoading } = useQuery<Trade[]>({
        queryKey: ['trades', 'open'],
        queryFn: async () => {
            const res = await api.trades.list({ status: 'OPEN' });
            return res.trades;
        },
        refetchInterval: 1000, 
    })

    const fmt = (val: string | number | undefined | null) => {
        if (val === undefined || val === null) return '$0.00'
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return `${num >= 0 ? '+' : ''}$${Math.abs(num).toFixed(2)}`
    }

    return (
        <div className="bg-zinc-950/30 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 h-full flex flex-col group relative overflow-hidden transition-all duration-700 hover:border-blue-500/10 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none transition-all duration-1000 group-hover:scale-125" />
            
            <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                    <div className="flex flex-col gap-1">
                        <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] leading-none">Live Threads</h3>
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-none">Active_Position_Flow</p>
                    </div>
                </div>
                {trades?.length ? (
                    <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-md shadow-inner">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest leading-none">{trades.length} LIVE</span>
                    </div>
                ) : null}
            </div>

            <div className="flex-1 overflow-auto scrollbar-none relative z-10 -mx-2 px-2">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/[0.02] animate-pulse rounded-3xl border border-white/5" />)}
                    </div>
                ) : !trades?.length ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                        <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center mb-6 border border-white/5 group-hover:bg-blue-500/10 transition-all duration-500">
                            <TrendingUp size={24} className="text-zinc-800 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <p className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.5em]">BUFFER_CLEAR</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="pb-5 pl-4 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Sector</th>
                                <th className="pb-5 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Mode</th>
                                <th className="pb-5 pr-4 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] text-right">Delta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/0">
                            {trades.map(trade => {
                                const pnlNum = parseFloat(trade.pnl?.toString() || '0');
                                const isPos = pnlNum >= 0;
                                
                                return (
                                    <tr key={trade.id} className="group/row transition-all hover:bg-zinc-900/40 cursor-default">
                                        <td className="py-5 pl-4 rounded-l-3xl border-y border-l border-transparent group-hover/row:border-white/5">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[15px] font-black text-white tracking-widest uppercase">{trade.symbol}</span>
                                                <div className="flex items-center gap-2">
                                                     <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-none">Vol. {trade.quantity}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 border-y border-transparent group-hover/row:border-white/5">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-[0.2em] shadow-inner",
                                                trade.type === 'BUY' ? "text-blue-400 border-blue-500/20 bg-blue-500/5 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]" : "text-orange-400 border-orange-500/20 bg-orange-500/5 shadow-[inset_0_0_10px_rgba(251,146,60,0.1)]"
                                            )}>
                                                 <div className={cn("w-1 h-1 rounded-full", trade.type === 'BUY' ? "bg-blue-400" : "bg-orange-400")} />
                                                {trade.type}
                                            </div>
                                        </td>
                                        <td className="py-5 pr-4 text-right rounded-r-3xl border-y border-r border-transparent group-hover/row:border-white/5">
                                            <div className="flex flex-col gap-1">
                                                <span className={cn(
                                                    "text-[18px] font-black font-mono tracking-tighter tabular-nums drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]",
                                                    isPos ? "text-profit-light" : "text-loss-light"
                                                )}>
                                                    {fmt(trade.pnl)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            
             <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                <div className="flex items-center gap-2">
                    <AlertCircle size={12} className="text-zinc-700" />
                    <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Mark_To_Market_RT</span>
                </div>
                <div className="h-1 w-12 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-blue-500/30 animate-shimmer" />
                </div>
            </div>
        </div>
    )
}

