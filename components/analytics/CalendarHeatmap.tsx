'use client'

import { useMemo } from 'react'
import { DailyPnLPoint } from '@/types'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subMonths, addMonths, isToday, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Trade } from '@/lib/apiClient'

interface CalendarHeatmapProps {
  data: DailyPnLPoint[]
  trades: Trade[]
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
  currentMonth: Date
  onMonthChange: (date: Date) => void
  className?: string
}

export function CalendarHeatmap({ 
  data, 
  trades, 
  selectedDate, 
  onSelectDate, 
  currentMonth, 
  onMonthChange, 
  className 
}: CalendarHeatmapProps) {
  
  const { calendarWeeks } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    
    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }
    
    return { calendarWeeks: weeks }
  }, [currentMonth])

  const getDayStats = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    
    // 1. Try to find in pre-calculated dailyPnL data
    const dayData = data.find(d => {
      if (!d.date) return false
      const dDateStr = typeof d.date === 'string' ? d.date.split('T')[0] : format(new Date(d.date), 'yyyy-MM-dd')
      return dDateStr === dateStr
    })

    if (dayData) {
      return {
        trades: dayData.trades || 0,
        pnl: typeof dayData.pnl === 'string' ? parseFloat(dayData.pnl) : (dayData.pnl || 0),
        hasTrades: (dayData.trades || 0) > 0
      }
    }

    // 2. Fallback to calculating from trades array if dailyPnL is missing for this day
    const dayTrades = trades.filter(t => {
      if (!t.exitDate) return false
      try {
        let tDate: Date;
        if (typeof t.exitDate === 'number') {
          const ts = t.exitDate < 10000000000 ? t.exitDate * 1000 : t.exitDate;
          tDate = new Date(ts);
        } else if (typeof t.exitDate === 'string' && /^\d+$/.test(t.exitDate)) {
          const num = parseInt(t.exitDate, 10);
          const ts = num < 10000000000 ? num * 1000 : num;
          tDate = new Date(ts);
        } else {
          tDate = new Date(t.exitDate);
        }
        return format(tDate, 'yyyy-MM-dd') === dateStr;
      } catch (e) {
        return false;
      }
    })

    const dayPnL = dayTrades.reduce((acc, t) => acc + (t.netPnl || 0), 0)
    
    return {
      trades: dayTrades.length,
      pnl: dayPnL,
      hasTrades: dayTrades.length > 0
    }
  }

  const formatPnL = (val: number) => {
    if (val === 0) return '$0'
    const sign = val > 0 ? '+$' : '-$'
    return `${sign}${Math.abs(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }

  const weekDayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  return (
    <div className={cn('bg-[#0a0a0a] rounded-3xl border border-white/5 p-8 flex flex-col shadow-2xl relative overflow-hidden font-inter', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 border border-white/10">
              <CalendarIcon size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white font-jakarta tracking-tight">Trading Calendar</h3>
              <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em] mt-0.5">Daily P&L heatmap - Click on days to see trades</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#111111] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => onMonthChange(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-black text-white px-3 font-jakarta uppercase tracking-wider min-w-[110px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => onMonthChange(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 relative z-10">
        <div className="grid grid-cols-8 gap-3 mb-6">
          {weekDayNames.map(day => (
            <div key={day} className="text-center text-[10px] font-black text-white/20 tracking-[0.2em] py-2 uppercase">
              {day}
            </div>
          ))}
          <div className="text-center text-[10px] font-black text-white/10 tracking-[0.2em] py-2 uppercase">
            WEEKLY
          </div>
        </div>

        <div className="space-y-3">
          {calendarWeeks.map((week, wIndex) => {
            const weeklyStats = week.reduce((acc, d) => {
              const s = getDayStats(d);
              return { pnl: acc.pnl + s.pnl, days: acc.days + (s.hasTrades ? 1 : 0) };
            }, { pnl: 0, days: 0 });

            return (
              <div key={wIndex} className="grid grid-cols-8 gap-3">
                {week.map((day, dIndex) => {
                  const stats = getDayStats(day)
                  const isCurrMonth = isSameMonth(day, currentMonth)
                  const isCurrDay = selectedDate && isSameDay(day, selectedDate)
                  const today = isToday(day)

                  return (
                    <div
                      key={dIndex}
                      onClick={() => onSelectDate(day)}
                      className={cn(
                        'aspect-[14/15] rounded-2xl border transition-all duration-300 flex flex-col p-3 relative cursor-pointer group',
                        isCurrMonth ? 'bg-white/[0.02] border-white/5 hover:border-white/20' : 'bg-transparent border-transparent opacity-10 pointer-events-none',
                        isCurrDay ? 'ring-2 ring-blue-500/50 border-blue-500/50 bg-blue-500/5' : '',
                        !isCurrDay && today ? 'border-blue-500/30' : ''
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold mb-auto",
                        today ? "text-blue-500" : "text-white/40"
                      )}>
                        {format(day, 'd')}
                      </span>

                      {stats.hasTrades && (
                        <div className="mt-auto">
                          <p className={cn(
                            "text-[13px] font-black font-jakarta tracking-tight truncate",
                            stats.pnl >= 0 ? "text-blue-500" : "text-red-500"
                          )}>
                            {formatPnL(stats.pnl)}
                          </p>
                          <p className="text-[9px] font-medium text-white/20 lowercase tracking-tight leading-none mt-0.5">
                            {stats.trades} {stats.trades === 1 ? 'trade' : 'trades'}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Weekly Column */}
                <div className="aspect-[14/15] rounded-2xl bg-white/[0.01] border border-white/5 border-dashed p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">
                    WEEKLY
                  </span>
                  <p className={cn(
                    "text-xs font-black font-jakarta",
                    weeklyStats.pnl >= 0 ? "text-blue-500/50" : "text-red-500/50"
                  )}>
                    {weeklyStats.pnl >= 0 ? '+' : '-'}${Math.abs(weeklyStats.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[8px] font-medium text-white/10 uppercase tracking-widest mt-0.5">
                    Traded Days {weeklyStats.days}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 mt-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Profitable Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Losing Day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/10" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">No Trades</span>
        </div>
      </div>
    </div>
  )
}
