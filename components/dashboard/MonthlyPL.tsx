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
  
  const startDay = getDay(monthStart)
  const prefixDays = Array.from({ length: (startDay === 0 ? 6 : startDay - 1) })

  const getPLForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return data.find(d => d.date === dateStr)
  }

  return (
    <div className={cn("bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 h-full flex flex-col group relative overflow-hidden transition-all duration-500 hover:border-white/10", className)}>
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-blue-500/10" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
          <div>
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] leading-none mb-1">Yield_Matrix</h3>
            <p className="text-[8px] font-bold text-foreground-disabled uppercase tracking-widest">Monthly_Performance_Log</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            {format(currentMonth, 'MMM yyyy')}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-white/5 rounded-md border border-white/5 transition-all text-zinc-500 hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-white/5 rounded-md border border-white/5 transition-all text-zinc-500 hover:text-white"
              aria-label="Next month"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-center text-[9px] font-bold text-zinc-600 pb-2 uppercase tracking-tighter">
            {day}
          </div>
        ))}
        
        {prefixDays.map((_, i) => (
          <div key={`prefix-${i}`} className="aspect-square rounded-md bg-transparent" />
        ))}

        {days.map((day, i) => {
          const pl = getPLForDay(day)
          const isCurrentToday = isToday(day)
          
          return (
            <div 
              key={i} 
              className={cn(
                "aspect-square rounded-md flex flex-col items-center justify-center relative transition-all border border-white/[0.02]",
                pl && pl.amount > 0 ? "bg-green-500/10 text-green-500" : 
                pl && pl.amount < 0 ? "bg-red-500/10 text-red-500" : 
                "bg-zinc-900/30",
                isCurrentToday && "border-blue-500/50 bg-blue-500/5"
              )}
            >
              <span className={cn(
                "text-[9px] font-bold",
                isCurrentToday ? "text-blue-400" : "text-zinc-600"
              )}>
                {format(day, 'd')}
              </span>
              {pl && (
                <span className="text-[8px] font-black mt-0.5 leading-none">
                  {pl.amount > 0 ? '+' : ''}{Math.round(pl.amount)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center opacity-60">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500/20 border border-green-500/50" />
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Gain</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50" />
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Loss</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-zinc-800" />
          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Flat</span>
        </div>
      </div>
      {/* Ambient Glow */}
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
    </div>
  )
}

