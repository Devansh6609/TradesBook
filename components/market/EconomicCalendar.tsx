'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
    ChevronLeft, ChevronRight, RefreshCw,
    ArrowUpRight, ArrowDownRight, Minus, Clock,
    Calendar, ChevronDown, Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIEventAnalysis } from './AIEventAnalysis'

export interface CalendarEvent {
    id: string
    date: string
    time: string
    country: string
    currency: string
    impact: 'high' | 'medium' | 'low'
    event: string
    actual: string | null
    forecast: string | null
    previous: string | null
    unit: string
}

// Enhanced event with computed properties
interface EnhancedCalendarEvent extends CalendarEvent {
    isPast: boolean
    isUpcoming: boolean
    affectsGold: boolean
    eventDateTime: Date
}

/* ─── Currency → country code for flagcdn.com ─── */
const currencyToCountry: Record<string, string> = {
    USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp',
    AUD: 'au', CAD: 'ca', CHF: 'ch', NZD: 'nz',
    CNY: 'cn', SGD: 'sg', HKD: 'hk', SEK: 'se',
    NOK: 'no', DKK: 'dk', ZAR: 'za', MXN: 'mx',
    BRL: 'br', INR: 'in', KRW: 'kr', TRY: 'tr',
    PLN: 'pl', CZK: 'cz', HUF: 'hu', RUB: 'ru',
    ILS: 'il', THB: 'th', MYR: 'my', PHP: 'ph',
    IDR: 'id', TWD: 'tw', CLP: 'cl', COP: 'co',
    PEN: 'pe', ARS: 'ar', SAR: 'sa', AED: 'ae',
}

/* ─── Emoji flags fallback ─── */
const currencyFlags: Record<string, string> = {
    USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵',
    AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', NZD: '🇳🇿',
    CNY: '🇨🇳',
}

const impactConfig = {
    high: { bg: 'bg-red-500/15', text: 'text-red-500', dot: 'bg-red-500', label: 'HIGH' },
    medium: { bg: 'bg-orange-500/15', text: 'text-orange-500', dot: 'bg-orange-500', label: 'MED' },
    low: { bg: 'bg-green-500/15', text: 'text-green-500', dot: 'bg-green-500', label: 'LOW' },
}

// Events that typically move Gold
const goldMovingEvents = [
    'NFP', 'NON-FARM', 'NONFARM', 'PAYROLL',
    'CPI', 'INFLATION', 'CONSUMER PRICE',
    'FED', 'FOMC', 'INTEREST RATE', 'RATE DECISION',
    'GDP', 'GROSS DOMESTIC',
    'UNEMPLOYMENT', 'JOBLESS CLAIMS',
    'PPI', 'PRODUCER PRICE',
    'RETAIL SALES', 'PMI', 'ISM',
    'POWELL', 'YELLEN'
]

function isGoldMovingEvent(event: CalendarEvent): boolean {
    if (event.currency !== 'USD') return false
    return goldMovingEvents.some(k => event.event.toUpperCase().includes(k))
}

/* ─── Timezone-safe local date string (avoids UTC shift from toISOString) ─── */
function toLocalDateStr(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function getWeekDates(date: Date): { from: string; to: string } {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { from: toLocalDateStr(start), to: toLocalDateStr(end) }
}

function parseEventDateTime(event: CalendarEvent): Date {
    const [time, period] = event.time.split(' ')
    const [hourRaw, minute] = time.split(':').map(Number)
    let hour = hourRaw
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    const d = new Date(event.date)
    d.setHours(hour, minute || 0, 0, 0)
    return d
}

function formatCountdown(ms: number): string {
    if (ms <= 0) return 'Now'
    const totalMinutes = Math.floor(ms / 60000)
    if (totalMinutes < 60) return `${totalMinutes}m`
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours < 24) return `${hours}h ${minutes}m`
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
}

function formatTimeAgo(ms: number): string {
    const absMs = Math.abs(ms)
    const totalMinutes = Math.floor(absMs / 60000)
    if (totalMinutes < 60) return `${totalMinutes}m ago`
    const hours = Math.floor(totalMinutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

/* ─── Flag component ─── */
function CurrencyFlag({ currency, size = 20 }: { currency: string; size?: number }) {
    const code = currencyToCountry[currency]
    if (code) {
        return (
            <img
                src={`https://flagcdn.com/w40/${code}.png`}
                alt={currency}
                width={size}
                height={Math.round(size * 0.75)}
                className="rounded-sm object-cover"
                style={{ width: size, height: Math.round(size * 0.75) }}
            />
        )
    }
    // Fallback to emoji
    return <span className="text-sm">{currencyFlags[currency] || '🏳️'}</span>
}

/* ─── Value comparison arrow ─── */
function ValueComparison({ actual, forecast }: { actual: string | null; forecast: string | null }) {
    if (!actual || !forecast) return null
    const a = parseFloat(actual.replace(/[^0-9.-]/g, ''))
    const f = parseFloat(forecast.replace(/[^0-9.-]/g, ''))
    if (isNaN(a) || isNaN(f)) return null
    if (a > f) return <ArrowUpRight className="w-3 h-3 text-green-400" />
    if (a < f) return <ArrowDownRight className="w-3 h-3 text-red-400" />
    return <Minus className="w-3 h-3 text-gray-400" />
}

/* ─── Event Row (matches reference screenshot) ─── */
function EventRow({ event, now, isNextUp }: { event: EnhancedCalendarEvent; now: Date; isNextUp: boolean }) {
    const msUntil = event.eventDateTime.getTime() - now.getTime()
    const impact = impactConfig[event.impact]
    const [expanded, setExpanded] = useState(false)

    // Extract sub-period from event name e.g. "Core CPI (YoY) (Jan)" -> period = "Jan"
    const periodMatch = event.event.match(/\(([A-Z][a-z]{2})\)$/)
    const period = periodMatch ? periodMatch[1] : null

    return (
        <>
            <tr
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "border-b border-[var(--border)] transition-colors cursor-pointer group",
                    event.isPast
                        ? "opacity-50 hover:opacity-70"
                        : isNextUp
                            ? "bg-green-500/5 hover:bg-green-500/8"
                            : "hover:bg-[var(--background-secondary)]"
                )}
            >
                {/* Time */}
                <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                        <span className={cn(
                            "text-sm font-semibold tabular-nums",
                            event.isPast ? "text-[var(--foreground-muted)]" : "text-[var(--foreground)]"
                        )}>
                            {event.time}
                        </span>
                    </div>
                </td>

                {/* Flag + Currency */}
                <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                        <CurrencyFlag currency={event.currency} size={22} />
                        <span className="text-xs font-bold text-[var(--foreground)] tracking-wide">
                            {event.currency}
                        </span>
                    </div>
                </td>

                {/* Impact Badge */}
                <td className="py-3 px-3">
                    <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                        impact.bg, impact.text
                    )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", impact.dot)} />
                        {impact.label}
                    </span>
                </td>

                {/* Event Name */}
                <td className="py-3 px-3">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--foreground)]">
                                {event.event}
                            </span>
                            {event.affectsGold && (
                                <span className="px-1 py-0.5 text-[8px] font-bold bg-amber-500/20 text-amber-400 rounded shrink-0">
                                    🪙 XAU
                                </span>
                            )}
                            {isNextUp && (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-green-500/20 text-green-400 rounded uppercase shrink-0">
                                    Next Up
                                </span>
                            )}
                        </div>
                        {period && (
                            <span className="text-[11px] text-[var(--foreground-muted)]">{period}</span>
                        )}
                    </div>
                </td>

                {/* Actual */}
                <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider">Actual</span>
                        <div className="flex items-center gap-1">
                            <span className={cn(
                                "text-sm font-semibold tabular-nums",
                                event.actual
                                    ? event.isUpcoming || isNextUp ? "text-green-400" : "text-[var(--foreground)]"
                                    : "text-[var(--foreground-muted)]"
                            )}>
                                {event.actual || '–'}
                            </span>
                            <ValueComparison actual={event.actual} forecast={event.forecast} />
                        </div>
                    </div>
                </td>

                {/* Forecast */}
                <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider">Forecast</span>
                        <span className="text-sm tabular-nums text-[var(--foreground-muted)]">
                            {event.forecast || '–'}
                        </span>
                    </div>
                </td>

                {/* Previous */}
                <td className="py-3 px-3 text-right">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-[var(--foreground-muted)] uppercase tracking-wider">Previous</span>
                        <span className="text-sm tabular-nums text-[var(--foreground-muted)]">
                            {event.previous || '–'}
                        </span>
                    </div>
                </td>

                {/* Expand */}
                <td className="py-3 px-2 text-right">
                    <ChevronDown className={cn(
                        "w-4 h-4 text-[var(--foreground-muted)] transition-transform",
                        expanded && "rotate-180"
                    )} />
                </td>
            </tr>

            {/* Expanded detail row */}
            {expanded && (
                <tr className="bg-[var(--background-secondary)]">
                    <td colSpan={8} className="py-4 px-4">
                        <div className="flex items-center gap-6 text-xs text-[var(--foreground-muted)] mb-4 pb-4 border-b border-[var(--border)]">
                            {event.isUpcoming && (
                                <span className="text-green-400 font-medium bg-green-500/10 px-2 py-1 rounded">⏱ In {formatCountdown(msUntil)}</span>
                            )}
                            {event.isPast && event.actual && (
                                <span className="bg-[var(--background)] px-2 py-1 rounded">Released {formatTimeAgo(msUntil)}</span>
                            )}
                            <span className="bg-[var(--background)] px-2 py-1 rounded">Country: {event.country}</span>
                            {event.unit && <span className="bg-[var(--background)] px-2 py-1 rounded">Unit: {event.unit}</span>}
                        </div>

                        <AIEventAnalysis event={event} />
                    </td>
                </tr>
            )}
        </>
    )
}

/* ─── Date Group Header ─── */
function DateGroup({ date, events, now, nextHighId }: {
    date: string; events: EnhancedCalendarEvent[]; now: Date; nextHighId: string | null
}) {
    const today = toLocalDateStr(new Date())
    const tomorrow = toLocalDateStr(new Date(Date.now() + 86400000))
    const isToday = date === today
    const isTomorrow = date === tomorrow
    const dateObj = new Date(date + 'T00:00:00')
    const isPastDate = date < today

    const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dateObj.toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric'
    })

    return (
        <>
            <tr className={cn("bg-[var(--background-secondary)]", isPastDate && "opacity-60")}>
                <td colSpan={8} className="py-2.5 px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-sm font-bold",
                                isToday ? "text-blue-400" : "text-[var(--foreground)]"
                            )}>
                                {dayLabel}
                            </span>
                            {isToday && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-600 text-white rounded">
                                    Today
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] text-[var(--foreground-muted)]">
                            {events.length} event{events.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </td>
            </tr>
            {events.map(event => (
                <EventRow
                    key={event.id}
                    event={event}
                    now={now}
                    isNextUp={event.id === nextHighId}
                />
            ))}
        </>
    )
}

/* ─── Main Component ─── */
export function EconomicCalendar() {
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [weekOffset, setWeekOffset] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [now, setNow] = useState(new Date())
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCurrencies, setSelectedCurrencies] = useState<Set<string>>(
        new Set(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'])
    )
    const [selectedImpacts, setSelectedImpacts] = useState<Set<string>>(
        new Set(['high', 'medium', 'low'])
    )
    const [activeTimeFilter, setActiveTimeFilter] = useState<string>('upcoming')
    const [selectedDay, setSelectedDay] = useState<string | null>(null)
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)

    const today = new Date()
    const currentWeek = new Date(today)
    currentWeek.setDate(today.getDate() + (weekOffset * 7))
    const { from, to } = getWeekDates(currentWeek)

    // Live clock
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(interval)
    }, [])

    const fetchCalendar = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setIsRefreshing(true)
        else setLoading(true)
        try {
            const res = await fetch(`/api/calendar?from=${from}&to=${to}`, { cache: 'no-store' })
            const data = await res.json()
            setEvents(data.events || [])
        } catch (error) {
            console.error('Failed to fetch calendar:', error)
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [from, to])

    useEffect(() => { fetchCalendar() }, [fetchCalendar])

    const toggleCurrency = (currency: string) => {
        setSelectedCurrencies(prev => {
            const next = new Set(prev)
            next.has(currency) ? next.delete(currency) : next.add(currency)
            return next
        })
    }

    const toggleImpact = (impact: string) => {
        setSelectedImpacts(prev => {
            const next = new Set(prev)
            next.has(impact) ? next.delete(impact) : next.add(impact)
            return next
        })
    }

    // Enhance events
    const enhancedEvents: EnhancedCalendarEvent[] = useMemo(() => {
        return events.map(event => {
            const eventDateTime = parseEventDateTime(event)
            const isPast = eventDateTime < now
            const msUntil = eventDateTime.getTime() - now.getTime()
            const isUpcoming = msUntil > 0 && msUntil <= 60 * 60 * 1000
            return { ...event, eventDateTime, isPast, isUpcoming, affectsGold: isGoldMovingEvent(event) }
        })
    }, [events, now])

    // Time filter
    const todayStr = toLocalDateStr(new Date())
    const tomorrowStr = toLocalDateStr(new Date(Date.now() + 86400000))

    const timeFiltered = enhancedEvents.filter(e => {
        // If a specific day is selected from the day picker, filter to that day
        if (selectedDay) return e.date === selectedDay

        switch (activeTimeFilter) {
            case 'upcoming': return !e.isPast
            case 'today': return e.date === todayStr
            case 'tomorrow': return e.date === tomorrowStr
            case 'this-week': return true
            case 'all': return true
            default: return true
        }
    })

    // Currency + impact + search filters
    const filteredEvents = timeFiltered.filter(e => {
        if (!selectedImpacts.has(e.impact)) return false
        if (!selectedCurrencies.has(e.currency)) return false
        if (searchQuery && !e.event.toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
    })

    // Next upcoming high-impact event
    const nextHighImpact = enhancedEvents
        .filter(e => e.impact === 'high' && !e.isPast)
        .sort((a, b) => a.eventDateTime.getTime() - b.eventDateTime.getTime())[0]

    // Group by date
    const grouped = filteredEvents.reduce((acc, event) => {
        if (!acc[event.date]) acc[event.date] = []
        acc[event.date].push(event)
        return acc
    }, {} as Record<string, EnhancedCalendarEvent[]>)
    const sortedDates = Object.keys(grouped).sort()

    // Week day picker
    const weekDays = useMemo(() => {
        const parts = from.split('-').map(Number)
        const startDate = new Date(parts[0], parts[1] - 1, parts[2])
        const days: { date: Date; dateStr: string }[] = []
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate)
            d.setDate(startDate.getDate() + i)
            days.push({ date: d, dateStr: toLocalDateStr(d) })
        }
        return days
    }, [from])

    const allCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'CNY']

    // Timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const tzOffset = `GMT${now.getTimezoneOffset() <= 0 ? '+' : '-'}${String(Math.floor(Math.abs(now.getTimezoneOffset()) / 60)).padStart(2, '0')}:${String(Math.abs(now.getTimezoneOffset()) % 60).padStart(2, '0')}`

    const timeFilterTabs = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'today', label: 'Today' },
        { id: 'tomorrow', label: 'Tomorrow' },
        { id: 'this-week', label: 'This Week' },
        { id: 'all', label: 'All' },
    ]

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {/* ── Header ── */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-start justify-between mb-1">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--foreground)]">Economic Calendar</h2>
                        <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                            Track high-impact economic events and news that move the markets
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
                            <Clock className="w-3.5 h-3.5" />
                            {tzOffset}
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/15 text-green-400 text-[10px] font-bold uppercase rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Live
                        </span>
                        <span className="text-[11px] text-[var(--foreground-muted)]">
                            Updated {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="px-6 pb-4 border-b border-[var(--border)]">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Time filter tabs */}
                    <div className="flex gap-0.5 bg-[var(--background-tertiary)] p-0.5 rounded-lg">
                        {timeFilterTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTimeFilter(tab.id)
                                    setSelectedDay(null)
                                }}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                    activeTimeFilter === tab.id
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Day picker */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setWeekOffset(p => p - 1)}
                            className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] transition-colors"
                            title="Previous week"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {weekDays.map(({ date: d, dateStr }, i) => {
                            const isToday = dateStr === todayStr
                            const isSelected = selectedDay === dateStr
                            const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
                            return (
                                <div
                                    key={i}
                                    onClick={() => {
                                        setSelectedDay(prev => prev === dateStr ? null : dateStr)
                                        setActiveTimeFilter('this-week')
                                    }}
                                    className={cn(
                                        "flex flex-col items-center px-2 py-1 rounded-lg text-center cursor-pointer transition-all min-w-[40px]",
                                        isSelected
                                            ? "bg-blue-600 text-white"
                                            : isToday
                                                ? "ring-1 ring-blue-500 text-blue-400"
                                                : "text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
                                    )}
                                >
                                    <span className="text-[9px] font-bold uppercase">{dayNames[d.getDay()]}</span>
                                    <span className="text-sm font-bold">{d.getDate()}</span>
                                </div>
                            )
                        })}
                        <button
                            onClick={() => setWeekOffset(p => p + 1)}
                            className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] transition-colors"
                            title="Next week"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Impact dots */}
                    <div className="flex items-center gap-2 ml-auto">
                        {(['high', 'medium', 'low'] as const).map(imp => {
                            const cfg = impactConfig[imp]
                            const active = selectedImpacts.has(imp)
                            return (
                                <button
                                    key={imp}
                                    onClick={() => toggleImpact(imp)}
                                    className={cn(
                                        "flex items-center gap-1.5 text-xs font-medium transition-opacity",
                                        active ? "opacity-100" : "opacity-30"
                                    )}
                                >
                                    <span className={cn("w-3 h-3 rounded-full", cfg.dot)} />
                                    {imp.charAt(0).toUpperCase() + imp.slice(1)}
                                </button>
                            )
                        })}
                    </div>

                    {/* Country dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--background-tertiary)] rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                        >
                            All Countries
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {countryDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 z-50 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-xl p-2 min-w-[160px]">
                                {allCurrencies.map(cur => (
                                    <button
                                        key={cur}
                                        onClick={() => toggleCurrency(cur)}
                                        className={cn(
                                            "flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md transition-colors",
                                            selectedCurrencies.has(cur)
                                                ? "bg-blue-600/10 text-blue-400"
                                                : "text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
                                        )}
                                    >
                                        <CurrencyFlag currency={cur} size={16} />
                                        <span className="font-medium">{cur}</span>
                                        {selectedCurrencies.has(cur) && (
                                            <span className="ml-auto text-blue-400">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Search + count */}
                <div className="flex items-center justify-between mt-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--foreground-muted)]" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs bg-[var(--background-tertiary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/50 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[var(--foreground-muted)]">
                            {filteredEvents.length} events of {enhancedEvents.length}
                        </span>
                        <button
                            onClick={() => fetchCalendar(true)}
                            disabled={isRefreshing}
                            className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <tbody>
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={8} className="py-4 px-4">
                                        <div className="h-4 bg-[var(--background-tertiary)] rounded w-full" />
                                    </td>
                                </tr>
                            ))
                        ) : sortedDates.length > 0 ? (
                            sortedDates.map(date => (
                                <DateGroup
                                    key={date}
                                    date={date}
                                    events={grouped[date]}
                                    now={now}
                                    nextHighId={nextHighImpact?.id || null}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="py-16 text-center text-[var(--foreground-muted)]">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No economic events found</p>
                                    <p className="text-xs mt-1 opacity-60">Try adjusting your filters or time range</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
