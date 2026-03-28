import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'neutral'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  success: 'bg-profit/10 text-profit border-profit/20',
  error: 'bg-loss/10 text-loss border-loss/20',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  neutral: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}

interface StatusBadgeProps {
  status: 'OPEN' | 'CLOSED' | 'CANCELLED' | 'PENDING' | string
  className?: string
}

const statusVariants: Record<string, BadgeVariant> = {
  OPEN: 'info',
  CLOSED: 'success',
  CANCELLED: 'neutral',
  PENDING: 'warning',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusVariants[status] || 'neutral'
  
  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  )
}

interface TypeBadgeProps {
  type: 'BUY' | 'SELL'
  className?: string
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const variant = type === 'BUY' ? 'success' : 'error'
  
  return (
    <Badge variant={variant} className={className}>
      {type === 'BUY' ? 'Buy' : 'Sell'}
    </Badge>
  )
}

interface PnLBadgeProps {
  value: number | string | undefined | null
  className?: string
}

export function PnLBadge({ value, className }: PnLBadgeProps) {
  if (value === undefined || value === null) {
    return (
      <Badge variant="neutral" className={className}>
        -
      </Badge>
    )
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return (
      <Badge variant="neutral" className={className}>
        -
      </Badge>
    )
  }

  const variant = numValue > 0 ? 'success' : numValue < 0 ? 'error' : 'neutral'
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'always',
  }).format(numValue)

  return (
    <Badge variant={variant} className={className}>
      {formatted}
    </Badge>
  )
}

interface WinLossBadgeProps {
  isWin: boolean
  className?: string
}

export function WinLossBadge({ isWin, className }: WinLossBadgeProps) {
  return (
    <Badge variant={isWin ? 'success' : 'error'} className={className}>
      {isWin ? 'Win' : 'Loss'}
    </Badge>
  )
}
