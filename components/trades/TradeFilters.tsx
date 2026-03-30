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
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Symbol Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-widest pl-1">Vector_ID</label>
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/5 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <Input
              placeholder="EURUSD, BTCUSD..."
              value={filters.symbol}
              onChange={(e) => onChange({ ...filters, symbol: e.target.value.toUpperCase() })}
              className="bg-black/40 border-white/10 text-white placeholder:text-foreground-disabled/30 text-xs font-bold uppercase tracking-wider h-11 focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>

        {/* Direction Select */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-widest pl-1">Vector_Dir</label>
          <Select
            value={filters.type}
            options={typeOpts}
            onChange={(value) => onChange({ ...filters, type: value as string })}
            className="bg-black/40 border-white/10 text-white text-xs font-bold h-11"
          />
        </div>

        {/* Status Select */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-widest pl-1">Process_State</label>
          <Select
            value={filters.status}
            options={statusOpts}
            onChange={(value) => onChange({ ...filters, status: value as string })}
            className="bg-black/40 border-white/10 text-white text-xs font-bold h-11"
          />
        </div>

        {/* Strategy Select */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-widest pl-1">Logic_Protocol</label>
          <Select
            value={filters.strategyId}
            options={strategyOptions}
            onChange={(value) => onChange({ ...filters, strategyId: value as string })}
            searchable
            className="bg-black/40 border-white/10 text-white text-xs font-bold h-11"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end">
        {/* Date Range */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-widest pl-1">Temporal_Window</label>
          <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-1.5 min-h-[44px] flex items-center">
            <DateRangePicker
              startDate={filters.dateFrom}
              endDate={filters.dateTo}
              onChange={handleDateChange}
              className="w-full bg-transparent border-0 text-xs font-bold text-white p-0"
            />
          </div>
        </div>

        {/* P&L Range & Actions */}
        <div className="flex flex-col sm:flex-row items-end gap-6">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-widest pl-1">PnL_Threshold</label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="MIN"
                value={filters.minPnl}
                onChange={(e) => onChange({ ...filters, minPnl: e.target.value })}
                className="bg-black/40 border-white/10 text-white text-xs font-bold h-11 text-center"
              />
              <div className="w-4 h-px bg-white/10" />
              <Input
                type="number"
                placeholder="MAX"
                value={filters.maxPnl}
                onChange={(e) => onChange({ ...filters, maxPnl: e.target.value })}
                className="bg-black/40 border-white/10 text-white text-xs font-bold h-11 text-center"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="h-11 px-6 rounded-xl border border-white/5 text-[10px] font-black text-foreground-disabled hover:text-white hover:bg-white/5 uppercase tracking-widest transition-all active:scale-95"
              >
                Clear_Matrix
              </button>
            )}
            <button
               onClick={() => onChange({ ...filters })}
               className="h-11 px-8 rounded-xl bg-blue-600 text-[10px] font-black text-white hover:bg-blue-500 uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              Update_Buffer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
