'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, FileText, Activity, X, LayoutGrid, Target, Zap, Clock } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { AnalysisStats } from '@/components/analytics/AnalysisStats'
import { DayOfWeekChart } from '@/components/analytics/DayOfWeekChart'
import { LongShortStats } from '@/components/analytics/LongShortStats'
import { EquityCurve } from '@/components/analytics/EquityCurve'
import { DetailedStatsTable } from '@/components/analytics/DetailedStatsTable'
import { SessionPerformance } from '@/components/analytics/SessionPerformance'
import { TopSymbols } from '@/components/analytics/TopSymbols'
import { CalendarHeatmap } from '@/components/analytics/CalendarHeatmap'
import { DailyTradesPanel } from '@/components/analytics/DailyTradesPanel'
import { api, Trade } from '@/lib/apiClient'

const timePeriods = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '3 Months', value: '3m' },
  { label: '1 Year', value: '1y' },
  { label: 'All Time', value: 'all' },
]

export default function PerformancePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [timePeriod, setTimePeriod] = useState('30d')
  const [filterType, setFilterType] = useState('all')

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', 'performance', timePeriod, filterType],
    queryFn: () => api.analytics.dashboard({ period: timePeriod, filter: filterType }),
  })

  const trades = useMemo(() => analyticsData?.trades || [], [analyticsData])

  const filteredTrades = useMemo(() => {
    if (filterType === 'all') return trades
    return trades.filter((t: Trade) => {
      const pnl = t.netPnl || 0
      return filterType === 'winners' ? pnl > 0 : pnl < 0
    })
  }, [trades, filterType])

  const transformedSessionPerformance = useMemo(() => {
    const defaultStats = { trades: 0, pnl: 0, winRate: 0, avgTrade: 0, volume: 0, volumePercent: 0 };
    const sessions = {
      asian: { ...defaultStats },
      london: { ...defaultStats },
      newYork: { ...defaultStats },
    };

    if (analyticsData?.sessionPerformance) {
      analyticsData.sessionPerformance.forEach((s: any) => {
        const sessionName = s.session.toLowerCase();
        let key: keyof typeof sessions | null = null;
        if (sessionName.includes('asian')) key = 'asian';
        else if (sessionName.includes('london')) key = 'london';
        else if (sessionName.includes('new york') || sessionName.includes('newyork')) key = 'newYork';

        if (key && sessions[key]) {
          sessions[key] = {
            ...sessions[key],
            trades: s.trades || 0,
            pnl: s.pnl || 0,
            winRate: s.winRate || 0,
            avgTrade: s.trades > 0 ? s.pnl / s.trades : 0,
            volumePercent: (s.trades / (analyticsData.totalTrades || 1)) * 100
          };
        }
      });
    }
    return sessions;
  }, [analyticsData]);

  const selectedDayTrades = useMemo(() => {
    if (!selectedDate) return []
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
    
    return trades.filter((t: Trade) => {
      if (!t.exitDate) return false;
      try {
        let tDate: Date;
        if (typeof t.exitDate === 'number') {
          // SQLite/D1 often returns Unix timestamps in seconds. 
          // If it's less than 10^12, it's likely seconds.
          const ts = t.exitDate < 10000000000 ? t.exitDate * 1000 : t.exitDate;
          tDate = new Date(ts);
        } else if (typeof t.exitDate === 'string') {
          // If it's a numeric string, handle it similarly
          if (/^\d+$/.test(t.exitDate)) {
            const num = parseInt(t.exitDate, 10);
            const ts = num < 10000000000 ? num * 1000 : num;
            tDate = new Date(ts);
          } else {
            tDate = new Date(t.exitDate);
          }
        } else {
          tDate = new Date(t.exitDate);
        }

        const tradeDateStr = format(tDate, 'yyyy-MM-dd');
        return tradeDateStr === selectedDateStr;
      } catch (e) {
        return false;
      }
    })
  }, [selectedDate, trades])

  const longShortData = useMemo(() => {
    if (analyticsData?.longShortPerformance) return analyticsData.longShortPerformance;
    
    const longTrades = trades.filter(t => ['BUY', 'LONG'].includes(String(t.type).toUpperCase()));
    const shortTrades = trades.filter(t => ['SELL', 'SHORT'].includes(String(t.type).toUpperCase()));

    return {
      long: {
        trades: longTrades.length,
        pnl: longTrades.reduce((acc, t) => acc + (t.netPnl || 0), 0),
        winRate: (longTrades.filter(t => (t.netPnl || 0) > 0).length / (longTrades.length || 1)) * 100
      },
      short: {
        trades: shortTrades.length,
        pnl: shortTrades.reduce((acc, t) => acc + (t.netPnl || 0), 0),
        winRate: (shortTrades.filter(t => (t.netPnl || 0) > 0).length / (shortTrades.length || 1)) * 100
      }
    }
  }, [analyticsData, trades])

  const dayOfWeekData = useMemo(() => {
    if (analyticsData?.dayOfWeekPerformance) return analyticsData.dayOfWeekPerformance;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const stats = days.map(day => ({ day, pnl: 0, trades: 0, winRate: 0 }));
    
    trades.forEach(t => {
      if (!t.exitDate || t.status !== 'CLOSED') return;
      try {
        const ts = Number(t.exitDate);
        const dateMs = ts < 10000000000 ? ts * 1000 : ts;
        const d = new Date(dateMs).getUTCDay();
        if (stats[d]) {
          stats[d].pnl += (t.netPnl || 0);
          stats[d].trades += 1;
        }
      } catch (e) {}
    });
    return stats;
  }, [analyticsData, trades])

  const formatCurrency = (value: number | string | undefined | null) => {
    if (value === undefined || value === null) return '$0.00'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num as number)) return '$0.00'
    return `$${Math.abs(num as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#060606]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </div>
    )
  }

  const kpis = [
    {
      label: 'TOTAL P&L',
      value: analyticsData?.totalPnl || 0,
      icon: <TrendingUp className="w-4 h-4" />,
      sub: `From ${analyticsData?.totalTrades || 0} closed trades`,
      footer: 'Your net profit/loss for the selected period',
      color: 'blue'
    },
    {
      label: 'WIN RATE',
      value: `${(analyticsData?.winRate || 0).toFixed(1)}%`,
      icon: <Target className="w-4 h-4" />,
      sub: `${analyticsData?.winningTrades || 0} wins • ${analyticsData?.losingTrades || 0} losses`,
      footer: 'Percentage of profitable trades',
      color: 'blue',
      showProgress: true
    },
    {
      label: 'PROFIT FACTOR',
      value: analyticsData?.profitFactor === Infinity ? 'Infinity' : (analyticsData?.profitFactor || 0).toFixed(2),
      icon: <Activity className="w-4 h-4" />,
      sub: (analyticsData?.profitFactor ?? 0) >= 1.5 ? 'Excellent' : 'Good',
      footer: 'Gross profit ÷ Gross loss (above 1.5 is good)',
      color: 'blue'
    },
    {
      label: 'EXPECTANCY',
      value: analyticsData?.expectancy || 0,
      icon: <Zap className="w-4 h-4" />,
      sub: 'Average per trade',
      footer: 'Expected profit per trade based on your stats',
      color: 'blue'
    }
  ]

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6 pb-20 space-y-10 font-inter">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-jakarta mb-1">Performance Analytics</h1>
          <p className="text-sm font-medium text-white/40 tracking-wide">Analyze your trading patterns and improve your strategy</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Time Period Filter */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Time Period</p>
            <div className="flex items-center gap-1 bg-[#111111]/50 border border-white/5 p-1 rounded-xl">
              {timePeriods.map(p => (
                <button
                  key={p.value}
                  onClick={() => setTimePeriod(p.value)}
                  className={cn(
                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                    timePeriod === p.value
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-white/30 hover:text-white"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter By Filter */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Filter By</p>
            <div className="flex items-center gap-1 bg-[#111111]/50 border border-white/5 p-1 rounded-xl">
              <button
                onClick={() => setFilterType('all')}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                  filterType === 'all' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-white/30 hover:text-white"
                )}
              >
                All Trades
              </button>
              <button
                onClick={() => setFilterType('winners')}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 flex items-center gap-1.5",
                  filterType === 'winners' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-white/30 hover:text-white"
                )}
              >
                <Target size={12} strokeWidth={3} className={filterType === 'winners' ? "text-white" : "text-white/20"} />
                Winners
              </button>
              <button
                onClick={() => setFilterType('losers')}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 flex items-center gap-1.5",
                  filterType === 'losers' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-white/30 hover:text-white"
                )}
              >
                <X size={12} strokeWidth={3} className={filterType === 'losers' ? "text-white" : "text-white/20"} />
                Losers
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((stat, i) => {
          const isCurrency = typeof stat.value === 'number' && (stat.label.includes('PROFIT') || stat.label.includes('P&L') || stat.label.includes('EXPECTANCY'))
          const val = isCurrency ? parseFloat(String(stat.value)) : 0

          return (
            <div
              key={i}
              className={cn(
                "group relative overflow-hidden bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 transition-all duration-500",
                i === 0 && "border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
              )}
            >
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center bg-white/5",
                      i === 0 && "bg-blue-500/10 text-blue-500",
                      i === 1 && "bg-blue-500/10 text-blue-500",
                      i === 2 && "bg-purple-500/10 text-purple-500",
                      i === 3 && "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {stat.icon}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{stat.label}</p>
                  </div>

                  <div>
                    <p className={cn(
                      "text-3xl font-black font-jakarta tracking-tight",
                      (i === 0 || i === 1 || i === 2 || i === 3) ? "text-blue-500" : "text-white"
                    )}>
                      {isCurrency ? formatCurrency(stat.value as number) : stat.value}
                    </p>
                    <p className="text-[11px] font-bold text-white/30 mt-1 uppercase tracking-wider">{stat.sub}</p>
                  </div>
                </div>

                {stat.label === 'WIN RATE' && (
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-1000"
                      style={{ width: stat.value }}
                    />
                  </div>
                )}

                <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">{stat.footer}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid: Quick Stats & Equity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 h-full">
          <AnalysisStats data={analyticsData as any} />
        </div>
        <div className="lg:col-span-8">
          <EquityCurve
            data={analyticsData?.equityCurve || []}
            height={450}
            trades={filteredTrades}
          />
        </div>
      </div>

      {/* NEW SECTION: Performance Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <LongShortStats data={longShortData} />
        <DayOfWeekChart data={dayOfWeekData} />
        <TopSymbols trades={trades as any} />
      </div>

      {/* Timeline & Session Performance */}
      <div className="space-y-8">
        <SessionPerformance data={transformedSessionPerformance} />
      </div>

      {/* Calendar & Trades Panel Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CalendarHeatmap 
            data={analyticsData?.dailyPnL || []} 
            trades={trades}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>
        <div className="lg:col-span-1 min-h-[500px]">
          {selectedDate ? (
            <DailyTradesPanel 
              date={selectedDate}
              trades={selectedDayTrades}
              onClose={() => setSelectedDate(null)}
            />
          ) : (
            <div className="h-full bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center opacity-30 group transition-all duration-500">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity size={32} strokeWidth={1} className="text-white/40" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Select Observation Point</p>
              <p className="text-[10px] font-bold mt-2 text-white/20 max-w-[200px]">Select a date from the calendar to view detailed trade analytics</p>
            </div>
          )}
        </div>
      </div>


      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 mb-20 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white font-jakarta tracking-tight">Technical Data Matrix</h3>
            <p className="text-xs text-white/30 uppercase font-black tracking-widest mt-1">Deep Statistical breakdown of your strategy</p>
          </div>
        </div>
        <DetailedStatsTable data={analyticsData as any} />
      </div>
    </div>
  )
}
