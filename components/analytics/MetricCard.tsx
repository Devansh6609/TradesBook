import * as React from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  isPositive?: boolean
  isLoading?: boolean
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  isPositive,
  isLoading,
  className,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className={cn(
        'rounded-xl border border-border bg-background-secondary p-6 animate-pulse',
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 bg-background-tertiary rounded" />
          <div className="h-8 w-8 bg-background-tertiary rounded" />
        </div>
        <div className="h-8 w-32 bg-background-tertiary rounded mb-2" />
        <div className="h-4 w-20 bg-background-tertiary rounded" />
      </div>
    )
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-profit'
    if (trend === 'down') return 'text-loss'
    return 'text-foreground-muted'
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  return (
    <div className={cn(
      'rounded-xl border border-border bg-background-secondary p-6 transition-all duration-200 hover:border-border-hover',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-foreground-muted">{title}</span>
        <div className={cn(
          'p-2 rounded-lg',
          isPositive === true ? 'bg-profit/10 text-profit' :
          isPositive === false ? 'bg-loss/10 text-loss' :
          'bg-background-tertiary text-foreground-muted'
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="space-y-1">
        <div className={cn(
          'text-2xl font-bold',
          isPositive === true ? 'text-profit' :
          isPositive === false ? 'text-loss' :
          'text-foreground'
        )}>
          {value}
        </div>
        
        {(trendValue || subtitle) && (
          <div className="flex items-center gap-2">
            {trend && (
              <span className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                {getTrendIcon()}
                {trendValue}
              </span>
            )}
            {!trend && subtitle && (
              <span className="text-sm text-foreground-muted">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
