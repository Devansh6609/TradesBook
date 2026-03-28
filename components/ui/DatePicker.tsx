import * as React from 'react'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns'

interface DatePickerProps {
  label?: string
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  className?: string
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  disabled = false,
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(value || new Date())
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDateSelect = (date: Date) => {
    onChange(date)
    setIsOpen(false)
  }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const days = React.useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors',
            'bg-background-tertiary text-foreground',
            'hover:border-border-hover',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error && 'border-loss focus:ring-loss',
            !error && 'border-border',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          disabled={disabled}
        >
          <CalendarIcon size={16} className="text-foreground-muted" />
          <span className={cn('flex-1 text-left', !value && 'text-foreground-muted')}>
            {value ? format(value, 'MM/dd/yyyy') : placeholder}
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 bg-background-secondary border border-border rounded-md shadow-lg p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-background-tertiary"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-background-tertiary"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs text-foreground-muted py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map((day) => {
                const isSelected = value && isSameDay(day, value)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isDisabled = (minDate && day < minDate) || (maxDate && day > maxDate)

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => !isDisabled && handleDateSelect(day)}
                    disabled={isDisabled}
                    className={cn(
                      'w-8 h-8 text-sm rounded-md transition-colors',
                      'hover:bg-background-tertiary',
                      isSelected && 'bg-blue-500 text-white hover:bg-blue-600',
                      !isCurrentMonth && 'text-foreground-muted',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-loss">{error}</p>}
    </div>
  )
}

interface DateTimePickerProps extends Omit<DatePickerProps, 'value' | 'onChange'> {
  value?: Date | null
  onChange: (date: Date | null) => void
}

export function DateTimePicker({
  value,
  onChange,
  label,
  error,
  disabled,
  className,
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | null>(value || null)

  React.useEffect(() => {
    setDate(value || null)
  }, [value])

  const handleDateChange = (newDate: Date | null) => {
    setDate(newDate)
    if (newDate) {
      onChange(newDate)
    } else {
      onChange(null)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (date) {
      const [hours, minutes] = e.target.value.split(':').map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes)
      onChange(newDate)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <DatePicker
          value={date}
          onChange={handleDateChange}
          placeholder="Select date"
          disabled={disabled}
          className="flex-1"
        />
        <input
          type="time"
          value={date ? format(date, 'HH:mm') : ''}
          onChange={handleTimeChange}
          disabled={!date || disabled}
          className={cn(
            'px-3 py-2 text-sm rounded-md border bg-background-tertiary text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-loss' : 'border-border'
          )}
        />
      </div>
      {error && <p className="text-sm text-loss">{error}</p>}
    </div>
  )
}

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (range: { startDate: Date | null; endDate: Date | null }) => void
  label?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  label,
  error,
  disabled,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <DatePicker
          value={startDate}
          onChange={(date) => onChange({ startDate: date, endDate })}
          placeholder="Start date"
          disabled={disabled}
          maxDate={endDate || undefined}
          className="flex-1"
        />
        <span className="text-foreground-muted">to</span>
        <DatePicker
          value={endDate}
          onChange={(date) => onChange({ startDate, endDate: date })}
          placeholder="End date"
          disabled={disabled}
          minDate={startDate || undefined}
          className="flex-1"
        />
      </div>
      {error && <p className="text-sm text-loss">{error}</p>}
    </div>
  )
}
