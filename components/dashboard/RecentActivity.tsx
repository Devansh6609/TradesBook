'use client'

import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { AssetIcon } from "@/components/market/AssetIcon"

import { api, type Trade } from '@/lib/apiClient'

export function RecentActivity() {
    const { data, isLoading } = useQuery({
        queryKey: ['trades', 'recent'],
        queryFn: async () => {
            const res = await api.trades.list({ status: 'CLOSED', limit: 5 })
            return { trades: res.trades }
        },
        refetchInterval: 1000, 
    })

    const fmt = (val: number | null | undefined) => {
        if (!val) return '$0.00'
        return `${val >= 0 ? '+' : ''}$${Math.abs(val).toFixed(2)}`
    }

    return (
        <div className="bg-zinc-950/30 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 h-full flex flex-col group relative overflow-hidden transition-all duration-700 hover:border-blue-500/10">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none transition-all duration-1000 group-hover:scale-125" />
            
            <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                    <div className="flex flex-col gap-1">
                        <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] leading-none">Activity Stream</h3>
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-none">Automated_Historical_Log</p>
                    </div>
                </div>
                <div className="h-8 px-4 rounded-full bg-zinc-900/50 border border-white/5 flex items-center shadow-inner">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{data?.trades?.length || 0} SECTORS</span>
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-auto scrollbar-none relative z-10 -mx-2 px-2">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-white/2 animate-pulse rounded-3xl border border-white/5" />)}
                    </div>
                ) : !data?.trades?.length ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20 border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <div className="w-16 h-16 rounded-full bg-white/2 flex items-center justify-center mb-6 border border-white/5">
                            <CheckCircle2 size={24} className="text-zinc-800" />
                        </div>
                        <p className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.5em]">BUFFER_CLEARED</p>
                    </div>
                ) : (
                    data.trades.map(trade => {
                        const pnl = trade.pnl || 0
                        const isProfit = pnl >= 0

                        return (
                            <div key={trade.id} className="flex items-center justify-between p-5 rounded-3xl border border-white/0 hover:border-white/5 hover:bg-zinc-900/40 transition-all group/item duration-500">
                                <div className="flex items-center gap-5">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover/item:scale-105 group-hover/item:border-blue-500/20 shadow-2xl">
                                            <AssetIcon symbol={trade.symbol} size="sm" />
                                        </div>
                                        <div className={cn(
                                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-950 shadow-lg",
                                            isProfit ? "bg-green-500" : "bg-red-500"
                                        )} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[15px] font-black text-white tracking-widest uppercase">{trade.symbol}</span>
                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-900 rounded-lg border border-white/5">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    trade.type === 'BUY' ? "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]" : "bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.5)]"
                                                )} />
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-[0.25em]",
                                                    trade.type === 'BUY' ? "text-blue-400" : "text-orange-400"
                                                )}>
                                                    {trade.type}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest opacity-60">
                                            {format(new Date(trade.exitDate || new Date()), 'HH:mm:ss · MMM dd')}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right flex flex-col gap-2">
                                    <div className={cn(
                                        "text-[18px] font-black font-mono tracking-tighter tabular-nums transition-all duration-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)]",
                                        isProfit ? "text-profit-light opacity-90 group-hover/item:opacity-100" : "text-loss-light opacity-90 group-hover/item:opacity-100"
                                    )}>
                                        {fmt(trade.pnl)}
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                         <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em]">{Number(trade.quantity || 0).toFixed(2)} VOL</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
            
            <button className="mt-10 px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] hover:text-white hover:bg-white/[0.04] transition-all duration-500 flex items-center justify-center gap-3 group/btn w-full">
                <span>Synchronize_History</span>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            </button>
        </div>
    )
}

