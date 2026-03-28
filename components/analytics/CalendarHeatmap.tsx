'use client'

import { useMemo, useState } from 'react'
import { DailyPnLPoint } from '@/types'
import { cn } from '@/lib/utils'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subMonths, addMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CalendarHeatmapProps {
  data: DailyPnLPoint[]
  className?: string
}

export function CalendarHeatmap({ data, className }: CalendarHeatmapProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const { calendarDays, maxPnL, minPnL } = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })
    
    const pnlValues = data.map(d => parseFloat(String(d.pnl)))
    const max = Math.max(...pnlValues, 0)
    const min = Math.min(...pnlValues, 0)
    
    return {
      calendarDays: days,
      maxPnL: max,
      minPnL: min,
    }
  }, [currentMonth, data])

  const getPnLForDate = (date: Date): number | null => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayData = data.find(d => d.date === dateStr)
    return dayData ? parseFloat(String(dayData.pnl)) : null
  }

  const getColorIntensity = (pnl: number | null): string => {
    if (pnl === null) return 'bg-background-tertiary'
    if (pnl === 0) return 'bg-gray-700'
    
    if (pnl > 0) {
      const intensity = maxPnL > 0 ? pnl / maxPnL : 0
      if (intensity >= 0.8) return 'bg-profit'
      if (intensity >= 0.6) return 'bg-profit/80'
      if (intensity >= 0.4) return 'bg-profit/60'
      if (intensity >= 0.2) return 'bg-profit/40'
      return 'bg-profit/20'
    } else {
      const intensity = minPnL < 0 ? Math.abs(pnl / minPnL) : 0
      if (intensity >= 0.8) return 'bg-loss'
      if (intensity >= 0.6) return 'bg-loss/80'
      if (intensity >= 0.4) return 'bg-loss/60'
      if (intensity >= 0.2) return 'bg-loss/40'
      return 'bg-loss/20'
    }
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={cn('bg-background-secondary rounded-xl border border-border p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs text-foreground-muted py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const pnl = getPnLForDate(day)
          const hasTrades = pnl !== null
          
          return (
            <div
              key={index}
              className={cn(
                'aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200',
                getColorIntensity(pnl),
                hasTrades ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''
              )}
              title={hasTrades ? `${format(day, 'MMM dd')}: ${pnl! >= 0 ? '+' : ''}$${pnl!.toFixed(2)}` : format(day, 'MMM dd')}
            >
              {format(day, 'd')}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-foreground-muted">
        <div className="flex items-center gap-2">
          <span>Loss</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 bg-loss/20 rounded-sm" />
            <div className="w-3 h-3 bg-loss/40 rounded-sm" />
            <div className="w-3 h-3 bg-loss/60 rounded-sm" />
            <div className="w-3 h-3 bg-loss rounded-sm" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-3 h-3 bg-profit/20 rounded-sm" />
            <div className="w-3 h-3 bg-profit/40 rounded-sm" />
            <div className="w-3 h-3 bg-profit/60 rounded-sm" />
            <div className="w-3 h-3 bg-profit rounded-sm" />
          </div>
          <span>Profit</span>
        </div>
      </div>
    </div>
  )
}
