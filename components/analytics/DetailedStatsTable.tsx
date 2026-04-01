'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

interface DetailedStatsTableProps {
  data: any // The full analyticsData object
}

export function DetailedStatsTable({ data }: DetailedStatsTableProps) {
  // --- Formatters ---
  const formatCurrency = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '$0.00'
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (isNaN(num)) return '$0.00'
    const formatted = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return num < 0 ? `-$${formatted}` : `$${formatted}`
  }

  const formatNumber = (val: string | number | undefined | null, decimals = 2) => {
    if (val === undefined || val === null) return '0'
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (isNaN(num)) return '0'
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).replace(/\.00$/, '')
  }

  const formatPercent = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '0%'
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (isNaN(num)) return '0%'
    return `${num.toFixed(1)}%`
  }

  const formatDuration = (seconds: number | undefined | null) => {
    if (seconds === undefined || seconds === null || isNaN(seconds) || seconds <= 0) return '-'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  // --- Calculations ---
  const stats = useMemo(() => {
    const trades = data?.trades || []
    const dailyPnL = data?.dailyPnL || []
    const monthlyStats = data?.monthlyStats || []

    // 1. Monthly Summary
    let bestMonth = { value: 0, label: '-' }
    let worstMonth = { value: 0, label: '-' }
    let totalMonthlyProfit = 0
    let monthlyCount = monthlyStats.length

    monthlyStats.forEach((m: any) => {
      const val = parseFloat(m.profit || 0)
      totalMonthlyProfit += val
      if (val > bestMonth.value || bestMonth.label === '-') {
        bestMonth = { value: val, label: format(parseISO(m.month + '-01'), 'MMM yyyy') }
      }
      if (val < worstMonth.value || worstMonth.label === '-') {
        worstMonth = { value: val, label: format(parseISO(m.month + '-01'), 'MMM yyyy') }
      }
    })
    const avgMonth = monthlyCount > 0 ? totalMonthlyProfit / monthlyCount : 0

    // 2. Trading Day Stats
    const totalTradingDays = dailyPnL.length
    const winningDays = dailyPnL.filter((d: any) => parseFloat(d.pnl || 0) > 0).length
    const losingDays = dailyPnL.filter((d: any) => parseFloat(d.pnl || 0) < 0).length
    const breakevenDays = totalTradingDays - winningDays - losingDays

    // 3. Consecutive Day Streaks
    let maxWinDayStreak = 0
    let maxLossDayStreak = 0
    let currentWinDayStreak = 0
    let currentLossDayStreak = 0

    dailyPnL.forEach((d: any) => {
      const pnl = parseFloat(d.pnl || 0)
      if (pnl > 0) {
        currentWinDayStreak++
        currentLossDayStreak = 0
        if (currentWinDayStreak > maxWinDayStreak) maxWinDayStreak = currentWinDayStreak
      } else if (pnl < 0) {
        currentLossDayStreak++
        currentWinDayStreak = 0
        if (currentLossDayStreak > maxLossDayStreak) maxLossDayStreak = currentLossDayStreak
      } else {
        currentWinDayStreak = 0
        currentLossDayStreak = 0
      }
    })

    // 4. Daily P&L Averages
    const avgDailyPnl = totalTradingDays > 0 ? parseFloat(data?.totalNetPnl || 0) / totalTradingDays : 0
    const winningDayPnLs = dailyPnL.filter((d: any) => parseFloat(d.pnl || 0) > 0)
    const avgWinningDayPnl = winningDayPnLs.length > 0 ? winningDayPnLs.reduce((acc: number, d: any) => acc + parseFloat(d.pnl || 0), 0) / winningDayPnLs.length : 0
    const losingDayPnLs = dailyPnL.filter((d: any) => parseFloat(d.pnl || 0) < 0)
    const avgLosingDayPnl = losingDayPnLs.length > 0 ? losingDayPnLs.reduce((acc: number, d: any) => acc + parseFloat(d.pnl || 0), 0) / losingDayPnLs.length : 0
    
    const largestProfitDay = dailyPnL.length > 0 ? Math.max(...dailyPnL.map((d: any) => parseFloat(d.pnl || 0))) : 0
    const largestLossDay = dailyPnL.length > 0 ? Math.min(...dailyPnL.map((d: any) => parseFloat(d.pnl || 0))) : 0

    // 5. Hold Time
    const calculateHoldTime = (tradeList: any[]) => {
      if (tradeList.length === 0) return 0
      const total = tradeList.reduce((acc, t) => {
        const exit = typeof t.exitDate === 'number' ? (t.exitDate < 10000000000 ? t.exitDate : t.exitDate / 1000) : new Date(t.exitDate).getTime() / 1000
        const entry = typeof t.entryDate === 'number' ? (t.entryDate < 10000000000 ? t.entryDate : t.entryDate / 1000) : new Date(t.entryDate).getTime() / 1000
        return acc + Math.max(0, exit - entry)
      }, 0)
      return total / tradeList.length
    }

    const holdTimeAll = calculateHoldTime(trades)
    const holdTimeWinners = calculateHoldTime(trades.filter((t: any) => (t.netPnl || 0) > 0))
    const holdTimeLosers = calculateHoldTime(trades.filter((t: any) => (t.netPnl || 0) < 0))

    // 6. Drawdown (Approximation from Daily P&L if full equity curve isn't processed)
    let peak = 0
    let currentEquity = 0
    let maxDD = 0
    dailyPnL.forEach((d: any) => {
      currentEquity += parseFloat(d.pnl || 0)
      if (currentEquity > peak) peak = currentEquity
      const dd = peak - currentEquity
      if (dd > maxDD) maxDD = dd
    })
    const maxDDPercent = peak > 0 ? (maxDD / peak) * 100 : 0

    return {
      monthly: { bestMonth, worstMonth, avgMonth },
      extended: {
        totalTradingDays,
        winningDays,
        losingDays,
        breakevenDays,
        maxWinDayStreak,
        maxLossDayStreak,
        avgDailyPnl,
        avgWinningDayPnl,
        avgLosingDayPnl,
        largestProfitDay,
        largestLossDay,
        holdTimeAll,
        holdTimeWinners,
        holdTimeLosers,
        maxDD,
        maxDDPercent
      },
      breakEvenTrades: trades.filter((t: any) => (t.netPnl || 0) === 0).length
    }
  }, [data])

  const statsLeft = [
    { label: 'Total P&L', value: formatCurrency(data?.totalNetPnl), color: (parseFloat(data?.totalNetPnl || '0') >= 0 ? 'text-profit' : 'text-loss') },
    { label: 'Average daily volume', value: formatNumber(stats.extended.totalTradingDays > 0 ? (data?.totalTrades || 0) / stats.extended.totalTradingDays : 0, 2), color: 'text-white' },
    { label: 'Average winning trade', value: formatCurrency(data?.avgWinner), color: 'text-profit' },
    { label: 'Average losing trade', value: formatCurrency(Math.abs(parseFloat(data?.avgLoser || 0))), color: 'text-loss' },
    { label: 'Total number of trades', value: formatNumber(data?.totalTrades, 0), color: 'text-white' },
    { label: 'Number of winning trades', value: formatNumber(data?.winningTrades, 0), color: 'text-profit' },
    { label: 'Number of losing trades', value: formatNumber(data?.losingTrades, 0), color: 'text-loss' },
    { label: 'Number of break even trades', value: formatNumber(stats.breakEvenTrades, 0), color: 'text-white' },
    { label: 'Max consecutive wins', value: formatNumber(data?.winStreak, 0), color: 'text-profit' },
    { label: 'Max consecutive losses', value: formatNumber(data?.lossStreak, 0), color: 'text-loss' },
    { label: 'Total commissions', value: formatCurrency(data?.totalCommission || 0), color: 'text-white' },
    { label: 'Total swap', value: formatCurrency(data?.totalSwap || 0), color: 'text-white' },
    { label: 'Largest profit', value: formatCurrency(data?.bestTrade), color: 'text-profit' },
    { label: 'Largest loss', value: formatCurrency(Math.abs(parseFloat(data?.worstTrade || 0))), color: 'text-loss' },
    { label: 'Avg hold time (All)', value: formatDuration(stats.extended.holdTimeAll), color: 'text-white' },
    { label: 'Avg hold time (Winners)', value: formatDuration(stats.extended.holdTimeWinners), color: 'text-white' },
    { label: 'Avg hold time (Losers)', value: formatDuration(stats.extended.holdTimeLosers), color: 'text-white' },
  ]

  const statsRight = [
    { label: 'Open trades', value: formatNumber(data?.openTrades, 0), color: 'text-white' },
    { label: 'Total trading days', value: formatNumber(stats.extended.totalTradingDays, 0), color: 'text-white' },
    { label: 'Winning days', value: formatNumber(stats.extended.winningDays, 0), color: 'text-profit' },
    { label: 'Losing days', value: formatNumber(stats.extended.losingDays, 0), color: 'text-loss' },
    { label: 'Breakeven days', value: formatNumber(stats.extended.breakevenDays, 0), color: 'text-white' },
    { label: 'Max consecutive winning days', value: formatNumber(stats.extended.maxWinDayStreak, 0), color: 'text-profit' },
    { label: 'Max consecutive losing days', value: formatNumber(stats.extended.maxLossDayStreak, 0), color: 'text-loss' },
    { label: 'Average daily P&L', value: formatCurrency(stats.extended.avgDailyPnl), color: stats.extended.avgDailyPnl >= 0 ? 'text-profit' : 'text-loss' },
    { label: 'Average winning day P&L', value: formatCurrency(stats.extended.avgWinningDayPnl), color: 'text-profit' },
    { label: 'Average losing day P&L', value: formatCurrency(Math.abs(stats.extended.avgLosingDayPnl)), color: 'text-loss' },
    { label: 'Largest profitable day', value: formatCurrency(stats.extended.largestProfitDay), color: 'text-profit' },
    { label: 'Largest losing day', value: formatCurrency(Math.abs(stats.extended.largestLossDay)), color: 'text-loss' },
    { label: 'Trade expectancy', value: formatCurrency(data?.expectancy), color: parseFloat(data?.expectancy || '0') >= 0 ? 'text-profit' : 'text-loss' },
    { label: 'Max drawdown', value: formatCurrency(stats.extended.maxDD), color: 'text-loss' },
    { label: 'Max drawdown %', value: formatPercent(stats.extended.maxDDPercent), color: 'text-loss' },
  ]

  return (
    <div className="space-y-12">
      {/* 3 cards top row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Best Month */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-profit/30 transition-all duration-300">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Best Month</p>
          <p className="text-2xl font-black text-profit font-jakarta tracking-tight">
            {formatCurrency(stats.monthly.bestMonth.value)}
          </p>
          <p className="text-[10px] font-bold text-white/20 mt-1 uppercase tracking-widest">{stats.monthly.bestMonth.label}</p>
        </div>

        {/* Worst Month */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-loss/30 transition-all duration-300">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Worst Month</p>
          <p className={cn(
            "text-2xl font-black font-jakarta tracking-tight",
            stats.monthly.worstMonth.value >= 0 ? "text-profit" : "text-loss"
          )}>
            {formatCurrency(stats.monthly.worstMonth.value)}
          </p>
          <p className="text-[10px] font-bold text-white/20 mt-1 uppercase tracking-widest">{stats.monthly.worstMonth.label}</p>
        </div>

        {/* Average */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Average</p>
          <p className={cn(
            "text-2xl font-black font-jakarta tracking-tight",
            stats.monthly.avgMonth >= 0 ? "text-profit" : "text-loss"
          )}>
            {formatCurrency(stats.monthly.avgMonth)}
          </p>
          <p className="text-[10px] font-bold text-white/20 mt-1 uppercase tracking-widest">per Month</p>
        </div>
      </div>

      {/* Stats Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-1">
        {/* Left Column */}
        <div className="flex flex-col">
          {statsLeft.map((stat, i) => (
            <div key={i} className="flex justify-between items-center py-3.5 border-b border-white/5 group hover:bg-white/[0.01] transition-colors px-1">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{stat.label}</span>
              <span className={cn("text-sm font-black font-jakarta tracking-tight", stat.color)}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="flex flex-col">
          {statsRight.map((stat, i) => (
            <div key={i} className="flex justify-between items-center py-3.5 border-b border-white/5 group hover:bg-white/[0.01] transition-colors px-1">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{stat.label}</span>
              <span className={cn("text-sm font-black font-jakarta tracking-tight", stat.color)}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
