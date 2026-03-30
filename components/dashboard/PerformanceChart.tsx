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
        refetchInterval: 15000, 
    })

    const chartData = (data?.dailyPnL || []).map((d: DailyPnLPoint) => ({
        date: d.date,
        pnl: parseFloat(d.pnl),
        cumulative: parseFloat(d.cumulativePnl),
        trades: d.trades,
    }))

    const currentBalance = data?.initialBalance || 0
    const unrealizedPnl = data?.unrealizedPnl || 0
    const currentEquity = currentBalance + unrealizedPnl
    const latestCumulativePnl = chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0
    const isProfit = (latestCumulativePnl + unrealizedPnl) >= 0;

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 h-full flex flex-col group relative overflow-hidden transition-all duration-500 hover:border-white/10">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-blue-500/10" />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-10 bg-gradient-to-b from-blue-600 to-indigo-700 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                    <div>
                        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] leading-none mb-2">Equity_Curve_Telemetry</h3>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-black text-white tracking-tighter leading-none">
                                ${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <span className={cn(
                                "text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest",
                                isProfit ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                            )}>
                                {isProfit ? '+' : ''}{((latestCumulativePnl / currentBalance) * 100).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={cn(
                                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95",
                                period === p.value
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-white/10'
                                    : 'text-foreground-disabled hover:text-white hover:bg-white/5'
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-[340px] relative z-10">
                {isLoading ? (
                    <div className="h-full w-full bg-white/5 animate-pulse rounded-2xl border border-white/5" />
                ) : chartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <p className="text-[10px] font-black text-foreground-disabled uppercase tracking-[0.3em]">No_Telemetry_Detected</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                                    <stop offset="60%" stopColor="#2563eb" stopOpacity={0.05} />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" strokeDasharray="8 8" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                tickLine={false}
                                axisLine={false}
                                dy={15}
                                tickFormatter={(v) => format(new Date(v), 'MMM dd')}
                            />
                            <YAxis
                                tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                                tickLine={false}
                                axisLine={false}
                                orientation="right"
                                tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}`}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        const val = payload[0].value as number;
                                        return (
                                            <div className="bg-black/80 backdrop-blur-2xl border border-white/10 p-4 rounded-xl shadow-2xl ring-1 ring-white/10">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">{format(new Date(data.date), 'MMMM dd, yyyy')}</p>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between gap-8">
                                                        <span className="text-[9px] font-bold text-foreground-disabled uppercase tracking-widest">Equity Val</span>
                                                        <span className="text-xs font-black text-white font-mono">${(val + currentBalance).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-8">
                                                        <span className="text-[9px] font-bold text-foreground-disabled uppercase tracking-widest">Growth</span>
                                                        <span className={cn("text-xs font-black font-mono", val >= 0 ? "text-green-400" : "text-red-400")}>
                                                            {val >= 0 ? '+' : ''}{val.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="cumulative"
                                stroke="#3b82f6"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#chartGradient)"
                                animationDuration={2000}
                                animationEasing="ease-in-out"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}

