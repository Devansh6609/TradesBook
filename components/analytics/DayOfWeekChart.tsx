'use client'

import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DayOfWeekChartProps {
    data: {
        day: string
        pnl: number
        trades: number
        winRate: number
    }[]
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
    const formatCurrency = (val: number) => {
        if (Math.abs(val) < 0.01) return '-'
        return val < 0 ? `-$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    }

    // Ensure we have all days even if not in data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const displayData = days.map(dayName => {
        const d = data.find(item => item.day === dayName)
        return d || { day: dayName, pnl: 0, trades: 0, winRate: 0 }
    })

    const maxPnl = Math.max(...displayData.map(d => Math.abs(d.pnl)), 1)

    return (
        <div className="bg-[#0a0f1d]/40 border border-white/5 rounded-3xl p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
                    <Calendar size={18} />
                </div>
                <div>
                    <h3 className="text-lg font-black font-jakarta text-white tracking-tight leading-none">Day Performance</h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Find your best trading days</p>
                </div>
            </div>

            <div className="space-y-3 flex-1">
                {displayData.map((item) => {
                    const width = (Math.abs(item.pnl) / maxPnl) * 100
                    const isPositive = item.pnl >= 0
                    const hasActivity = Math.abs(item.pnl) > 0

                    return (
                        <div key={item.day} className="flex items-center gap-4 group">
                            <span className="text-[10px] font-black text-white/20 uppercase w-8 tracking-wider">{item.day}</span>
                            <div className="flex-1 h-6 bg-white/[0.02] rounded-md border border-white/5 relative overflow-hidden">
                                {hasActivity && (
                                    <div 
                                        className={cn(
                                            "h-full transition-all duration-1000",
                                            isPositive ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]" : "bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                                        )}
                                        style={{ width: `${width}%` }}
                                    />
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-black w-20 text-right font-jakarta tracking-tight whitespace-nowrap",
                                !hasActivity ? "text-white/10" : (isPositive ? "text-blue-500" : "text-red-500")
                            )}>
                                {formatCurrency(item.pnl)}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
