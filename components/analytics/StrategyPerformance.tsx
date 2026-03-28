import { StrategyPerformance } from '@/types'
import { cn } from '@/lib/utils'
import { Target, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface StrategyPerformanceProps {
  data: StrategyPerformance[]
  className?: string
}

export function StrategyPerformanceCards({ data, className }: StrategyPerformanceProps) {
  if (data.length === 0) {
    return (
      <div className={cn(
        'bg-background-secondary rounded-xl border border-border p-8 text-center',
        className
      )}>
        <Target className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
        <p className="text-foreground-muted">No strategy data available</p>
      </div>
    )
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {data.map((strategy) => (
        <Card key={strategy.strategyId} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">
                {strategy.strategyName}
              </CardTitle>
              <div className={cn(
                'p-1.5 rounded-lg',
                strategy.totalPnl >= 0 ? 'bg-profit/10' : 'bg-loss/10'
              )}>
                {strategy.totalPnl >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-profit" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-loss" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* P&L */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-muted">Total P&L</span>
              <span className={cn(
                'text-lg font-bold',
                strategy.totalPnl >= 0 ? 'text-profit' : 'text-loss'
              )}>
                {strategy.totalPnl >= 0 ? '+' : ''}${strategy.totalPnl.toFixed(2)}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background-tertiary rounded-lg p-2">
                <span className="text-xs text-foreground-muted block mb-1">Trades</span>
                <span className="text-sm font-medium text-foreground">{strategy.totalTrades}</span>
              </div>
              <div className="bg-background-tertiary rounded-lg p-2">
                <span className="text-xs text-foreground-muted block mb-1">Win Rate</span>
                <span className={cn(
                  'text-sm font-medium',
                  strategy.winRate >= 50 ? 'text-profit' : 'text-loss'
                )}>
                  {strategy.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="bg-background-tertiary rounded-lg p-2">
                <span className="text-xs text-foreground-muted block mb-1">Profit Factor</span>
                <span className={cn(
                  'text-sm font-medium',
                  strategy.profitFactor >= 1 ? 'text-profit' : 'text-loss'
                )}>
                  {strategy.profitFactor === Infinity ? '∞' : strategy.profitFactor.toFixed(2)}
                </span>
              </div>
              <div className="bg-background-tertiary rounded-lg p-2">
                <span className="text-xs text-foreground-muted block mb-1">Expectancy</span>
                <span className={cn(
                  'text-sm font-medium',
                  strategy.expectancy >= 0 ? 'text-profit' : 'text-loss'
                )}>
                  ${strategy.expectancy.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Win/Loss Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">
                  {strategy.winningTrades} Wins
                </span>
                <span className="text-foreground-muted">
                  {strategy.losingTrades} Losses
                </span>
              </div>
              <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-profit rounded-full transition-all duration-500"
                  style={{
                    width: `${strategy.totalTrades > 0 ? (strategy.winningTrades / strategy.totalTrades) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
