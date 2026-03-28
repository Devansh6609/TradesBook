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
        refetchInterval: 1000, // Instant sync (1 second)
    })

    // Format currency helper
    const fmt = (val: string | number | undefined | null) => {
        if (val === undefined || val === null) return '$0.00'
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return `${num >= 0 ? '+' : ''}$${Math.abs(num).toFixed(2)}`
    }

    return (
        <div className="hover-card bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Open Positions</h3>
                {trades?.length ? (
                    <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                        {trades.length}
                    </span>
                ) : null}
            </div>

            <div className="flex-1 overflow-auto scrollbar-thin scroll-smooth">
                {isLoading ? (
                    <div className="flex flex-col gap-2 mt-2">
                        {[1, 2].map(i => <div key={i} className="h-12 bg-[var(--background-tertiary)] rounded animate-pulse" />)}
                    </div>
                ) : !trades?.length ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mb-3">
                            <TrendingUp className="w-6 h-6 text-[var(--foreground-muted)]" />
                        </div>
                        <p className="text-[var(--foreground-muted)] text-sm">No open positions</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-[var(--foreground-muted)] font-medium">
                                <tr className="text-left border-b border-[var(--border)]">
                                    <th className="pb-2 pl-2">SYMBOL</th>
                                    <th className="pb-2">TYPE</th>
                                    <th className="pb-2">SIZE</th>
                                    <th className="pb-2 pr-2 text-right">P&L</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {trades.map(trade => (
                                    <tr key={trade.id} className="group hover:bg-[var(--foreground)]/5 transition-colors">
                                        <td className="py-3 pl-2 font-medium text-[var(--foreground)]">{trade.symbol}</td>
                                        <td className="py-3">
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                                trade.type === 'BUY' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                            )}>
                                                {trade.type}
                                            </span>
                                        </td>
                                        <td className="py-3 text-[var(--foreground-muted)]">{trade.quantity}</td>
                                        <td className={cn(
                                            "py-3 pr-2 text-right font-medium",
                                            parseFloat(trade.pnl?.toString() || '0') >= 0 ? "text-green-400" : "text-red-400"
                                        )}>
                                            {fmt(trade.pnl)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
