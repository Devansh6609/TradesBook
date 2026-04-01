'use client'

import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LongShortStatsProps {
    data: {
        long: {
            trades: number
            pnl: number
            winRate: number
        }
        short: {
            trades: number
            pnl: number
            winRate: number
        }
    }
}

export function LongShortStats({ data }: LongShortStatsProps) {
    const formatCurrency = (val: number) => {
        return val < 0 ? `-$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    }

    const SideCard = ({ type, stats }: { type: 'long' | 'short', stats: any }) => {
        const isLong = type === 'long'
        return (
            <div className={cn(
                "group relative bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 transition-all duration-300",
                isLong ? "hover:border-blue-500/20" : "hover:border-red-500/20"
            )}>
                <div className="flex items-center gap-3 mb-6">
                    <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center border transition-colors",
                        isLong 
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white" 
                            : "bg-red-500/10 text-red-500 border-red-500/20 group-hover:bg-red-500 group-hover:text-white"
                    )}>
                        {isLong ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <span className="font-black text-white text-base tracking-tight font-jakarta">
                        {isLong ? 'Long' : 'Short'}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5 leading-none">TRADES</p>
                        <p className="text-base font-black text-white font-jakarta tracking-tighter">{stats.trades}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5 leading-none">P&L</p>
                        <p className={cn(
                            "text-base font-black font-jakarta tracking-tighter",
                            stats.pnl >= 0 ? "text-blue-500" : "text-red-500"
                        )}>
                            {formatCurrency(stats.pnl)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5 leading-none">WIN %</p>
                        <p className="text-base font-black text-blue-500 font-jakarta tracking-tighter">
                            {stats.winRate.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[#0a0f1d]/40 border border-white/5 rounded-3xl p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
                    <TrendingUp size={18} />
                </div>
                <div>
                    <h3 className="text-lg font-black font-jakarta text-white tracking-tight leading-none">Long vs Short</h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Performance by trade direction</p>
                </div>
            </div>
            
            <div className="flex flex-col gap-4 flex-1">
                <SideCard type="long" stats={data.long} />
                <SideCard type="short" stats={data.short} />
            </div>
        </div>
    )
}
