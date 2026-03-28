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
        refetchInterval: 1000, // Instant sync (1 second)
    })

    // Aggregate by symbol
    const performanceMap = data?.trades?.reduce((acc, trade) => {
        const symbol = trade.symbol
        const pnl = trade.pnl || 0

        if (!acc[symbol]) {
            acc[symbol] = { symbol, pnl: 0, count: 0 }
        }
        acc[symbol].pnl += pnl
        acc[symbol].count += 1
        return acc
    }, {} as Record<string, { symbol: string, pnl: number, count: number }>)

    const topPerformers = Object.values(performanceMap || {})
        .sort((a, b) => b.pnl - a.pnl)
        .slice(0, 3)

    const formatCurrency = (num: number) => {
        return `${num >= 0 ? '+' : ''}$${Math.abs(num).toFixed(2)}`
    }

    return (
        <div className="hover-card bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6">Top Performers</h3>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-[var(--background-tertiary)] rounded-xl animate-pulse" />)}
                </div>
            ) : topPerformers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Trophy className="w-8 h-8 text-[var(--foreground-muted)] mb-2" />
                    <p className="text-[var(--foreground-muted)] text-sm">No data yet</p>
                </div>
            ) : (
                <div className="space-y-3 flex-1 overflow-auto scrollbar-thin">
                    {topPerformers.map((item, index) => (
                        <div key={item.symbol} className="bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between group hover:border-[var(--border-hover)] transition-all">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg",
                                    index === 0 ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                                        index === 1 ? "bg-gray-400/10 text-gray-400 border border-gray-400/20" :
                                            "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                )}>
                                    #{index + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--foreground)] text-sm">{item.symbol}</p>
                                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{item.count} trades</p>
                                </div>
                            </div>
                            <p className={cn(
                                "font-bold text-sm",
                                item.pnl >= 0 ? "text-blue-400" : "text-red-400"
                            )}>
                                {formatCurrency(item.pnl)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
