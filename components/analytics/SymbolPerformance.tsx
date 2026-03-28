import { SymbolPerformance } from '@/types'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

interface SymbolPerformanceProps {
  data: SymbolPerformance[]
  className?: string
}

export function SymbolPerformanceTable({ data, className }: SymbolPerformanceProps) {
  if (data.length === 0) {
    return (
      <div className={cn(
        'bg-background-secondary rounded-xl border border-border p-8 text-center',
        className
      )}>
        <BarChart3 className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
        <p className="text-foreground-muted">No symbol data available</p>
      </div>
    )
  }

  return (
    <div className={cn('bg-background-secondary rounded-xl border border-border overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background-tertiary/50">
              <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                Symbol
              </th>
              <th className="text-right text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                Trades
              </th>
              <th className="text-right text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                Win Rate
              </th>
              <th className="text-right text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                Total P&L
              </th>
              <th className="text-right text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                Avg Trade
              </th>
              <th className="text-right text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">
                Profit Factor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((symbol) => (
              <tr key={symbol.symbol} className="hover:bg-background-tertiary/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">{symbol.symbol}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-foreground">{symbol.totalTrades}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={cn(
                      'text-sm',
                      symbol.winRate >= 50 ? 'text-profit' : 'text-loss'
                    )}>
                      {symbol.winRate.toFixed(1)}%
                    </span>
                    {symbol.winRate >= 50 ? (
                      <TrendingUp className="w-4 h-4 text-profit" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-loss" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    'text-sm font-medium',
                    symbol.totalPnl >= 0 ? 'text-profit' : 'text-loss'
                  )}>
                    {symbol.totalPnl >= 0 ? '+' : ''}${symbol.totalPnl.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    'text-sm',
                    symbol.averagePnl >= 0 ? 'text-profit' : 'text-loss'
                  )}>
                    {symbol.averagePnl >= 0 ? '+' : ''}${symbol.averagePnl.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    'text-sm',
                    symbol.profitFactor >= 1 ? 'text-profit' : 'text-loss'
                  )}>
                    {symbol.profitFactor === Infinity ? '∞' : symbol.profitFactor.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
