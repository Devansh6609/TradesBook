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
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 h-full flex flex-col group relative overflow-hidden transition-all duration-500 hover:border-white/10">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-blue-500/10" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                    <div>
                        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] leading-none mb-1">Live_Vector_Threads</h3>
                        <p className="text-[8px] font-bold text-foreground-disabled uppercase tracking-widest">Active_Positions</p>
                    </div>
                </div>
                {trades?.length ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full backdrop-blur-md">
                        <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">{trades.length} LIVE</span>
                    </div>
                ) : null}
            </div>

            <div className="flex-1 overflow-auto scrollbar-none relative z-10">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl border border-white/5" />)}
                    </div>
                ) : !trades?.length ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5 group-hover:bg-blue-500/10 transition-colors">
                            <TrendingUp size={20} className="text-foreground-disabled group-hover:text-blue-400 transition-colors" />
                        </div>
                        <p className="text-[10px] font-black text-foreground-disabled uppercase tracking-[0.3em]">Terminal_Idle</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="pb-4 pl-2 text-[9px] font-black text-foreground-disabled uppercase tracking-[0.2em]">Symbol</th>
                                <th className="pb-4 text-[9px] font-black text-foreground-disabled uppercase tracking-[0.2em]">Type</th>
                                <th className="pb-4 pr-2 text-[9px] font-black text-foreground-disabled uppercase tracking-[0.2em] text-right">P&L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/0">
                            {trades.map(trade => (
                                <tr key={trade.id} className="group/row transition-all hover:bg-white/[0.03]">
                                    <td className="py-4 pl-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-white tracking-widest uppercase">{trade.symbol}</span>
                                            <span className="text-[8px] font-bold text-foreground-disabled uppercase tracking-tighter mt-0.5">{trade.quantity} LOTS</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={cn(
                                            "text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest",
                                            trade.type === 'BUY' ? "text-blue-400 border-blue-500/20 bg-blue-500/5" : "text-amber-400 border-amber-500/20 bg-amber-500/5"
                                        )}>
                                            {trade.type}
                                        </span>
                                    </td>
                                    <td className={cn(
                                        "py-4 pr-2 text-xs font-black text-right tracking-tight font-mono",
                                        parseFloat(trade.pnl?.toString() || '0') >= 0 ? "text-green-400" : "text-red-400"
                                    )}>
                                        {fmt(trade.pnl)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

