'use client'

import { useState, Fragment } from 'react'
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
  
  const startDay = getDay(monthStart)
  const prefixDays = Array.from({ length: (startDay === 0 ? 6 : startDay - 1) })

  // Calculate weeks for the 8-column grid (7 days + 1 weekly stat)
  const weeks: (Date | null)[][] = []
  let currentDays = [...prefixDays.map(() => null), ...days]
  
  while (currentDays.length > 0) {
    weeks.push(currentDays.splice(0, 7))
  }

  const getPLForDay = (day: Date | null) => {
    if (!day) return null
    const dateStr = format(day, 'yyyy-MM-dd')
    return data.find(d => d.date === dateStr)
  }

  const calculateWeeklyPL = (week: (Date | null)[]) => {
    return week.reduce((acc, day) => {
      const pl = getPLForDay(day)
      return acc + (pl?.amount || 0)
    }, 0)
  }

  const totalMonthlyPL = data.reduce((acc, d) => acc + d.amount, 0)

  return (
    <div className={cn("bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 h-full flex flex-col group transition-all duration-300", className)}>
      <div className="flex items-center justify-between mb-8">
        <div>
           <h3 className="text-sm font-bold text-white tracking-tight">Monthly P&L</h3>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
             Monthly: <span className="text-blue-400">+{totalMonthlyPL.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> {format(currentMonth, 'MMMM yyyy')}
           </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-8 gap-1">
        {/* Header */}
        {['M', 'T', 'W', 'T', 'F', 'S', 'S', ''].map((day, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-zinc-600 pb-2">
            {day}
          </div>
        ))}

        {weeks.map((week, weekIndex) => (
          <Fragment key={weekIndex}>
            {week.map((day, dayIndex) => {
               const pl = getPLForDay(day)
               const isCurrentToday = day ? isToday(day) : false
               
               return (
                 <div 
                   key={`${weekIndex}-${dayIndex}`} 
                   className={cn(
                     "aspect-[1.1] rounded-lg flex flex-col p-2 relative transition-all border border-transparent",
                     day ? "bg-[#121212]" : "bg-transparent",
                     isCurrentToday && "border-blue-500/30"
                   )}
                 >
                   {day && (
                     <>
                       <span className={cn(
                         "text-[10px] font-bold leading-none mb-1",
                         isCurrentToday ? "text-blue-400" : "text-zinc-500"
                       )}>
                         {format(day, 'd')}
                       </span>
                       {pl && (
                         <span className={cn(
                             "text-[9px] font-bold mt-auto text-center leading-tight",
                             pl.amount > 0 ? "text-blue-400" : "text-red-500"
                         )}>
                           +{Math.round(pl.amount)}
                         </span>
                       )}
                     </>
                   )}
                 </div>
               )
            })}
            {/* Weekly Statistics Column */}
            <div className="aspect-[1.1] rounded-lg bg-[#0a0a0a] border border-white/5 flex flex-col items-center justify-center p-1">
                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">Weekly</span>
                <span className={cn(
                    "text-[10px] font-bold mt-1",
                    calculateWeeklyPL(week) >= 0 ? "text-blue-400" : "text-red-500"
                )}>
                    {calculateWeeklyPL(week) >= 0 ? '+' : ''}{Math.round(calculateWeeklyPL(week))}
                </span>
                <span className="text-[7px] font-medium text-zinc-700 mt-0.5 leading-none text-center">Traded D...</span>
            </div>
          </Fragment>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4 text-[10px] font-bold text-zinc-600">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Profit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>Loss</span>
        </div>
      </div>
    </div>
  )
}

