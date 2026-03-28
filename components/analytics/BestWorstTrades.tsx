import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Trophy, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface TradeItemProps {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  pnl?: number
  netPnl?: number
  rMultiple?: number
  exitDate?: string
  strategy?: { name: string }
}

interface BestWorstTradesProps {
  bestTrades: TradeItemProps[]
  worstTrades: TradeItemProps[]
  className?: string
}

function TradeItem({ trade, isBest }: { trade: TradeItemProps; isBest: boolean }) {
  const pnl = trade.netPnl !== undefined ? trade.netPnl : (trade.pnl || 0)
  
  return (
    <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg hover:bg-background-tertiary/80 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          isBest ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
        )}>
          {isBest ? <Trophy className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{trade.symbol}</span>
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              trade.type === 'BUY' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
            )}>
              {trade.type}
            </span>
          </div>
          <p className="text-xs text-foreground-muted">
            {trade.exitDate && format(new Date(trade.exitDate), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className={cn(
          'text-sm font-bold',
          isBest ? 'text-profit' : 'text-loss'
        )}>
          {isBest ? '+' : ''}${pnl.toFixed(2)}
        </span>
        {trade.rMultiple !== undefined && trade.rMultiple !== null && (
          <p className="text-xs text-foreground-muted">
            {trade.rMultiple.toFixed(2)}R
          </p>
        )}
      </div>
    </div>
  )
}

export function BestWorstTrades({ bestTrades, worstTrades, className }: BestWorstTradesProps) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-4', className)}>
      {/* Best Trades */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-profit" />
            <CardTitle className="text-base font-semibold text-foreground">
              Best Trades
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {bestTrades.length > 0 ? (
            <div className="space-y-2">
              {bestTrades.map((trade) => (
                <TradeItem key={trade.id} trade={trade} isBest={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-foreground-muted">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No winning trades yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Worst Trades */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-loss" />
            <CardTitle className="text-base font-semibold text-foreground">
              Worst Trades
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {worstTrades.length > 0 ? (
            <div className="space-y-2">
              {worstTrades.map((trade) => (
                <TradeItem key={trade.id} trade={trade} isBest={false} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-foreground-muted">
              <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No losing trades yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
