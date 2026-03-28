'use client'

import { useQuery } from '@tanstack/react-query'
import { DollarSign, Clock, CheckCircle, Target, Wallet } from 'lucide-react'
import { api } from '@/lib/apiClient'
import { StatCard } from '@/components/dashboard/StatCard'
import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import { PnLCalendar } from '@/components/dashboard/PnLCalendar'
import { OpenPositions } from '@/components/dashboard/OpenPositions'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { TopPerformers } from '@/components/dashboard/TopPerformers'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { NewsTicker } from '@/components/dashboard/NewsTicker'

interface AnalyticsData {
  totalPnL: string
  unrealizedPnL: string
  realizedPnL: string
  winRate: number
  totalTrades: number
  openTrades: number
  initialBalance: number
  accountBalance?: number
  equityCurve: Array<{ time: string; value: number; drawdown: number }>
  averageWin?: number
  averageLoss?: number
  bestTrade?: number
  worstTrade?: number
}

export default function DashboardPage() {
  // Fetch real-time live stats (Balance, Equity, Unrealized, Win Rate)
  const { data: liveData, isLoading: isLiveLoading } = useQuery({
    queryKey: ['analytics', 'live'],
    queryFn: () => api.analytics.live(),
    refetchInterval: 2000, // 2 second live update
  })

  // Format helpers
  const fmt = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '$0.00'
    const num = typeof val === 'string' ? parseFloat(val) : val
    const isNegative = num < 0
    return `${isNegative ? '-' : '+'}$${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const fmtPercent = (val: number | undefined) => {
    return val !== undefined ? `${val.toFixed(2)}%` : '0.00%'
  }

  const isSyncing = liveData?.isSyncing ?? false
  const currentBalance = liveData?.initialBalance ?? 0
  const unrealizedPnL = liveData?.unrealizedPnl ?? 0
  const equity = liveData?.equity ?? (currentBalance + unrealizedPnL)
  const totalPnl = liveData?.totalNetPnl ?? 0
  const winRate = liveData?.winRate ?? 0
  const openTrades = liveData?.openTrades ?? 0
  const totalTrades = liveData?.totalTrades ?? 0

  return (
    <div className="pb-12 space-y-6">
      {isSyncing && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center gap-3 animate-pulse">
          <Clock className="text-blue-400 animate-spin" size={18} />
          <p className="text-sm font-medium text-blue-200">
            Syncing live data from MetaTrader 5... Your stats will update automatically as trades are processed.
          </p>
        </div>
      )}

      {/* Top Row: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-up">
        <StatCard
          label="Current Balance"
          value={fmt(currentBalance)}
          subLabel="Fixed account value"
          icon={Wallet}
          theme="blue"
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Total P&L"
          value={fmt(totalPnl)}
          subLabel={`${totalTrades} trades`}
          icon={DollarSign}
          theme={totalPnl >= 0 ? 'green' : 'red'}
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Equity"
          value={fmt(equity)}
          subLabel="Live with floating P&L"
          icon={CheckCircle}
          theme="blue"
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Unrealized"
          value={fmt(unrealizedPnL)}
          subLabel={`${openTrades} open positions`}
          icon={Clock}
          theme={unrealizedPnL >= 0 ? 'green' : 'red'}
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Win Rate"
          value={fmtPercent(winRate)}
          icon={Target}
          theme="purple"
          loading={isLiveLoading && !liveData}
        />
      </div>
      {/* Middle Row: Chart & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up delay-100">
        <div className="lg:col-span-2 h-full min-h-[420px]">
          <PerformanceChart />
        </div>
        <div className="lg:col-span-1 h-full min-h-[420px]">
          <PnLCalendar />
        </div>
      </div>

      {/* Bottom Row: Lists & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up delay-200">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[400px]">
          <OpenPositions />
          <RecentActivity />
        </div>
        <div className="lg:col-span-1 grid grid-rows-2 gap-6 h-full min-h-[400px]">
          <TopPerformers />
          <QuickStats data={liveData} />
        </div>
      </div>

      <NewsTicker />
    </div>
  )
}

