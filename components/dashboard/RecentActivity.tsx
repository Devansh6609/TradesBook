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
        <div className="hover-card bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Recent Activity</h3>
                <span className="px-2 py-1 bg-[var(--background-tertiary)] text-xs text-[var(--foreground-muted)] rounded-md">{data?.trades?.length || 0} trades</span>
            </div>

            <div className="flex-1 overflow-auto scrollbar-thin scroll-smooth space-y-3">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[var(--background-tertiary)] rounded-xl animate-pulse" />)}
                    </div>
                ) : !data?.trades?.length ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-6 h-6 text-[var(--foreground-muted)]" />
                        </div>
                        <p className="text-[var(--foreground-muted)] text-sm">No recent activity</p>
                    </div>
                ) : (
                    data.trades.map(trade => {
                        const pnl = trade.pnl || 0
                        const isProfit = pnl >= 0

                        return (
                            <div key={trade.id} className="bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between group hover:border-[var(--border-hover)] transition-all">
                                <div className="flex items-center gap-4">
                                    <AssetIcon symbol={trade.symbol} size="md" className="shrink-0" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[var(--foreground)]">{trade.symbol}</span>
                                            <span className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                                                trade.type === 'BUY' ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"
                                            )}>
                                                {trade.type}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                                            {format(new Date(trade.exitDate || new Date()), 'MMM d')}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs text-[var(--foreground-muted)] mb-0.5">
                                        {Number(trade.quantity || 0).toFixed(2)} lots
                                    </p>
                                    <p className={cn(
                                        "font-bold text-sm",
                                        isProfit ? "text-blue-400" : "text-red-400"
                                    )}>
                                        {fmt(trade.pnl)}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
