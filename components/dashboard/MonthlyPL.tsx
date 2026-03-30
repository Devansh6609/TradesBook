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
    <div className={cn("bg-[#0c0c0c] border border-white/5 rounded-[2rem] p-6 h-full flex flex-col group relative overflow-hidden transition-all duration-500", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10 px-2 pt-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-all duration-500">
             <Calendar size={20} className="text-blue-400 group-hover:rotate-6 transition-transform" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] leading-none mb-2">Monthly P&L</h3>
            <div className="flex items-baseline gap-2">
                <span className={cn("text-xl font-black font-mono tracking-tighter", totalMonthlyPL >= 0 ? "text-white" : "text-red-500")}>
                    {totalMonthlyPL >= 0 ? '+$' : '-$'}{Math.abs(totalMonthlyPL).toLocaleString()}
                </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/5">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <div className="flex gap-1.5">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-xl border border-white/5 text-zinc-500 hover:text-white active:scale-95 transition-all">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-xl border border-white/5 text-zinc-500 hover:text-white active:scale-95 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-8 gap-x-1 gap-y-1 relative z-10">
        {/* Day Column Headers */}
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-center text-[9px] font-black text-zinc-600 pb-4 uppercase tracking-[0.2em]">
            {day}
          </div>
        ))}

        {/* Weeks Rows */}
        {weeks.map((week, weekIndex) => {
            const weeklyProfit = getWeeklyProfit(week)
            return (
                <>
                    {week.map((day, dayIndex) => {
                        const pl = getPLForDay(day)
                        const isCurrentToday = day && isToday(day)
                        const isGain = pl && pl.amount > 0
                        const isLoss = pl && pl.amount < 0
                        
                        return (
                            <div 
                                key={`day-${weekIndex}-${dayIndex}`}
                                className={cn(
                                    "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border border-transparent overflow-hidden",
                                    !day && "opacity-0",
                                    isGain ? "bg-blue-600/10" : "bg-[#121212]/50 hover:bg-[#121212] hover:border-white/5",
                                    isCurrentToday && "border-blue-500/50 ring-1 ring-blue-500/20"
                                )}
                            >
                                <span className={cn(
                                    "text-[11px] font-black font-mono",
                                    isCurrentToday ? "text-blue-400" : "text-zinc-600",
                                    isGain && "text-blue-400"
                                )}>
                                    {day ? format(day, 'd') : ''}
                                </span>
                                
                                {isGain && (
                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                                )}

                                {pl && (
                                    <span className={cn(
                                        "text-[8px] font-black mt-1 leading-none tracking-tighter opacity-80",
                                        isGain ? "text-blue-500" : isLoss ? "text-red-500" : "text-zinc-700"
                                    )}>
                                        {isGain ? '+' : ''}{Math.abs(Math.round(pl.amount))}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                    
                    {/* Weekly Column */}
                    <div className={cn(
                        "aspect-square rounded-xl flex flex-col items-center justify-center transition-all border border-transparent",
                        weeklyProfit > 0 ? "bg-green-500/10 border-green-500/20" : 
                        weeklyProfit < 0 ? "bg-red-500/10 border-red-500/20" : 
                        "bg-[#121212]/30"
                    )}>
                        <span className={cn(
                            "text-[9px] font-black font-mono",
                            weeklyProfit > 0 ? "text-green-400" : weeklyProfit < 0 ? "text-red-400" : "text-zinc-700"
                        )}>
                            {weeklyProfit > 0 ? '+' : weeklyProfit < 0 ? '-' : ''}{Math.abs(Math.round(weeklyProfit))}
                        </span>
                        <div className="mt-1 h-0.5 w-3 bg-current opacity-20 rounded-full" />
                    </div>
                </>
            )
        })}
      </div>

      <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center px-2 relative z-10">
        <div className="flex gap-6">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Trade Highs</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500/20 border border-blue-500/30" />
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Profitable</span>
            </div>
        </div>
        <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            Data_Synced_RT
        </div>
      </div>
      
      {/* Ambient Bottom Glow */}
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-1000" />
    </div>
  )
}

