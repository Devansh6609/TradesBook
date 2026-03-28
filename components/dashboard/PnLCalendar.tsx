'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { api } from '@/lib/apiClient'
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown } from 'lucide-react'

import { DailyPnLPoint } from '@/types'

interface TradeDetail {
    id: string
    symbol: string
    type: 'BUY' | 'SELL'
    entryPrice: string
    exitPrice: string
    quantity: string
    pnl: string
    netPnl: string
    entryDate: string
    exitDate: string
    status: string
}

export function PnLCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState<string | null>(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const { data, isLoading } = useQuery({
        queryKey: ['daily-pnl', year, month],
        queryFn: async () => {
            const dateFrom = new Date(year, month, 1).toISOString()
            const dateTo = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
            return api.analytics.dailyPnL({ dateFrom, dateTo })
        },
        placeholderData: keepPreviousData,
        refetchInterval: 30000, // 30 seconds
    })

    // Fetch trades for selected day
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
        if (data?.dailyPnL) {
            for (const d of data.dailyPnL as DailyPnLPoint[]) {
                const dateKey = d.date.split('T')[0]
                map[dateKey] = { pnl: parseFloat(d.pnl), trades: d.trades }
            }
        }
        return map
    }, [data])

    const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDay(null) }
    const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDay(null) }

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    const totalPnl = Object.values(pnlMap).reduce((s, v) => s + v.pnl, 0)

    // Build calendar grid
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    const getColor = (pnl: number) => {
        if (pnl > 0) return 'bg-green-500/25 text-green-400 border-green-500/30'
        if (pnl < 0) return 'bg-red-500/25 text-red-400 border-red-500/30'
        return ''
    }

    const handleDayClick = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const entry = pnlMap[dateStr]
        if (entry && entry.trades > 0) {
            setSelectedDay(prev => prev === dateStr ? null : dateStr)
        }
    }

    const selectedDateLabel = selectedDay
        ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
        : ''

    const trades = (dayTrades?.trades || []) as any[] // Use any temporarily to avoid deep type mapping for this display component

    return (
        <div className="h-full bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">P&L Calendar</h3>
                    <p className={`text-lg font-mono font-bold mt-0.5 ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} aria-label="Previous month" className="p-1 rounded-md hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-medium text-[var(--foreground)] min-w-[120px] text-center">{monthName}</span>
                    <button onClick={nextMonth} aria-label="Next month" className="p-1 rounded-md hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-bold text-[var(--foreground-muted)] uppercase py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5 flex-1">
                {isLoading ? (
                    Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="bg-[var(--background-secondary)] rounded-md animate-pulse h-9 w-full opacity-50" />
                    ))
                ) : (
                    cells.map((day, i) => {
                        if (day === null) return <div key={i} />
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const entry = pnlMap[dateStr]
                        const hasData = !!entry
                        const isToday = new Date().toISOString().startsWith(dateStr)
                        const isSelected = selectedDay === dateStr

                        return (
                            <div
                                key={i}
                                onClick={() => handleDayClick(day)}
                                className={`relative flex flex-col items-center justify-center rounded-md text-center min-h-[36px]
                  border transition-all
                  ${hasData ? `${getColor(entry.pnl)} cursor-pointer hover:scale-105` : 'border-transparent text-[var(--foreground-muted)]/50'}
                  ${isToday ? 'ring-1 ring-blue-500/50' : ''}
                  ${isSelected ? 'ring-2 ring-blue-400 scale-105' : ''}
                `}
                                title={hasData ? `${dateStr}: ${entry.pnl >= 0 ? '+' : ''}$${entry.pnl.toFixed(2)} (${entry.trades} trades)` : dateStr}
                            >
                                <span className="text-[10px] font-medium">{day}</span>
                                {hasData && (
                                    <span className="text-[7px] font-mono font-bold leading-none mt-0.5">
                                        {entry.pnl >= 0 ? '+' : ''}{entry.pnl.toFixed(0)}
                                    </span>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Trade details panel */}
            {selectedDay && (
                <div className="mt-3 border-t border-[var(--border)] pt-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[var(--foreground)]">{selectedDateLabel}</span>
                        <button
                            onClick={() => setSelectedDay(null)}
                            className="p-0.5 rounded hover:bg-[var(--background-secondary)] text-[var(--foreground-muted)] transition-colors"
                            title="Close details"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {tradesLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : trades.length === 0 ? (
                        <p className="text-[11px] text-[var(--foreground-muted)] text-center py-3">No trades found for this day</p>
                    ) : (
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                            {trades.map((trade: TradeDetail) => {
                                const pnl = parseFloat(trade.netPnl || trade.pnl || '0')
                                const isProfit = pnl >= 0
                                return (
                                    <div
                                        key={trade.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {trade.type === 'BUY' ? (
                                                <TrendingUp size={12} className="text-green-400" />
                                            ) : (
                                                <TrendingDown size={12} className="text-red-400" />
                                            )}
                                            <div>
                                                <span className="text-[11px] font-bold text-[var(--foreground)]">{trade.symbol}</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[9px] text-[var(--foreground-muted)] font-mono">
                                                        {Number(trade.entryPrice).toFixed(2)} → {Number(trade.exitPrice || '0').toFixed(2)}
                                                    </span>
                                                    <span className="text-[9px] text-[var(--foreground-muted)]">
                                                        {Number(trade.quantity).toFixed(2)}L
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-mono font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                            {isProfit ? '+' : ''}${pnl.toFixed(2)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
