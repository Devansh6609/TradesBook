import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subMonths,
  isEqual
} from 'date-fns'
import { DatePicker } from '@/components/ui/DatePicker'

export interface TradeFiltersState {
  symbol: string
  type: string
  status: string
  strategyId: string
  dateFrom: Date | null
  dateTo: Date | null
  minPnl: string
  maxPnl: string
}

interface TradeFiltersProps {
  filters: TradeFiltersState
  onChange: (filters: TradeFiltersState) => void
  strategies: { id: string; name: string }[]
  stats?: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
  }
  className?: string
}

export function TradeFilters({ filters, onChange, strategies, stats, className }: TradeFiltersProps) {
  const [showCustomDates, setShowCustomDates] = useState(false)

  const handleReset = () => {
    onChange({
      symbol: '',
      type: '',
      status: '',
      strategyId: '',
      dateFrom: null,
      dateTo: null,
      minPnl: '',
      maxPnl: '',
    })
    setShowCustomDates(false)
  }

  const setTimePeriod = (period: string) => {
    const now = new Date()
    let from: Date | null = null
    let to: Date | null = null

    switch (period) {
      case 'today':
        from = startOfDay(now)
        to = endOfDay(now)
        break
      case 'week':
        from = startOfWeek(now, { weekStartsOn: 1 })
        to = endOfWeek(now, { weekStartsOn: 1 })
        break
      case 'month':
        from = startOfMonth(now)
        to = endOfMonth(now)
        break
      case 'lastMonth':
        const lastMonth = subMonths(now, 1)
        from = startOfMonth(lastMonth)
        to = endOfMonth(lastMonth)
        break
      case 'last3Months':
        from = startOfMonth(subMonths(now, 2))
        to = endOfMonth(now)
        break
      case 'all':
      default:
        from = null
        to = null
        break
    }

    onChange({ ...filters, dateFrom: from, dateTo: to })
    setShowCustomDates(false)
  }

  const isPeriodActive = (period: string) => {
    if (showCustomDates && period !== 'custom') return false
    
    const now = new Date()
    let from: Date | null = null
    let to: Date | null = null

    switch (period) {
      case 'today': from = startOfDay(now); to = endOfDay(now); break;
      case 'week': from = startOfWeek(now, { weekStartsOn: 1 }); to = endOfWeek(now, { weekStartsOn: 1 }); break;
      case 'month': from = startOfMonth(now); to = endOfMonth(now); break;
      case 'lastMonth': from = startOfMonth(subMonths(now, 1)); to = endOfMonth(subMonths(now, 1)); break;
      case 'last3Months': from = startOfMonth(subMonths(now, 2)); to = endOfMonth(now); break;
      case 'all': from = null; to = null; break;
    }

    if (period === 'all') return !filters.dateFrom && !filters.dateTo && !showCustomDates
    
    if (!filters.dateFrom || !filters.dateTo) return false

    return isEqual(filters.dateFrom, from!) && isEqual(filters.dateTo, to!)
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start gap-8">
          {/* P&L Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-foreground-disabled uppercase tracking-widest pl-0.5">P&L</label>
            <div className="flex items-center gap-1.5 p-1 bg-[#111111] rounded-lg border border-white/5">
              <FilterButton 
                active={!filters.minPnl && !filters.maxPnl} 
                onClick={() => onChange({ ...filters, minPnl: '', maxPnl: '' })}
              >
                All
              </FilterButton>
              <FilterButton 
                active={filters.minPnl === '0'} 
                onClick={() => onChange({ ...filters, minPnl: '0', maxPnl: '' })}
              >
                Profitable ({stats?.winningTrades || 0})
              </FilterButton>
              <FilterButton 
                active={filters.maxPnl === '0'} 
                onClick={() => onChange({ ...filters, minPnl: '', maxPnl: '0' })}
              >
                Loss ({stats?.losingTrades || 0})
              </FilterButton>
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-foreground-disabled uppercase tracking-widest pl-0.5">Type</label>
            <div className="flex items-center gap-1.5 p-1 bg-[#111111] rounded-lg border border-white/5">
              <FilterButton 
                active={!filters.type} 
                onClick={() => onChange({ ...filters, type: '' })}
              >
                All
              </FilterButton>
              <FilterButton 
                active={filters.type === 'BUY'} 
                onClick={() => onChange({ ...filters, type: 'BUY' })}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                  Long
                </div>
              </FilterButton>
              <FilterButton 
                active={filters.type === 'SELL'} 
                onClick={() => onChange({ ...filters, type: 'SELL' })}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                  Short
                </div>
              </FilterButton>
            </div>
          </div>
        </div>

        {/* Time Period Filter */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-foreground-disabled uppercase tracking-widest pl-0.5">Time Period</label>
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#111111] rounded-lg border border-white/5">
              <FilterButton active={isPeriodActive('all')} onClick={() => setTimePeriod('all')}>All Time</FilterButton>
              <FilterButton active={isPeriodActive('today')} onClick={() => setTimePeriod('today')}>Today</FilterButton>
              <FilterButton active={isPeriodActive('week')} onClick={() => setTimePeriod('week')}>This Week</FilterButton>
              <FilterButton active={isPeriodActive('month')} onClick={() => setTimePeriod('month')}>This Month</FilterButton>
              <FilterButton active={isPeriodActive('lastMonth')} onClick={() => setTimePeriod('lastMonth')}>Last Month</FilterButton>
              <FilterButton active={isPeriodActive('last3Months')} onClick={() => setTimePeriod('last3Months')}>Last 3 Months</FilterButton>
              <FilterButton 
                active={showCustomDates} 
                onClick={() => setShowCustomDates(!showCustomDates)}
              >
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  Custom
                </div>
              </FilterButton>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 border border-white/5 text-xs font-bold text-foreground-disabled hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={14} />
            Clear All Filters
          </button>
        </div>

        {/* Custom Date Inputs */}
        {showCustomDates && (
          <div className="flex items-center gap-4 p-4 bg-[#111111]/50 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-foreground-disabled uppercase pl-1">Start Date</span>
              <DatePicker
                value={filters.dateFrom}
                onChange={(date) => onChange({ ...filters, dateFrom: date })}
                placeholder="Select date"
                className="w-48"
              />
            </div>
            <div className="h-8 w-px bg-white/5 self-end mb-2" />
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-foreground-disabled uppercase pl-1">End Date</span>
              <DatePicker
                value={filters.dateTo}
                onChange={(date) => onChange({ ...filters, dateTo: date })}
                placeholder="Select date"
                className="w-48"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-md text-[13px] font-bold transition-all whitespace-nowrap",
        active 
          ? "bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
          : "text-foreground-disabled hover:text-foreground-muted hover:bg-white/[0.02]"
      )}
    >
      {children}
    </button>
  )
}
