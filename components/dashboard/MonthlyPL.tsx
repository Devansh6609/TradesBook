'use client'

import { useState } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  getDay
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyPL {
  date: string
  amount: number
}

interface MonthlyPLProps {
  data?: DailyPL[]
  className?: string
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function MonthlyPL({ data = [], className }: MonthlyPLProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Calculate padding for start of week (Monday=1, Sunday=0 in getDay, so we adjust)
  const startDay = getDay(monthStart)
  const prefixDays = Array.from({ length: (startDay === 0 ? 6 : startDay - 1) })

  const getPLForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return data.find(d => d.date === dateStr)
  }

  return (
    <div className={cn("card p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg">Monthly P&L</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[var(--foreground-muted)]">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 hover:bg-[var(--foreground)]/5 rounded transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 hover:bg-[var(--foreground)]/5 rounded transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-[var(--foreground-muted)] pb-2 uppercase">
            {day}
          </div>
        ))}
        
        {prefixDays.map((_, i) => (
          <div key={`prefix-${i}`} className="aspect-square rounded-lg bg-transparent" />
        ))}

        {days.map((day, i) => {
          const pl = getPLForDay(day)
          const isCurrentToday = isToday(day)
          
          return (
            <div 
              key={i} 
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer transition-all border border-transparent hover:border-blue-500/30",
                pl && pl.amount > 0 ? "bg-profit/10 text-profit-light" : 
                pl && pl.amount < 0 ? "bg-loss/10 text-loss-light" : 
                "bg-[var(--background-tertiary)]/50",
                isCurrentToday && "ring-2 ring-blue-500 ring-offset-2 ring-offset-[var(--background-secondary)]"
              )}
            >
              <span className={cn(
                "text-xs font-medium",
                isCurrentToday ? "text-blue-400" : "text-[var(--foreground-muted)]"
              )}>
                {format(day, 'd')}
              </span>
              {pl && (
                <span className="text-[10px] font-bold mt-0.5">
                  {pl.amount > 0 ? '+' : ''}{pl.amount}$
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-[var(--border)] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-profit/10 border border-profit/20" />
          <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-bold">Winner</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-loss/10 border border-loss/20" />
          <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-bold">Loser</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[var(--background-tertiary)]" />
          <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-bold">No Trade</span>
        </div>
      </div>
    </div>
  )
}
