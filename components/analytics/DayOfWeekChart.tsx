'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts'
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
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const pnl = payload[0].value
            const item = payload[0].payload
            return (
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-3 shadow-xl">
                    <p className="text-sm font-bold text-[var(--foreground)] mb-1">{label}</p>
                    <p className={cn(
                        "text-sm font-bold",
                        pnl >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                    </p>
                    <div className="mt-2 text-xs text-[var(--foreground-muted)] space-y-1">
                        <p>{item.trades} trades</p>
                        <p>{item.winRate.toFixed(1)}% win rate</p>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
                <span>📅</span> Day Performance
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1f2937" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="day"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            width={40}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f2937', opacity: 0.4 }} />
                        <Bar dataKey="pnl" radius={[0, 4, 4, 0] as [number, number, number, number]} barSize={20}>
                            {data.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={Number(entry.pnl) >= 0 ? '#3b82f6' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
