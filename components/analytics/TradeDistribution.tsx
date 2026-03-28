'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { cn } from '@/lib/utils'

interface TradeDistributionProps {
  trades: Array<{
    pnl?: number
    netPnl?: number
  }>
  className?: string
  height?: number
}

export function TradeDistribution({ trades, className, height = 250 }: TradeDistributionProps) {
  const data = useMemo(() => {
    const winning = trades.filter(t => (t.netPnl !== undefined ? t.netPnl : (t.pnl || 0)) > 0).length
    const losing = trades.filter(t => (t.netPnl !== undefined ? t.netPnl : (t.pnl || 0)) < 0).length
    const breakeven = trades.filter(t => (t.netPnl !== undefined ? t.netPnl : (t.pnl || 0)) === 0).length

    return [
      { name: 'Winning', value: winning, color: '#10b981' },
      { name: 'Losing', value: losing, color: '#ef4444' },
      { name: 'Breakeven', value: breakeven, color: '#71717a' },
    ].filter(d => d.value > 0)
  }, [trades])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      const total = trades.length
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
      return (
        <div className="bg-background-tertiary border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{item.name}</p>
          <p className="text-sm text-foreground-muted">
            {item.value} trades ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  if (trades.length === 0) {
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
