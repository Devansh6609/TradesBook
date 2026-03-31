'use client'

import { useState, useMemo } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isWeekend
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyPL {
  date: string
  amount: number
}

interface MonthlyPLProps {
  data?: DailyPL[]
  className?: string
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S', 'WEEKLY']

export default function MonthlyPL({ data = [], className }: MonthlyPLProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  
  // Get all days in the month
  const monthDays = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd])
  
  // Group days by week
  const weeks = useMemo(() => {
    const weeksArr: Date[][] = []
    let currentWeek: Date[] = []
    
    // We want each week to be a row of 7 days
    // Pad the start of the first week
    const firstDay = getDay(monthStart)
    const paddingCount = firstDay === 0 ? 6 : firstDay - 1
    
    // Add nulls for padding
    for (let i = 0; i < paddingCount; i++) {
        currentWeek.push(null as any)
    }
    
    monthDays.forEach(day => {
        currentWeek.push(day)
        if (currentWeek.length === 7) {
            weeksArr.push(currentWeek)
            currentWeek = []
        }
    })
    
    // Pad the end of the last week
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null as any)
        }
        weeksArr.push(currentWeek)
    }
    
    return weeksArr
  }, [monthDays, monthStart])

  const getPLForDay = (day: Date | null) => {
    if (!day) return null
    const dateStr = format(day, 'yyyy-MM-dd')
    return data.find(d => d.date === dateStr)
  }

  const getWeeklyProfit = (week: Date[]) => {
    return week.reduce((acc, day) => {
        const pl = getPLForDay(day)
        return acc + (pl?.amount || 0)
    }, 0)
  }

  const totalMonthlyPL = useMemo(() => {
      return data.reduce((acc, curr) => {
          const date = new Date(curr.date)
          if (isSameMonth(date, currentMonth)) {
              return acc + curr.amount
          }
          return acc
      }, 0)
  }, [data, currentMonth])

  return (
    <div className={cn("bg-zinc-950/30 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 h-full flex flex-col group relative overflow-hidden transition-all duration-700 hover:border-blue-500/10", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-10 relative z-10 px-2 pt-2">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-all duration-500">
             <Calendar size={22} strokeWidth={2.5} className="text-blue-500 group-hover:rotate-6 transition-transform" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] leading-none">Net Monthly</h3>
            <div className="flex items-baseline gap-2">
                <span className={cn("text-2xl font-black font-mono tracking-tighter tabular-nums", totalMonthlyPL >= 0 ? "text-profit-light" : "text-loss-light")}>
                    {totalMonthlyPL >= 0 ? '+' : '-'}${Math.abs(totalMonthlyPL).toLocaleString()}
                </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 text-zinc-600 hover:text-white active:scale-95 transition-all">
              <ChevronLeft size={18} />
            </button>
            <span className="text-[10px] font-black text-white uppercase tracking-widest px-4 min-w-[120px] text-center">
                {format(currentMonth, 'MMM yyyy')}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 text-zinc-600 hover:text-white active:scale-95 transition-all">
              <ChevronRight size={18} />
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-8 gap-1.5 relative z-10 -mx-1">
        {/* Day Column Headers */}
        {WEEKDAYS.map((day, i) => (
          <div key={i} className={cn(
              "text-center text-[9px] font-black pb-5 uppercase tracking-[0.3em]",
              day === 'WEEKLY' ? "text-blue-500" : "text-zinc-600"
          )}>
            {day}
          </div>
        ))}

        {/* Weeks Rows */}
        {weeks.map((week, weekIndex) => {
            const weeklyProfit = getWeeklyProfit(week)
            return (
                <div key={weekIndex} className="col-span-8 grid grid-cols-8 gap-1.5 mb-1.5">
                    {week.map((day, dayIndex) => {
                        const pl = getPLForDay(day)
                        const isCurrentToday = day && isToday(day)
                        const isGain = pl && pl.amount > 0
                        const isLoss = pl && pl.amount < 0
                        
                        return (
                            <div 
                                key={`day-${weekIndex}-${dayIndex}`}
                                className={cn(
                                    "aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all border border-transparent overflow-hidden group/day cursor-default",
                                    !day && "opacity-0 pointer-events-none",
                                    isGain ? "bg-profit-light/10 border-profit-light/20 shadow-[0_0_15px_rgba(34,197,94,0.05)]" : 
                                    isLoss ? "bg-loss-light/10 border-loss-light/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]" :
                                    "bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-white/10",
                                    isCurrentToday && "border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20"
                                )}
                            >
                                <span className={cn(
                                    "text-[12px] font-black font-mono transition-colors",
                                    isCurrentToday ? "text-blue-400" : "text-zinc-600 group-hover/day:text-zinc-400",
                                    isGain && "text-profit-light/80",
                                    isLoss && "text-loss-light/80"
                                )}>
                                    {day ? format(day, 'd') : ''}
                                </span>
                                
                                {pl && (
                                    <span className={cn(
                                        "text-[8px] font-black mt-1 leading-none tracking-tighter uppercase tabular-nums",
                                        isGain ? "text-profit-light" : isLoss ? "text-loss-light" : "text-zinc-700"
                                    )}>
                                        {isGain ? '+' : ''}${Math.abs(Math.round(pl.amount))}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                    
                    {/* Weekly Column */}
                    <div className={cn(
                        "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border border-blue-500/10 shadow-lg",
                        weeklyProfit > 0 ? "bg-blue-600/15 border-blue-500/30" : 
                        weeklyProfit < 0 ? "bg-red-600/15 border-red-500/30" : 
                        "bg-zinc-900 border-white/5"
                    )}>
                         <span className="text-[7px] font-black text-blue-500/60 uppercase tracking-widest mb-1 leading-none">Net</span>
                        <span className={cn(
                            "text-[10px] font-black font-mono tabular-nums leading-none",
                            weeklyProfit > 0 ? "text-profit-light" : weeklyProfit < 0 ? "text-loss-light" : "text-zinc-700"
                        )}>
                            {weeklyProfit > 0 ? '+' : weeklyProfit < 0 ? '-' : ''}{Math.abs(Math.round(weeklyProfit))}
                        </span>
                    </div>
                </div>
            )
        })}
      </div>

      <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center px-2 relative z-10">
        <div className="flex gap-8">
            <div className="flex items-center gap-3 group/leg">
                <div className="w-2 h-2 rounded-full bg-profit-light shadow-[0_0_10px_rgba(34,197,94,0.5)] group-hover/leg:scale-125 transition-transform" />
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-black leading-none">Surplus</span>
            </div>
            <div className="flex items-center gap-3 group/leg">
                <div className="w-2 h-2 rounded-full bg-loss-light shadow-[0_0_10px_rgba(239,68,68,0.5)] group-hover/leg:scale-125 transition-transform" />
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-black leading-none">Deficit</span>
            </div>
        </div>
        <div className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em] animate-pulse">
            Telemetry_Live_Broadcast
        </div>
      </div>
      
      {/* Ambient Glows */}
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-150 transition-all duration-[1500ms]" />
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/[0.03] rounded-full blur-[80px] pointer-events-none" />
    </div>
  )
}

