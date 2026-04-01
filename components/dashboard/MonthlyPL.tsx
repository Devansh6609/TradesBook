'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useState, useMemo, Fragment } from 'react'
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
  isSameDay
} from 'date-fns'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, DailyPnLPoint } from '@/lib/apiClient'
import { Modal } from '@/components/ui/Modal'

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'WEEK']

export default function MonthlyPL() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Fetch monthly P&L data
  const { data: pnlData, isLoading } = useQuery({
    queryKey: ['monthly-pnl', year, month],
    queryFn: async () => {
      const dateFrom = startOfMonth(currentMonth).toISOString()
      const dateTo = endOfMonth(currentMonth).toISOString()
      return api.analytics.dailyPnL({ dateFrom, dateTo })
    },
    placeholderData: keepPreviousData,
  })

  // Fetch trades for selected day (for modal)
  const { data: dayTrades, isLoading: tradesLoading } = useQuery({
    queryKey: ['day-trades', selectedDay],
    queryFn: async () => {
      if (!selectedDay) return null
      const dateFrom = `${selectedDay}T00:00:00.000Z`
      const dateTo = `${selectedDay}T23:59:59.999Z`
      return api.trades.list({ dateFrom, dateTo, status: 'CLOSED' })
    },
    enabled: !!selectedDay,
  })

  const pnlMap = useMemo(() => {
    const map: Record<string, { pnl: number; trades: number }> = {}
    if (pnlData?.dailyPnL) {
      for (const d of pnlData.dailyPnL as DailyPnLPoint[]) {
        const dateKey = d.date.split('T')[0]
        map[dateKey] = { pnl: parseFloat(d.pnl), trades: d.trades }
      }
    }
    return map
  }, [pnlData])

  const totalMonthlyPnl = Object.values(pnlMap).reduce((s, v) => s + v.pnl, 0)
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  
  // Create a grid of weeks
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  const weeks: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  const getDayPnl = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd')
    return pnlMap[key] || { pnl: 0, trades: 0 }
  }

  const handleDayClick = (day: Date) => {
    const entry = getDayPnl(day)
    if (entry.trades > 0) {
      setSelectedDay(format(day, 'yyyy-MM-dd'))
    }
  }

  return (
    <div className="premium-card h-full flex flex-col p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled leading-none mb-2">Monthly P&L</h3>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-lg font-black tracking-tighter",
              totalMonthlyPnl >= 0 ? "text-blue-400" : "text-red-400"
            )}>
              {totalMonthlyPnl >= 0 ? '+' : ''}${Math.abs(totalMonthlyPnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-bold text-foreground-disabled uppercase">
              {format(currentMonth, 'MMM yyyy')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/5 rounded-lg">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 hover:bg-white/5 rounded-md text-foreground-disabled hover:text-foreground transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 hover:bg-white/5 rounded-md text-foreground-disabled hover:text-foreground transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-8 gap-1 content-start">
        {WEEKDAYS.map((day, i) => (
          <div key={i} className="text-center text-[8px] font-black text-foreground-disabled py-2 uppercase tracking-widest bg-white/[0.01] rounded-sm mb-1">
            {day}
          </div>
        ))}
        
        {weeks.map((week, weekIdx) => {
          const weekPnl = week.reduce((sum, day) => sum + getDayPnl(day).pnl, 0)
          
          return (
            <Fragment key={weekIdx}>
              {week.map((day, dayIdx) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const entry = getDayPnl(day)
                const isCurrentToday = isToday(day)
                
                return (
                  <div 
                    key={dayIdx}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "aspect-square rounded-md flex flex-col items-center justify-center relative transition-all border group/day",
                      !isCurrentMonth ? "opacity-[0.15]" : "opacity-100",
                      entry.pnl > 0 ? "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 cursor-pointer" :
                      entry.pnl < 0 ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 cursor-pointer" :
                      "bg-white/[0.02] border-white/5 hover:border-white/10",
                      isCurrentToday && "ring-1 ring-blue-500/50 border-blue-500/50"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-black",
                      isCurrentToday && !entry.pnl ? "text-blue-500" : ""
                    )}>
                      {format(day, 'd')}
                    </span>
                    {entry.pnl !== 0 && (
                      <span className="text-[7px] font-mono font-bold leading-none mt-0.5 opacity-80">
                        ${Math.abs(entry.pnl).toFixed(0)}
                      </span>
                    )}
                  </div>
                )
              })}
              
              {/* Weekly Summary Column */}
              <div className={cn(
                "aspect-square rounded-md flex flex-col items-center justify-center border font-mono",
                weekPnl > 0 ? "bg-blue-500/5 border-blue-500/10 text-blue-400/70" :
                weekPnl < 0 ? "bg-red-500/5 border-red-500/10 text-red-400/70" :
                "bg-white/[0.01] border-white/5 text-foreground-disabled/50"
              )}>
                <span className="text-[7px] font-black uppercase opacity-50 mb-0.5">W{format(week[0], 'w')}</span>
                <span className="text-[8px] font-black">
                  {weekPnl > 0 ? '+' : weekPnl < 0 ? '-' : ''}${Math.abs(weekPnl).toFixed(0)}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-blue-400">Profit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-red-400">Loss</span>
          </div>
        </div>
        <span className="text-[8px] font-bold uppercase tracking-tighter">Weekly Aggregation Active</span>
      </div>

      {/* Day Trades Modal */}
      <Modal
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={`Trades for ${selectedDay ? format(new Date(selectedDay + 'T12:00:00'), 'MMMM d, yyyy') : ''}`}
      >
        {tradesLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
             <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled">Fetching Records</p>
          </div>
        ) : !dayTrades?.trades?.length ? (
          <div className="py-12 text-center">
            <p className="text-foreground-muted">No trades found for this day.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar p-1">
            {dayTrades.trades.map((trade: any) => {
              const pnl = parseFloat(trade.netPnl || trade.pnl || '0')
              const isProfit = pnl >= 0
              return (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      trade.type === 'BUY' ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {trade.type === 'BUY' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div>
                      <h4 className="font-black text-foreground tracking-tight">{trade.symbol}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
                          trade.type === 'BUY' ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {trade.type}
                        </span>
                        <span className="text-[10px] font-mono text-foreground-disabled">
                          {trade.quantity} LOTS
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={cn(
                      "text-lg font-black tracking-tighter",
                      isProfit ? "text-blue-400" : "text-red-400"
                    )}>
                      {isProfit ? '+' : '-'}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-foreground-disabled font-mono mt-0.5 uppercase tracking-tighter">
                      Closed @ {trade.exitPrice}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="mt-6 flex justify-center">
            <button 
                onClick={() => setSelectedDay(null)}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled hover:text-white transition-colors"
            >
                View Full History →
            </button>
        </div>
      </Modal>
    </div>
  )
}
