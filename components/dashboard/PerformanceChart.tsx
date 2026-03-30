'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/lib/apiClient'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts'

const PERIODS = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '3M', value: '3m' },
    { label: '1Y', value: '1y' },
    { label: 'All', value: 'all' },
]

import { DailyPnLPoint } from '@/types'

export function PerformanceChart() {
    const [period, setPeriod] = useState('30d')

    const { data, isLoading } = useQuery({
        queryKey: ['analytics', period],
        queryFn: () => api.analytics.dashboard({ period }),
        placeholderData: keepPreviousData,
        refetchInterval: 15000, // 15 seconds (less flicker)
    })

    const chartData = (data?.dailyPnL || []).map((d: DailyPnLPoint) => ({
        date: d.date,
        pnl: parseFloat(d.pnl),
        cumulative: parseFloat(d.cumulativePnl),
        trades: d.trades,
    }))

    const currentBalance = data?.initialBalance || 0
    const unrealizedPnl = data?.unrealizedPnl || 0
    // currentBalance already includes all realized P&L, so total equity is balance + floating
    const currentEquity = currentBalance + unrealizedPnl
    const latestCumulativePnl = chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0
    const isProfit = (latestCumulativePnl + unrealizedPnl) >= 0;

    return (
        <div className="premium-card h-full flex flex-col group">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex gap-4 items-center">
                    <div className="h-10 w-1 bg-blue-500/50 rounded-full" />
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled leading-none">Equity Curve</h3>
                        <p className={cn(
                            "text-2xl font-black mt-2 tracking-tighter sm:text-3xl",
                            isProfit ? 'text-profit-light' : 'text-loss-light'
                        )}>
                            ${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5 shadow-inner">
                        {PERIODS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={cn(
                                    "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                                    period === p.value
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-foreground-disabled hover:text-foreground hover:bg-white/5'
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]" />
                        <span className="text-[8px] font-bold text-foreground-disabled uppercase tracking-widest">Live Terminal Feed</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-[300px] relative">
                {isLoading ? (
                    <div className="h-full flex flex-col gap-4 animate-pulse">
                        <div className="flex-1 bg-white/[0.03] rounded-2xl" />
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-foreground-disabled border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                        Data Stream Offline
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isProfit ? "#3fb950" : "#f85149"} stopOpacity={0.15} />
                                    <stop offset="100%" stopColor={isProfit ? "#3fb950" : "#f85149"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 9, fill: 'var(--foreground-disabled)', fontWeight: 800 }}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                                tickFormatter={(v) => {
                                    const d = new Date(v)
                                    return format(d, 'dd MMM').toUpperCase()
                                }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fontSize: 9, fill: 'var(--foreground-disabled)', fontWeight: 800 }}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                                tickFormatter={(v) => `$${v.toLocaleString()}`}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const d = new Date(label)
                                        return (
                                            <div className="bg-background-secondary/80 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl shadow-black/50 overflow-hidden relative">
                                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                                                <p className="text-[9px] font-black text-foreground-disabled uppercase tracking-[0.1em] mb-2">{format(d, 'EEEE, d MMM yyyy').toUpperCase()}</p>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between gap-8">
                                                        <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">Equity</span>
                                                        <span className="text-[11px] font-black text-white">${payload[0].value?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-8 text-[9px] font-bold text-foreground-disabled uppercase tracking-widest">
                                                        <span>Daily</span>
                                                        <span className={cn(payload[0].payload.pnl >= 0 ? "text-profit-light" : "text-loss-light")}>
                                                            {payload[0].payload.pnl >= 0 ? '+' : ''}${payload[0].payload.pnl.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="cumulative"
                                stroke={isProfit ? "#3fb950" : "#f85149"}
                                strokeWidth={3}
                                fill="url(#chartGradient)"
                                animationDuration={2000}
                                activeDot={{ 
                                    r: 5, 
                                    fill: isProfit ? "#3fb950" : "#f85149", 
                                    stroke: "#02040a", 
                                    strokeWidth: 2,
                                    className: "shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}
