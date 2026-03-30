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
    { label: '1D', value: '1d' },
    { label: '1W', value: '7d' },
    { label: '1M', value: '30d' },
    { label: '3M', value: '3m' },
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
    const latestCumulativePnl = chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0
    const totalProfit = latestCumulativePnl + unrealizedPnl
    const isProfit = totalProfit >= 0;

    return (
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 h-full flex flex-col group transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-bold text-white tracking-tight uppercase">Performance</h3>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-lg font-bold tracking-tight",
                            isProfit ? "text-blue-400" : "text-red-500"
                        )}>
                            {isProfit ? '+' : ''}${Math.abs(totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className={cn(
                             "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5",
                             isProfit ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
                        )}>
                            {isProfit ? '▲' : '▼'} {Math.abs((latestCumulativePnl / (currentBalance || 1)) * 100).toFixed(1)}%
                        </span>
                    </div>
                </div>

                <div className="flex bg-[#121212] p-1 rounded-lg border border-white/5">
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-bold rounded-md transition-all",
                                period === p.value
                                    ? 'bg-[#1a1a1a] text-white shadow-sm'
                                    : 'text-zinc-600 hover:text-zinc-400'
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-[300px] relative">
                {isLoading ? (
                    <div className="h-full w-full bg-white/5 animate-pulse rounded-xl" />
                ) : chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center border border-dashed border-white/5 rounded-xl">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">No Performance Data</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.02)" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fontWeight: 600, fill: '#3f3f46' }}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                                tickFormatter={(v) => format(new Date(v), 'dd MMM')}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fontWeight: 600, fill: '#3f3f46' }}
                                tickLine={false}
                                axisLine={false}
                                orientation="right"
                                tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const chartDataItem = payload[0].payload;
                                        return (
                                            <div className="bg-[#121212] border border-white/10 p-3 rounded-lg shadow-xl">
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">{format(new Date(chartDataItem.date), 'MMM dd, yyyy')}</p>
                                                <div className="flex items-center gap-4 justify-between">
                                                    <span className="text-[10px] font-bold text-zinc-400">EQUITY</span>
                                                    <span className="text-xs font-bold text-white">${(payload[0].value as number + currentBalance).toLocaleString()}</span>
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
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#performanceGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}

