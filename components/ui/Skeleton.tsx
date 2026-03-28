import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-background-tertiary',
        className
      )}
    />
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-background-secondary p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-background-tertiary rounded" />
        <div className="h-8 w-8 bg-background-tertiary rounded" />
      </div>
      <div className="h-8 w-32 bg-background-tertiary rounded mb-2" />
      <div className="h-4 w-20 bg-background-tertiary rounded" />
    </div>
  )
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-xl border border-border bg-background-secondary animate-pulse flex items-center justify-center"
      style={{ height }}
    >
      <div className="h-full w-full bg-background-tertiary/50 rounded-xl" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full animate-pulse">
      <div className="h-10 bg-background-tertiary rounded-t-xl mb-1" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-background-tertiary/50 mb-1 last:rounded-b-xl" />
      ))}
    </div>
  )
}
