'use client'
export const dynamic = 'force-dynamic'

import { useQuery } from '@tanstack/react-query'
import { DollarSign, Clock, CheckCircle, Target, Wallet } from 'lucide-react'
import { api } from '@/lib/apiClient'
import { StatCard } from '@/components/dashboard/StatCard'
import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import MonthlyPL from '@/components/dashboard/MonthlyPL'
import { OpenPositions } from '@/components/dashboard/OpenPositions'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { TopPerformers } from '@/components/dashboard/TopPerformers'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { NewsTicker } from '@/components/dashboard/NewsTicker'

export default function DashboardPage() {
  // Fetch real-time live stats (Balance, Equity, Unrealized, Win Rate)
  const { data: liveData, isLoading: isLiveLoading } = useQuery({
    queryKey: ['analytics', 'live'],
    queryFn: () => api.analytics.live(),
    refetchInterval: 5000, 
  })

  const isSyncing = liveData?.isSyncing ?? false
  const currentBalance = liveData?.initialBalance ?? 0
  const unrealizedPnL = liveData?.unrealizedPnl ?? 0
  const equity = liveData?.equity ?? (currentBalance + unrealizedPnL)
  const totalPnl = liveData?.totalNetPnl ?? 0
  const winRate = liveData?.winRate ?? 0
  const openTrades = liveData?.openTrades ?? 0
  const totalTrades = liveData?.totalTrades ?? 0

  return (
    <div className="pb-12 space-y-10 max-w-[1700px] mx-auto relative px-4 lg:px-8">
      {/* Background Accents */}
      <div className="absolute -top-40 -left-64 w-[600px] h-[600px] bg-blue-600/[0.03] rounded-full blur-[150px] pointer-events-none" />

      {isSyncing && (
        <div className="bg-blue-500/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group overflow-hidden relative">
          <div className="flex items-center gap-4 relative z-10">
            <Clock className="text-blue-500/50 animate-spin-slow" size={20} />
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              Live Terminal Sync Active <span className="text-zinc-600 mx-2">|</span> Bridge: AES-256-GCM
            </p>
          </div>
        </div>
      )}

      {/* Primary Stat Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Operational Capital"
          value={currentBalance}
          isCurrency
          subLabel="LIQUIDITY_BASE"
          icon={Wallet}
          theme="blue"
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Net Earnings"
          value={totalPnl}
          isCurrency
          subLabel={`${totalTrades} EXECUTIONS`}
          icon={DollarSign}
          theme={totalPnl >= 0 ? 'blue' : 'red'}
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Live Evaluation"
          value={equity}
          isCurrency
          subLabel="MARK_TO_MARKET"
          icon={CheckCircle}
          theme="blue"
          loading={isLiveLoading && !liveData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Intelligence Grid */}
        <div className="lg:col-span-8 space-y-6">
           <PerformanceChart />
           
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
             <OpenPositions />
             <RecentActivity />
           </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="lg:col-span-4 space-y-6">
          <MonthlyPL />
          <QuickStats data={liveData} />
          <TopPerformers />
        </div>
      </div>

      <div className="pt-6 border-t border-white/5 relative z-10">
        <NewsTicker />
      </div>
    </div>
  )
}


