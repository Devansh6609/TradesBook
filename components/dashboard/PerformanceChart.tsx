'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/lib/apiClient'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine
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
        <div className="h-full bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Performance</h3>
                    <p className={`text-xl font-mono font-bold mt-0.5 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        ${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="flex gap-1 bg-[var(--background-secondary)] rounded-lg p-0.5 border border-[var(--border)]">
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${period === p.value
                                ? 'bg-blue-500 text-white'
                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
                {isLoading ? (
                    <div className="h-full flex flex-col gap-4 animate-pulse">
                        <div className="flex-1 bg-[var(--background-secondary)] rounded-lg" />
                        <div className="h-4 w-2/3 bg-[var(--background-secondary)] rounded" />
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-[var(--foreground-muted)]">
                        No trade data for this period
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: 'var(--foreground-muted)' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => {
                                    const d = new Date(v)
                                    return `${d.getDate()}/${d.getMonth() + 1}`
                                }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: 'var(--foreground-muted)' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => `$${v}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--card-bg)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                }}
                                labelStyle={{ color: 'var(--foreground-muted)', fontSize: '10px', marginBottom: '4px' }}
                                formatter={(value: number, name: string) => {
                                    const label = name === 'cumulative' ? 'Cumulative P&L' : 'Daily P&L'
                                    return [`$${value.toFixed(2)}`, label]
                                }}
                                labelFormatter={(v) => {
                                    const d = new Date(v)
                                    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                }}
                            />
                            <ReferenceLine y={0} stroke="var(--foreground-muted)" strokeDasharray="3 3" opacity={0.5} />
                            <Area
                                type="monotone"
                                dataKey="cumulative"
                                stroke={isProfit ? '#22c55e' : '#ef4444'}
                                strokeWidth={2}
                                fill={isProfit ? 'url(#profitGrad)' : 'url(#lossGrad)'}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2, fill: 'var(--card-bg)' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}
