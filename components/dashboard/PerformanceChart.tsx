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

    const chartData = (data?.equityCurve || []).map((d: any) => ({
        date: d.date,
        pnl: d.pnl,
        equity: d.value || d.equity,
    }))

    const totalPnl = parseFloat(data?.totalNetPnl || '0')
    const isProfit = totalPnl >= 0

    // Calculate Growth % (Mocking the 293% look if no initial balance, otherwise real calc)
    const initialBalance = data?.initialBalance || 1000
    const currentEquity = chartData.length > 0 ? chartData[chartData.length - 1].equity : initialBalance
    const growthPercent = initialBalance > 0 ? ((currentEquity - initialBalance) / initialBalance) * 100 : 0

    return (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl h-full flex flex-col pt-8 pb-4 px-8 relative overflow-hidden group">
            <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground-disabled/40 leading-none">
                        PERFORMANCE
                    </h3>
                    
                    <div className="flex items-center gap-5">
                        <h2 className="text-5xl font-bold tracking-tight text-blue-500">
                            {isProfit ? '+' : ''}${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        
                        <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                            +{growthPercent.toFixed(1)}%
                        </div>
                    </div>
                </div>

                <div className="flex bg-[#141414] p-1 rounded-xl border border-white/5">
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={cn(
                                "px-4 py-2 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all duration-200",
                                period === p.value
                                    ? 'bg-blue-600/10 text-blue-400 shadow-sm'
                                    : 'text-foreground-disabled/40 hover:text-foreground-disabled/60'
                            )}
                        >
                            {p.label === '7D' ? '1D' : p.label === '30D' ? '1W' : p.label === '3M' ? '1M' : p.label === '1Y' ? '3M' : 'ALL'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[300px] relative z-10">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-foreground-disabled/20">
                        No trade data found
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            <CartesianGrid 
                                vertical={false} 
                                stroke="rgba(255,255,255,0.02)" 
                                strokeDasharray="0" 
                            />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontWeight: 600 }}
                                tickLine={false}
                                axisLine={false}
                                dy={15}
                                tickFormatter={(v) => {
                                    const d = new Date(v)
                                    return format(d, 'MMM dd')
                                }}
                                minTickGap={60}
                            />
                            <YAxis
                                orientation="right"
                                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.2)', fontWeight: 600 }}
                                tickLine={false}
                                axisLine={false}
                                dx={15}
                                tickFormatter={(v) => `$${(Math.abs(v) >= 1000 ? (v/1000).toFixed(1) + 'K' : v.toFixed(0))}`}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-[#0f0f0f] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                                                <p className="text-[9px] font-bold text-foreground-disabled/50 uppercase tracking-widest mb-2">
                                                    {format(new Date(label), 'MMMM dd, yyyy')}
                                                </p>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between gap-6">
                                                        <span className="text-[10px] font-medium text-foreground-disabled/60">Equity</span>
                                                        <span className="text-[11px] font-bold text-white">${payload[0].value?.toLocaleString()}</span>
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
                                dataKey="equity"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                fill="url(#areaGradient)"
                                animationDuration={1000}
                                activeDot={{ 
                                    r: 4, 
                                    fill: "#3b82f6", 
                                    stroke: "#0a0a0a", 
                                    strokeWidth: 2,
                                }}
                                filter="url(#lineGlow)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}
