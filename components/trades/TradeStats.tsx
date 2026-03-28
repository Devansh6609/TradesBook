import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Target, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TradeStatsProps {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnl: string | number
  averageTrade: number
  className?: string
}

export function TradeStats({
  totalTrades,
  winningTrades,
  losingTrades,
  winRate,
  totalPnl,
  averageTrade,
  className,
}: TradeStatsProps) {
  const stats = [
    {
      title: 'Total Trades',
      value: totalTrades.toString(),
      subtitle: `${winningTrades} wins, ${losingTrades} losses`,
      icon: BarChart3,
      color: 'blue',
    },
    {
      title: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      subtitle: `${winningTrades}/${totalTrades} winning trades`,
      icon: Percent,
      color: 'purple',
    },
    {
      title: 'Total P&L',
      value: formatPnL(totalPnl),
      subtitle: 'Net profit/loss',
      icon: DollarSign,
      color: getPnLColorValue(totalPnl),
    },
    {
      title: 'Average Trade',
      value: formatPnL(averageTrade),
      subtitle: 'Per trade average',
      icon: Target,
      color: getPnLColorValue(averageTrade),
    },
  ]

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground-muted">
                {stat.title}
              </CardTitle>
              <div className={cn('p-2 rounded-md', getColorClass(stat.color))}>
                <Icon size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                'text-2xl font-bold',
                stat.color === 'profit' ? 'text-profit' : 
                stat.color === 'loss' ? 'text-loss' : 
                'text-foreground'
              )}>
                {stat.value}
              </div>
              <p className="text-xs text-foreground-muted mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function formatPnL(value: string | number | undefined): string {
  if (value === undefined || value === null) return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '-'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

function getPnLColorValue(value: string | number | undefined): 'profit' | 'loss' | 'neutral' {
  if (value === undefined || value === null) return 'neutral'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'neutral'
  
  if (num > 0) return 'profit'
  if (num < 0) return 'loss'
  return 'neutral'
}

function getColorClass(color: string): string {
  switch (color) {
    case 'blue':
      return 'bg-blue-500/10 text-blue-500'
    case 'purple':
      return 'bg-purple-500/10 text-purple-500'
    case 'profit':
      return 'bg-profit/10 text-profit'
    case 'loss':
      return 'bg-loss/10 text-loss'
    default:
      return 'bg-blue-500/10 text-blue-500'
  }
}
