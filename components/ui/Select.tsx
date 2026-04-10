import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check, X } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  label?: string
  placeholder?: string
  value?: string | string[]
  options: SelectOption[]
  onChange: (value: string | string[]) => void
  error?: string
  disabled?: boolean
  searchable?: boolean
  multiple?: boolean
  clearable?: boolean
  className?: string
}

export function Select({
  label,
  placeholder = 'Select an option',
  value,
  options,
  onChange,
  error,
  disabled = false,
  searchable = false,
  multiple = false,
  clearable = false,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selectedValues = Array.isArray(value) ? value : value ? [value] : []

  const filteredOptions = React.useMemo(() => {
    const opts = options || []
    if (!searchable || !searchQuery) return opts
    return opts.filter(opt =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [options, searchable, searchQuery])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, searchable])

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue]
      onChange(newValues)
    } else {
      onChange(optionValue)
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(multiple ? [] : '')
  }

  const getSelectedLabel = () => {
    if (selectedValues.length === 0) return null
    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0])
      return option?.label
    }
    return `${selectedValues.length} selected`
  }

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md border transition-colors',
            'bg-background-tertiary text-foreground',
            'hover:border-border-hover',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error && 'border-loss focus:ring-loss',
            !error && 'border-border',
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'border-blue-500 ring-1 ring-blue-500'
          )}
          disabled={disabled}
        >
          <span className={cn('truncate', !selectedValues.length && 'text-foreground-muted')}>
            {getSelectedLabel() || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {clearable && selectedValues.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded hover:bg-background-tertiary"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown
              size={16}
              className={cn(
                'text-foreground-muted transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background-secondary border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b border-border">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-1.5 text-sm bg-background-tertiary border border-border rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Options */}
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-foreground-muted">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      disabled={option.disabled}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                        'hover:bg-background-tertiary',
                        isSelected && 'bg-blue-500/10 text-blue-500',
                        option.disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {multiple && (
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                            isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-border'
                          )}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      )}
                      <span className="flex-1 truncate">{option.label}</span>
                      {!multiple && isSelected && (
                        <Check size={16} className="text-blue-500" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-loss">{error}</p>}
    </div>
  )
}

// Simple native select for basic use cases
interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
}

export function NativeSelect({
  label,
  error,
  options,
  className,
  ...props
}: NativeSelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full px-3 py-2 text-sm rounded-md border bg-background-tertiary text-foreground',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-loss focus:ring-loss' : 'border-border hover:border-border-hover',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-loss">{error}</p>}
    </div>
  )
}
