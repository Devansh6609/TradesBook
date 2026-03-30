import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DateRangePicker } from '@/components/ui/DatePicker'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { statusOptions, typeOptions } from '@/lib/validations/trade'

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
  className?: string
}

export function TradeFilters({ filters, onChange, strategies, className }: TradeFiltersProps) {
  const hasActiveFilters =
    filters.symbol ||
    filters.type ||
    filters.status ||
    filters.strategyId ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.minPnl ||
    filters.maxPnl

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
  }

  const handleDateChange = (range: { startDate: Date | null; endDate: Date | null }) => {
    onChange({
      ...filters,
      dateFrom: range.startDate,
      dateTo: range.endDate,
    })
  }

  const strategyOptions = [
    { value: '', label: 'ALL_STRATEGIES' },
    ...strategies.map((s) => ({ value: s.id, label: s.name.toUpperCase() })),
  ]

  const statusOpts = [
    { value: '', label: 'ALL_STATUSES' },
    ...statusOptions.map((s) => ({ value: s.value, label: s.label.toUpperCase() })),
  ]

  const typeOpts = [
    { value: '', label: 'ALL_TYPES' },
    ...typeOptions.map((t) => ({ value: t.value, label: t.label.toUpperCase() })),
  ]

  return (
    <div className={cn('space-y-8', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Symbol Input */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-blue-500/80 uppercase tracking-[0.2em] pl-1 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">Vector_ID</label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
            <Input
              placeholder="EURUSD, BTCUSD..."
              value={filters.symbol}
              onChange={(e) => onChange({ ...filters, symbol: e.target.value.toUpperCase() })}
              className="relative bg-black/60 border-white/5 text-white placeholder:text-foreground-disabled/20 text-xs font-black uppercase tracking-widest h-12 focus:border-blue-500/40 rounded-xl transition-all hover:bg-black/80"
            />
          </div>
        </div>

        {/* Direction Select */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-[0.2em] pl-1">Vector_Dir</label>
          <Select
            value={filters.type}
            options={typeOpts}
            onChange={(value) => onChange({ ...filters, type: value as string })}
            className="bg-black/60 border-white/5 text-white text-xs font-black h-12 rounded-xl hover:bg-black/80 transition-all"
          />
        </div>

        {/* Status Select */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-[0.2em] pl-1">Process_State</label>
          <Select
            value={filters.status}
            options={statusOpts}
            onChange={(value) => onChange({ ...filters, status: value as string })}
            className="bg-black/60 border-white/5 text-white text-xs font-black h-12 rounded-xl hover:bg-black/80 transition-all"
          />
        </div>

        {/* Strategy Select */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-[0.2em] pl-1">Protocol_Logic</label>
          <Select
            value={filters.strategyId}
            options={strategyOptions}
            onChange={(value) => onChange({ ...filters, strategyId: value as string })}
            searchable
            className="bg-black/60 border-white/5 text-white text-xs font-black h-12 rounded-xl hover:bg-black/80 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
        {/* Date Range */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-[0.2em] pl-1">Temporal_Window</label>
          <div className="bg-black/60 border border-white/5 rounded-xl px-4 py-1.5 min-h-[48px] flex items-center hover:bg-black/80 transition-all">
            <DateRangePicker
              startDate={filters.dateFrom}
              endDate={filters.dateTo}
              onChange={handleDateChange}
              className="w-full bg-transparent border-0 text-xs font-black tracking-widest text-white p-0"
            />
          </div>
        </div>

        {/* P&L Range & Actions */}
        <div className="flex flex-col sm:flex-row items-end gap-6">
          <div className="flex-1 space-y-2.5 w-full">
            <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-[0.2em] pl-1">PnL_Threshold</label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="MIN"
                value={filters.minPnl}
                onChange={(e) => onChange({ ...filters, minPnl: e.target.value })}
                className="bg-black/60 border-white/5 text-white text-xs font-black font-mono h-12 text-center rounded-xl hover:bg-black/80 transition-all"
              />
              <div className="w-6 h-px bg-white/10 shrink-0" />
              <Input
                type="number"
                placeholder="MAX"
                value={filters.maxPnl}
                onChange={(e) => onChange({ ...filters, maxPnl: e.target.value })}
                className="bg-black/60 border-white/5 text-white text-xs font-black font-mono h-12 text-center rounded-xl hover:bg-black/80 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="h-12 px-6 rounded-xl border border-white/5 text-[10px] font-black text-foreground-disabled hover:text-white hover:bg-white/5 uppercase tracking-[0.3em] transition-all active:scale-95 whitespace-nowrap"
              >
                Clear_Matrix
              </button>
            )}
            <button
               onClick={() => onChange({ ...filters })}
               className="h-12 px-10 rounded-xl bg-blue-600 text-[10px] font-black text-white hover:bg-blue-500 uppercase tracking-[0.3em] shadow-[0_8px_24px_-8px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_32px_-4px_rgba(37,99,235,0.6)] transition-all active:scale-95 whitespace-nowrap"
            >
              Update_Buffer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
