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
  const [isExpanded, setIsExpanded] = useState(false)

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
    { value: '', label: 'All Strategies' },
    ...strategies.map((s) => ({ value: s.id, label: s.name })),
  ]

  const statusOpts = [
    { value: '', label: 'All Statuses' },
    ...statusOptions.map((s) => ({ value: s.value, label: s.label })),
  ]

  const typeOpts = [
    { value: '', label: 'All Types' },
    ...typeOptions.map((t) => ({ value: t.value, label: t.label })),
  ]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn('gap-2', isExpanded && 'bg-background-tertiary')}
        >
          <Filter size={16} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 rounded-full text-white">
              Active
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 text-foreground-muted">
            <X size={16} />
            Reset
          </Button>
        )}

        {/* Active filter badges */}
        {filters.symbol && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background-tertiary border border-border rounded-md">
            Symbol: {filters.symbol}
            <button onClick={() => onChange({ ...filters, symbol: '' })}>
              <X size={12} />
            </button>
          </span>
        )}
        {filters.type && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background-tertiary border border-border rounded-md">
            Type: {filters.type}
            <button onClick={() => onChange({ ...filters, type: '' })}>
              <X size={12} />
            </button>
          </span>
        )}
        {filters.status && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background-tertiary border border-border rounded-md">
            Status: {filters.status}
            <button onClick={() => onChange({ ...filters, status: '' })}>
              <X size={12} />
            </button>
          </span>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 bg-background-secondary border border-border rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Symbol */}
            <Input
              label="Symbol"
              placeholder="e.g., EURUSD"
              value={filters.symbol}
              onChange={(e) => onChange({ ...filters, symbol: e.target.value.toUpperCase() })}
            />

            {/* Type */}
            <Select
              label="Direction"
              placeholder="All Types"
              value={filters.type}
              options={typeOpts}
              onChange={(value) => onChange({ ...filters, type: value as string })}
            />

            {/* Status */}
            <Select
              label="Status"
              placeholder="All Statuses"
              value={filters.status}
              options={statusOpts}
              onChange={(value) => onChange({ ...filters, status: value as string })}
            />

            {/* Strategy */}
            <Select
              label="Strategy"
              placeholder="All Strategies"
              value={filters.strategyId}
              options={strategyOptions}
              onChange={(value) => onChange({ ...filters, strategyId: value as string })}
              searchable
            />

            {/* Date Range */}
            <div className="md:col-span-2">
              <DateRangePicker
                label="Date Range"
                startDate={filters.dateFrom}
                endDate={filters.dateTo}
                onChange={handleDateChange}
              />
            </div>

            {/* P&L Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">P&L Range</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min P&L"
                  value={filters.minPnl}
                  onChange={(e) => onChange({ ...filters, minPnl: e.target.value })}
                  className="flex-1"
                />
                <span className="text-foreground-muted">to</span>
                <Input
                  type="number"
                  placeholder="Max P&L"
                  value={filters.maxPnl}
                  onChange={(e) => onChange({ ...filters, maxPnl: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Reset All
            </Button>
            <Button size="sm" onClick={() => setIsExpanded(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
