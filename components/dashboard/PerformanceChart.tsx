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
    { label: '1W', value: '1w' },
    { label: '1M', value: '1m' },
    { label: '3M', value: '3m' },
    { label: 'ALL', value: 'all' },
]

import { DailyPnLPoint } from '@/types'

export function PerformanceChart() {
    const [period, setPeriod] = useState('1m')

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
    const currentEquity = currentBalance + (chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0) + unrealizedPnl
    const latestPnl = chartData.length > 0 ? chartData[chartData.length - 1].pnl : 0
    const growthPercent = ((currentEquity - currentBalance) / currentBalance) * 100 || 0
    const isProfit = latestPnl >= 0;

    return (
        <div className="bg-zinc-950/30 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 h-full flex flex-col group relative overflow-hidden transition-all duration-700 hover:border-blue-500/10">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none transition-all duration-1000 group-hover:scale-125" />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 relative z-10">
                <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                         <div className="w-2 h-6 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.4)]" />
                         <h3 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] leading-none">Net Performance</h3>
                    </div>
                    
                    <div className="flex items-baseline gap-6">
                        <div className="flex flex-col">
                             <h2 className="text-[44px] font-black text-white tracking-tighter leading-none tabular-nums">
                                ${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className={cn(
                                "flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-[0.15em]",
                                isProfit ? "bg-profit-light/10 text-profit-light border-profit-light/20" : "bg-loss-light/10 text-loss-light border-loss-light/20"
                            )}>
                                {isProfit ? '+' : ''}${Math.abs(latestPnl).toLocaleString()} ({growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md">
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={cn(
                                "px-6 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-500",
                                period === p.value
                                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                                    : 'text-zinc-500 hover:text-white'
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-[360px] relative z-10 w-[calc(100%+20px)] -ml-5">
                {isLoading ? (
                    <div className="h-full w-full bg-white/2 animate-pulse rounded-3xl" />
                ) : chartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                        <p className="text-[11px] font-black text-zinc-700 uppercase tracking-[0.4em]">Awaiting_Metrics_Stream</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 0 }}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.02)" strokeDasharray="10 10" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 9, fontWeight: 900, fill: '#3f3f46' }}
                                tickLine={false}
                                axisLine={false}
                                dy={15}
                                tickFormatter={(v) => format(new Date(v), 'MMM dd')}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                cursor={{ stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 1 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        const val = payload[0].value as number;
                                        const pnl = data.pnl;
                                        return (
                                            <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl relative overflow-hidden group/tip">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 opacity-60">{format(new Date(data.date), 'EEEE, MMM dd')}</p>
                                                <div className="space-y-2">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Equity Path</span>
                                                        <span className="text-sm font-black text-white tabular-nums">${(val + currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Delta</span>
                                                        <span className={cn("text-xs font-black tabular-nums", pnl >= 0 ? "text-profit-light" : "text-loss-light")}>
                                                            {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
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
                                stroke="#0ea5e9"
                                strokeWidth={3}
                                strokeLinecap="round"
                                fillOpacity={1}
                                fill="url(#chartGradient)"
                                animationDuration={2500}
                                animationEasing="ease-in-out"
                                activeDot={{ 
                                    r: 6, 
                                    stroke: '#0ea5e9', 
                                    strokeWidth: 2, 
                                    fill: '#000',
                                    className: 'shadow-[0_0_15px_rgba(14,165,233,0.5)]'
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}

