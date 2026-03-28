'use client'

import { useMemo } from 'react'
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
import { DailyPnLPoint } from '@/types'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

interface DailyPnLChartProps {
  data: DailyPnLPoint[]
  className?: string
  height?: number
}

export function DailyPnLChart({ data, className, height = 300 }: DailyPnLChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      formattedDate: format(parseISO(point.date), 'MMM dd'),
    }))
  }, [data])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pnl = parseFloat(payload[0].value)
      return (
        <div className="bg-background-tertiary border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          <p className={cn(
            'text-sm font-bold',
            pnl >= 0 ? 'text-profit' : 'text-loss'
          )}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            {payload[0].payload.trades} trade{payload[0].payload.trades !== 1 ? 's' : ''}
          </p>
        </div>
      )
    }
    return null
  }

  if (data.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-background-secondary rounded-xl border border-border',
        className
      )} style={{ height }}>
        <p className="text-foreground-muted">No data available</p>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="formattedDate"
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
          />
          <YAxis
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0] as [number, number, number, number]} maxBarSize={50}>
            {chartData.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={Number(entry.pnl) >= 0 ? '#10b981' : '#ef4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
