'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, FileText, Activity } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { AnalysisStats } from '@/components/analytics/AnalysisStats'
import { DayOfWeekChart } from '@/components/analytics/DayOfWeekChart'
import { LongShortStats } from '@/components/analytics/LongShortStats'
import { EquityCurve } from '@/components/analytics/EquityCurve'
import { DetailedStatsTable } from '@/components/analytics/DetailedStatsTable'
import { YourStats } from '@/components/analytics/YourStats'
import { SessionPerformance } from '@/components/analytics/SessionPerformance'
import { TopSymbols } from '@/components/analytics/TopSymbols'
import { TradeSimulation } from '@/components/analytics/TradeSimulation'
import { api, Trade } from '@/lib/apiClient'

const timePeriods = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '3 Months', value: '3m' },
  { label: '1 Year', value: '1y' },
  { label: 'All Time', value: 'all' },
]

const tradeFilters = [
  { label: 'All Trades', value: 'all' },
  { label: 'Winners', value: 'winners' },
  { label: 'Losers', value: 'losers' },
]

export default function PerformancePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [timePeriod, setTimePeriod] = useState('30d')
  const [tradeFilter, setTradeFilter] = useState('all')

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', 'performance', timePeriod, tradeFilter],
    queryFn: () => api.analytics.dashboard({ period: timePeriod, filter: tradeFilter }),
  })

  // Memoized derived stats
  const trades = useMemo(() => analyticsData?.trades || [], [analyticsData])
  
  const monthlyStatsAggregated = useMemo(() => {
    if (!analyticsData?.monthlyStats || analyticsData.monthlyStats.length === 0) {
      return {
        bestMonth: { value: 0, label: '-' },
        worstMonth: { value: 0, label: '-' },
        averagePerMonth: 0
      }
    }
    
    const sorted = [...analyticsData.monthlyStats].sort((a, b) => b.profit - a.profit)
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]
    const avg = analyticsData.monthlyStats.reduce((acc, m) => acc + m.profit, 0) / analyticsData.monthlyStats.length
    
    return {
      bestMonth: { value: best.profit, label: format(parseISO(`${best.month}-01`), 'MMM yyyy') },
      worstMonth: { value: worst.profit, label: format(parseISO(`${worst.month}-01`), 'MMM yyyy') },
      averagePerMonth: avg
    }
  }, [analyticsData])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = getDay(monthStart)
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const getDayData = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return analyticsData?.dailyPnL?.find((d: any) => d.date === dateKey)
  }

  const selectedDayTrades = useMemo(() => {
    if (!selectedDate) return []
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
    return trades.filter((t: Trade) => {
      const tradeDateStr = t.exitDate ? format(new Date(t.exitDate), 'yyyy-MM-dd') : null
      return tradeDateStr === selectedDateStr
    })
  }, [selectedDate, trades])

  const formatCurrency = (value: number | string | undefined | null) => {
    if (value === undefined || value === null) return '$0.00'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num as number)) return '$0.00'
    return `$${Math.abs(num as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return '0.0%'
    return `${value.toFixed(1)}%`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const winPercent = analyticsData?.winRate || 0
  const grossProfit = parseFloat(analyticsData?.grossProfit || '0')
  const grossLoss = Math.abs(parseFloat(analyticsData?.grossLoss || '0'))
  const netResult = parseFloat(analyticsData?.totalPnl || '0')
  const recentTrades = trades.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Performance Analytics</h1>
          </div>
          <p className="text-[var(--foreground-muted)]">Analyze your trading patterns and improve your strategy</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--foreground-muted)]">TIME PERIOD</span>
            <div className="flex bg-[var(--input-bg)] rounded-lg p-1">
              {timePeriods.map(p => (
                <button
                  key={p.value}
                  onClick={() => setTimePeriod(p.value)}
                  className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", timePeriod === p.value ? "bg-blue-600 text-white" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]")}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--foreground-muted)]">FILTER BY</span>
            <div className="flex bg-[var(--input-bg)] rounded-lg p-1">
              {tradeFilters.map(f => (
                <button
                  key={f.value}
                  onClick={() => setTradeFilter(f.value)}
                  className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1", tradeFilter === f.value ? "bg-blue-600 text-white" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]")}
                >
                  {f.value === 'winners' && <TrendingUp size={12} className="text-green-400" />}
                  {f.value === 'losers' && <TrendingDown size={12} className="text-red-400" />}
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
          <p className="text-xs text-[var(--foreground-muted)] mb-1">TOTAL P&L</p>
          <p className={cn("text-2xl font-bold", parseFloat(analyticsData?.totalPnl || '0') >= 0 ? "text-blue-400" : "text-red-400")}>
            {parseFloat(analyticsData?.totalPnl || '0') >= 0 ? '' : '-'}{formatCurrency(analyticsData?.totalPnl)}
          </p>
          <p className="text-xs text-[var(--foreground-muted)] mt-2">From {analyticsData?.totalTrades || 0} closed trades</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
          <p className="text-xs text-[var(--foreground-muted)] mb-1">WIN RATE</p>
          <p className="text-2xl font-bold text-blue-400">{formatPercent(analyticsData?.winRate)}</p>
          <p className="text-xs text-[var(--foreground-muted)] mt-2">{analyticsData?.winningTrades || 0} wins • {analyticsData?.losingTrades || 0} losses</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
          <p className="text-xs text-[var(--foreground-muted)] mb-1">PROFIT FACTOR</p>
          <p className="text-2xl font-bold text-blue-400">{analyticsData?.profitFactor === Infinity ? 'Infinity' : (analyticsData?.profitFactor || 0).toFixed(2)}</p>
          <p className="text-xs text-green-400 mt-2">✨ Excellent</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
          <p className="text-xs text-[var(--foreground-muted)] mb-1">EXPECTANCY</p>
          <p className={cn("text-2xl font-bold", (analyticsData?.expectancy || 0) >= 0 ? "text-blue-400" : "text-red-400")}>{formatCurrency(analyticsData?.expectancy)}</p>
          <p className="text-xs text-[var(--foreground-muted)] mt-2">Average per trade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {analyticsData && (
          <div className="lg:col-span-1">
            <AnalysisStats data={analyticsData as any} />
          </div>
        )}
        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-[var(--foreground)]">Equity Curve</h3>
          </div>
          <div className="h-[250px] w-full">
            {analyticsData?.equityCurve && analyticsData.equityCurve.length > 0 ? (
              <EquityCurve data={analyticsData.equityCurve} height={250} />
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-[var(--border)] rounded-lg">
                <FileText className="w-10 h-10 text-[var(--foreground-muted)] mx-auto mb-2" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trading Calendar & Day Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 text-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-[var(--foreground)]">Trading Calendar</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="px-2 py-1 bg-[var(--input-bg)] rounded text-xs">&lt;</button>
              <span className="font-medium text-xs font-mono">{format(currentMonth, 'MMMM yyyy')}</span>
              <button onClick={nextMonth} className="px-2 py-1 bg-[var(--input-bg)] rounded text-xs">&gt;</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] font-mono tracking-widest text-[var(--foreground-muted)] mb-2">
            <div className="text-center">MON</div><div className="text-center">TUE</div><div className="text-center">WED</div>
            <div className="text-center">THU</div><div className="text-center">FRI</div><div className="text-center">SAT</div><div className="text-center">SUN</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[...Array(adjustedStartDay)].map((_, i) => <div key={`empty-${i}`} className="aspect-square bg-[var(--input-bg)]/30 rounded" />)}
            {days.map(day => {
              const data = getDayData(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const pnlValue = data?.pnl ? (typeof data.pnl === 'string' ? parseFloat(data.pnl) : data.pnl) : 0
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn("aspect-square bg-[var(--input-bg)] rounded flex flex-col items-center justify-center transition hover:ring-1 ring-blue-500",
                    isSelected && "ring-2", pnlValue > 0 && "bg-blue-500/10", pnlValue < 0 && "bg-red-500/10")}
                >
                  <span className="text-[10px] font-mono mb-1">{format(day, 'd')}</span>
                  {data && <span className={cn("text-[8px] font-bold font-mono", pnlValue > 0 ? "text-blue-400" : "text-red-400")}>${Math.abs(pnlValue).toFixed(0)}</span>}
                  {data && <span className="text-[8px] opacity-70">{data.trades} trades</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 flex flex-col pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-[var(--foreground)]">Trades on {selectedDate ? format(selectedDate, 'MMM d') : '-'}</h3>
            </div>
            {selectedDate && <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-[var(--background)] rounded-md text-[var(--foreground-muted)]"><span className="text-xs">✕</span></button>}
          </div>

          {selectedDayTrades.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4 text-center">
                <div>
                  <p className="text-[10px] text-[var(--foreground-muted)] mb-1 uppercase tracking-widest">Total P&L</p>
                  <p className={cn("font-bold text-sm",
                    selectedDayTrades.reduce((acc, t) => acc + (t.netPnl || 0), 0) >= 0 ? 'text-blue-400' : 'text-red-400'
                  )}>
                    {selectedDayTrades.reduce((acc, t) => acc + (t.netPnl || 0), 0) >= 0 ? '' : '-'}
                    {formatCurrency(selectedDayTrades.reduce((acc, t) => acc + (t.netPnl || 0), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--foreground-muted)] mb-1 uppercase tracking-widest">Trades</p>
                  <p className="font-bold text-sm text-[var(--foreground)]">{selectedDayTrades.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--foreground-muted)] mb-1 uppercase tracking-widest">Win Rate</p>
                  <p className="font-bold text-sm text-[var(--foreground)]">
                    {Math.round((selectedDayTrades.filter(t => (t.netPnl || 0) > 0).length / selectedDayTrades.length) * 100)}%
                  </p>
                </div>
              </div>

              {/* Trade List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {selectedDayTrades.map((t) => {
                  const pnlVal = t.netPnl || 0
                  const isWin = pnlVal >= 0
                  return (
                    <div key={t.id} className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl p-4 flex justify-between items-center transition-all hover:border-[var(--border-hover)]">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isWin ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500")}>
                          {isWin ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                        <div>
                          <p className="font-bold font-mono text-sm leading-none mb-1">{t.symbol}</p>
                          <p className="text-[10px] text-[var(--foreground-muted)]">
                            {t.quantity ? `${t.quantity} @ ` : ''}
                            {t.entryPrice ? t.entryPrice : 'Market'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn("font-bold text-sm block", isWin ? 'text-blue-400' : 'text-red-400')}>
                          {isWin ? '' : '-'}{formatCurrency(pnlVal)}
                        </span>
                        {t.status && <span className="text-[10px] text-[var(--foreground-muted)] uppercase">{t.status}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--foreground-muted)] py-12 border border-dashed border-[var(--border)] rounded-xl bg-[var(--background-secondary)]/50">
              <Calendar className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-sm font-medium">No trades on this day.</p>
              <p className="text-[10px] mt-1 opacity-70">Select a highlighted day on the calendar</p>
            </div>
          )}
        </div>
      </div>

      {/* Win/Loss & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--foreground-muted)]" /> Win/Loss Distribution
          </h3>
          <div className="h-10 bg-[var(--input-bg)] rounded-lg flex overflow-hidden mb-6">
            <div className="bg-blue-600 flex items-center justify-center text-xs font-bold font-mono" style={{ width: `${winPercent}%` }}>
              {winPercent > 10 && `${analyticsData?.winningTrades || 0}W`}
            </div>
            <div className="bg-red-500 flex items-center justify-center text-xs font-bold font-mono" style={{ width: `${100 - winPercent}%` }}>
              {(100 - winPercent) > 10 && `${analyticsData?.losingTrades || 0}L`}
            </div>
          </div>
          <div className="space-y-4 text-xs font-mono">
            <div className="flex justify-between">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Gross Profit</span>
              <span className="text-blue-400 font-bold">${grossProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> Gross Loss</span>
              <span className="text-red-400 font-bold">-${grossLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-[var(--border)]/30 border-dashed">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400" /> Net Result</span>
              <span className={cn("font-bold", netResult >= 0 ? 'text-blue-400' : 'text-red-400')}>{netResult >= 0 ? '' : '-'}${Math.abs(netResult).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--foreground-muted)]" /> Recent Trades
          </h3>
          <div className="space-y-2">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="bg-[var(--background-tertiary)] border border-[var(--border)] rounded-xl py-2 px-4 flex justify-between items-center">
                <div>
                  <p className="font-bold font-mono text-sm">{trade.symbol}</p>
                  <p className="text-[10px] text-[var(--foreground-muted)]">{trade.entryDate ? format(new Date(trade.entryDate), 'MMM d') : '-'}</p>
                </div>
                <span className={cn("font-bold text-sm", (trade.netPnl || 0) >= 0 ? 'text-blue-400' : 'text-red-400')}>
                  {(trade.netPnl || 0) >= 0 ? '' : '-'}{formatCurrency(trade.netPnl || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <YourStats monthlyStats={monthlyStatsAggregated} />

      {/* Long/Short, Day Chart, Top Symbols */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {analyticsData?.longShortPerformance && <LongShortStats data={analyticsData.longShortPerformance as any} />}
        {analyticsData?.dayOfWeekPerformance && <DayOfWeekChart data={analyticsData.dayOfWeekPerformance as any} />}
        <TopSymbols trades={trades as any[]} />
      </div>

      {/* Session */}
      {analyticsData?.sessionPerformance && (
        <SessionPerformance data={analyticsData.sessionPerformance as any} />
      )}

      {/* Trade Simulation */}
      {trades.length > 0 && (
        <div className="mt-8">
          <TradeSimulation trades={trades as any[]} />
        </div>
      )}

      {/* Detailed Stats */}
      {analyticsData && (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 mt-8 mb-12">
          <DetailedStatsTable data={analyticsData as any} />
        </div>
      )}

    </div>
  )
}
