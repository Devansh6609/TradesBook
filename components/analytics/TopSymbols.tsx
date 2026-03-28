'use client'

import { Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Trade {
    symbol: string
    pnl?: number
    netPnl?: number
    status: string
}

interface TopSymbolsProps {
    trades: Trade[]
}

export function TopSymbols({ trades }: TopSymbolsProps) {
    const getSymbolStats = () => {
        const closedTrades = trades.filter(t => t.status === 'CLOSED')
        const symbolMap = new Map<string, { trades: number; wins: number; pnl: number }>()

        for (const trade of closedTrades) {
            const rawPnl = trade.netPnl !== undefined ? trade.netPnl : (trade.pnl || 0)
            const pnl = typeof rawPnl === 'string' ? parseFloat(rawPnl) : Number(rawPnl)
            if (!symbolMap.has(trade.symbol)) {
                symbolMap.set(trade.symbol, { trades: 0, wins: 0, pnl: 0 })
            }
            const data = symbolMap.get(trade.symbol)!
            data.trades++
            if (pnl > 0) data.wins++
            data.pnl += pnl
        }

        return Array.from(symbolMap.entries())
            .map(([symbol, data]) => ({
                symbol,
                trades: data.trades,
                winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
                pnl: data.pnl
            }))
            .sort((a, b) => b.pnl - a.pnl)
            .slice(0, 5) // top 5
    }

    const symbols = getSymbolStats()

    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return '$0.00'
        return num < 0 ? `-$${Math.abs(num).toFixed(2)}` : `$${num.toFixed(2)}`
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 h-full">
            <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-[var(--foreground-muted)]" />
                <div>
                    <h3 className="font-bold text-[var(--foreground)] text-lg">Top Symbols</h3>
                    <p className="text-xs text-[var(--foreground-muted)]">Best performing assets</p>
                </div>
            </div>

            {symbols.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-sm text-[var(--foreground-muted)]">No closed trades yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {symbols.map((sym, index) => (
                        <div key={sym.symbol} className="bg-[var(--background-tertiary)] p-3 rounded-xl border border-[var(--border)] flex items-center justify-between transition-all hover:bg-[var(--input-bg)]">
                            <div className="flex items-center gap-4">
                                <div className="w-6 h-6 rounded bg-[var(--input-bg)] flex items-center justify-center text-xs font-bold text-blue-400">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--foreground)]">{sym.symbol}</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">
                                        {sym.trades} trades • {sym.winRate.toFixed(0)}% win
                                    </p>
                                </div>
                            </div>
                            <p className={cn("font-bold", sym.pnl >= 0 ? "text-blue-400" : "text-red-400")}>
                                {formatCurrency(sym.pnl)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
