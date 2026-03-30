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
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 h-full flex flex-col group relative overflow-hidden transition-all duration-500 hover:border-white/10">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-blue-500/10" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                    <div>
                        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] leading-none mb-1">Archived_Vectors</h3>
                        <p className="text-[8px] font-bold text-foreground-disabled uppercase tracking-widest">Recent_Activity_Log</p>
                    </div>
                </div>
                <div className="h-6 px-3 rounded-full bg-white/5 border border-white/5 flex items-center">
                    <span className="text-[9px] font-black text-foreground-disabled uppercase tracking-widest">{data?.trades?.length || 0} Records</span>
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-auto scrollbar-none relative z-10">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl border border-white/5" />)}
                    </div>
                ) : !data?.trades?.length ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                            <CheckCircle2 size={20} className="text-foreground-disabled" />
                        </div>
                        <p className="text-[10px] font-black text-foreground-disabled uppercase tracking-[0.3em]">Log_Buffer_Empty</p>
                    </div>
                ) : (
                    data.trades.map(trade => {
                        const pnl = trade.pnl || 0
                        const isProfit = pnl >= 0

                        return (
                            <div key={trade.id} className="flex items-center justify-between p-4 rounded-2xl border border-white/0 hover:border-white/5 hover:bg-white/[0.02] transition-all group/item duration-500">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover/item:scale-105 group-hover/item:border-blue-500/30">
                                            <AssetIcon symbol={trade.symbol} size="sm" />
                                        </div>
                                        {isProfit ? (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                                        ) : (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-black text-white tracking-widest uppercase">{trade.symbol}</span>
                                            <div className={cn(
                                                "w-1 h-1 rounded-full",
                                                trade.type === 'BUY' ? "bg-blue-400" : "bg-amber-400"
                                            )} />
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-[0.2em]",
                                                trade.type === 'BUY' ? "text-blue-400" : "text-amber-400"
                                            )}>
                                                {trade.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-50 group-hover/item:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-bold text-foreground-disabled uppercase tracking-tighter">
                                                {format(new Date(trade.exitDate || new Date()), 'MMM dd, HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={cn(
                                        "text-sm font-black font-mono tracking-tight transition-all duration-500 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                                        isProfit ? "text-green-400 group-hover/item:text-green-300" : "text-red-400 group-hover/item:text-red-300"
                                    )}>
                                        {fmt(trade.pnl)}
                                    </div>
                                    <p className="text-[9px] font-black text-foreground-disabled mt-1 uppercase tracking-widest opacity-40 group-hover/item:opacity-80 transition-opacity">
                                        {Number(trade.quantity || 0).toFixed(2)} LOTS
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
            
            <button className="mt-8 text-[9px] font-black text-foreground-disabled uppercase tracking-[0.3em] hover:text-white transition-colors flex items-center gap-2 group/btn relative z-10 w-fit">
                <span>Synchronize_History</span>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse transition-transform" />
            </button>
        </div>
    )
}

