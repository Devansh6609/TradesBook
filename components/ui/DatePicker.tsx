import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ChevronUp, ChevronDown, Check } from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  getDay,
  subDays,
  setHours,
  setMinutes,
  getHours,
  getMinutes
} from 'date-fns'

interface DateTimePickerProps {
  label?: string
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date & time',
  error,
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [view, setView] = React.useState<'date' | 'time'>('date')
  const [currentMonth, setCurrentMonth] = React.useState(value || new Date())
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 })
  const containerRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)

  // Update coords when opening
  const updateCoords = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX
      
      // Calculate best position (top or bottom)
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceNeeded = 360 // max picker height
      
      let top = rect.bottom + scrollY + 4
      if (spaceBelow < spaceNeeded && rect.top > spaceNeeded) {
        top = rect.top + scrollY - spaceNeeded - 4
      }

      setCoords({
        top,
        left: rect.left + scrollX,
        width: Math.max(rect.width, 280) // min width
      })
    }
  }, [])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setTimeout(() => setView('date'), 200)
      }
    }

    if (isOpen) {
      updateCoords()
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', updateCoords, true)
      window.addEventListener('resize', updateCoords)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [isOpen, updateCoords])

  const handleDateSelect = (date: Date) => {
    const newValue = value ? new Date(value) : new Date()
    newValue.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
    onChange(newValue)
    setView('time')
    updateCoords()
  }

  const handleQuickSelect = (type: 'now' | 'yesterday' | 'clear') => {
    if (type === 'clear') {
      onChange(null)
      setIsOpen(false)
      return
    }
    const date = type === 'now' ? new Date() : subDays(new Date(), 1)
    onChange(date)
    setIsOpen(false)
  }

  const handleTimeChange = (type: 'hour' | 'minute' | 'ampm', direction: 'up' | 'down' | 'toggle') => {
    if (!value) return
    const date = new Date(value)
    let hours = getHours(date)
    let minutes = getMinutes(date)

    if (type === 'hour') {
      hours = direction === 'up' ? (hours + 1) % 24 : (hours - 1 + 24) % 24
    } else if (type === 'minute') {
      minutes = direction === 'up' ? (minutes + 1) % 60 : (minutes - 1 + 60) % 60
    } else if (type === 'ampm') {
      hours = (hours + 12) % 24
    }

    const nextDate = setHours(setMinutes(date, minutes), hours)
    onChange(nextDate)
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentMonth(subMonths(currentMonth, 1))
  }
  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const days = React.useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const weekDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

  const displayHours = value ? (getHours(value) % 12 || 12).toString().padStart(2, '0') : '--'
  const displayMinutes = value ? getMinutes(value).toString().padStart(2, '0') : '--'
  const ampm = value ? (getHours(value) >= 12 ? 'PM' : 'AM') : '--'

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {label && (
        <label className="text-[9px] font-bold text-foreground-disabled/50 uppercase tracking-widest ml-1 mb-1.5 block">
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 h-9 text-[11px] font-medium rounded-lg border transition-all uppercase tracking-wide',
          'bg-[#111111] text-foreground border-white/5',
          'hover:border-white/10 group',
          'focus:outline-none focus:ring-1 focus:ring-blue-500/10',
          isOpen && 'border-blue-500/30 bg-[#111111]',
          error && 'border-red-500/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        disabled={disabled}
      >
        <CalendarIcon size={12} className={cn('transition-colors', value ? 'text-blue-500' : 'text-foreground-disabled/30')} />
        <span className={cn('flex-1 text-left truncate', !value && 'text-foreground-disabled/30')}>
          {value ? format(value, 'MMM d, yyyy h:mm a') : placeholder}
        </span>
        <ChevronDown size={12} className="text-foreground-disabled/30 group-hover:text-foreground-disabled/50 transition-colors" />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={popoverRef}
          className="fixed z-[9999] animate-in zoom-in-95 fade-in duration-200 top-[var(--popover-top)] left-[var(--popover-left)] w-[var(--popover-width)] min-w-[280px]"
          style={{ 
            '--popover-top': `${coords.top}px`, 
            '--popover-left': `${coords.left}px`,
            '--popover-width': `${coords.width}px`
          } as React.CSSProperties}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="bg-[#121212] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_1px_rgba(255,255,255,0.1)] overflow-hidden backdrop-blur-2xl">
            {view === 'date' ? (
              <div className="p-4">
                {/* Header Actions */}
                <div className="flex gap-2 mb-4 pb-4 border-b border-white/5">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect('now')}
                    aria-label="Set to Now"
                    title="Set to Now"
                    className="flex-1 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/5 hover:bg-white/5 text-[9px] font-bold text-foreground-disabled/60 uppercase tracking-widest transition-all"
                  >
                    Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect('yesterday')}
                    aria-label="Set to Yesterday"
                    title="Set to Yesterday"
                    className="flex-1 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/5 hover:bg-white/5 text-[9px] font-bold text-foreground-disabled/60 uppercase tracking-widest transition-all"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect('clear')}
                    aria-label="Clear selection"
                    title="Clear selection"
                    className="flex-1 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/5 hover:bg-red-500/10 text-[9px] font-bold text-foreground-disabled/60 uppercase tracking-widest transition-all hover:text-red-500"
                  >
                    Clear
                  </button>
                </div>

                {/* Date Selection */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <button 
                    type="button"
                    onClick={handlePrevMonth} 
                    aria-label="Previous Month"
                    title="Previous Month"
                    className="p-1 rounded-md hover:bg-white/5 text-foreground-disabled/40 hover:text-white transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <button 
                    type="button"
                    onClick={handleNextMonth} 
                    aria-label="Next Month"
                    title="Next Month"
                    className="p-1 rounded-md hover:bg-white/5 text-foreground-disabled/40 hover:text-white transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-[8px] font-bold text-foreground-disabled/20 py-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {days.map((day) => {
                    const isSelected = value && isSameDay(day, value)
                    const isToday = isSameDay(day, new Date())
                    const isCurrentMonth = isSameMonth(day, currentMonth)

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleDateSelect(day)}
                        aria-label={format(day, 'MMMM d, yyyy')}
                        title={format(day, 'MMMM d, yyyy')}
                        className={cn(
                          'w-8 h-8 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center',
                          'hover:bg-white/5 hover:text-white',
                          isSelected && 'bg-blue-600 text-white font-black shadow-[0_0_20px_rgba(37,99,235,0.4)]',
                          !isSelected && isToday && 'bg-blue-500/10 text-blue-500 font-black',
                          !isCurrentMonth && !isSelected && 'text-foreground-disabled/10',
                          isCurrentMonth && !isSelected && 'text-foreground-disabled/40 font-medium'
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="p-5">
                {/* Time Selector Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                  <button 
                    type="button"
                    onClick={() => setView('date')}
                    aria-label="Back to Date selection"
                    title="Back to Date selection"
                    className="p-2 hover:bg-white/5 rounded-lg text-foreground-disabled transition-all group"
                  >
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                      {value ? format(value, 'MMM do, yyyy') : ''}
                    </span>
                    <span className="text-[9px] font-bold text-foreground-disabled/40 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                      <Clock size={10} />
                      Select_Time
                    </span>
                  </div>
                </div>

                {/* Big Time Display */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="flex flex-col items-center gap-2">
                    <button type="button" onClick={() => handleTimeChange('hour', 'up')} aria-label="Increment hour" title="Increment hour" className="p-1 hover:text-blue-500 transition-colors">
                      <ChevronUp size={18} />
                    </button>
                    <div className="text-3xl font-black text-white font-mono bg-[#1a1a1a] px-3.5 py-4 rounded-xl border border-white/5 shadow-inner min-w-[64px] text-center">
                      {displayHours}
                    </div>
                    <button type="button" onClick={() => handleTimeChange('hour', 'down')} aria-label="Decrement hour" title="Decrement hour" className="p-1 hover:text-blue-500 transition-colors">
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  <div className="text-2xl font-black text-white/20 pb-1">:</div>
                  <div className="flex flex-col items-center gap-2">
                    <button type="button" onClick={() => handleTimeChange('minute', 'up')} aria-label="Increment minute" title="Increment minute" className="p-1 hover:text-blue-500 transition-colors">
                      <ChevronUp size={18} />
                    </button>
                    <div className="text-3xl font-black text-white font-mono bg-[#1a1a1a] px-3.5 py-4 rounded-xl border border-white/5 shadow-inner min-w-[64px] text-center">
                      {displayMinutes}
                    </div>
                    <button type="button" onClick={() => handleTimeChange('minute', 'down')} aria-label="Decrement minute" title="Decrement minute" className="p-1 hover:text-blue-500 transition-colors">
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-2 ml-1 pt-1">
                    <button 
                      type="button" 
                      onClick={() => handleTimeChange('ampm', 'toggle')}
                      aria-label="Toggle AM/PM"
                      title="Toggle AM/PM"
                      className="h-[68px] text-xs font-black text-blue-500 bg-blue-500/10 px-4 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center justify-center"
                    >
                      {ampm}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
                >
                  <Check size={14} strokeWidth={3} />
                  Done
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export function DatePicker({ value, onChange, ...props }: Omit<DateTimePickerProps, 'onChange'> & { onChange: (date: Date | null) => void }) {
  return <DateTimePicker value={value} onChange={onChange} {...props} />
}

export { DateTimePicker as DateRangePicker }
