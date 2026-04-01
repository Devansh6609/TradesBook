'use client'

import { Activity, Clock } from 'lucide-react'
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
        return num < 0 ? `-$${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `$${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    }

    return (
        <div className="bg-[#0a0f1d]/40 border border-white/5 rounded-3xl p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
                    <Clock size={18} />
                </div>
                <div>
                    <h3 className="text-lg font-black font-jakarta text-white tracking-tight leading-none">Top Symbols</h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Best performing assets</p>
                </div>
            </div>

            {symbols.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-10 opacity-20">
                    <Activity size={40} className="mb-4 text-white" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">System Standby</p>
                </div>
            ) : (
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                    {symbols.map((sym, index) => (
                        <div 
                            key={sym.symbol} 
                            className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/0 hover:border-white/10 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-[#111111] border border-white/5 flex items-center justify-center text-[10px] font-black text-blue-500 shadow-xl">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-black text-white text-sm font-jakarta tracking-tight">{sym.symbol}</p>
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.1em] mt-0.5">
                                        {sym.trades} trades • {sym.winRate.toFixed(0)}% win
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn(
                                    "font-black text-base font-jakarta tracking-tighter",
                                    sym.pnl >= 0 ? "text-blue-500" : "text-red-500"
                                )}>
                                    {formatCurrency(sym.pnl)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
