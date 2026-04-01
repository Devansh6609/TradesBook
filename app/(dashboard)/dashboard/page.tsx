'use client'
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

import { useAccount } from '@/contexts/AccountContext'

export default function DashboardPage() {
  const { selectedAccount } = useAccount()

  // Fetch real-time live stats for the selected account
  const { data: liveData, isLoading: isLiveLoading } = useQuery({
    queryKey: ['analytics', 'live', selectedAccount?.id],
    queryFn: () => api.analytics.live(), 
    refetchInterval: 5000, 
  })

  const isSyncing = liveData?.isSyncing ?? false
  const currentBalance = selectedAccount?.balance ?? liveData?.initialBalance ?? 0
  const unrealizedPnL = liveData?.unrealizedPnl ?? 0
  const equity = selectedAccount?.equity ?? liveData?.equity ?? (currentBalance + unrealizedPnL)
  const totalPnl = liveData?.totalNetPnl ?? 0
  const winRate = liveData?.winRate ?? 0
  const openTrades = liveData?.openTrades ?? 0
  const totalTrades = liveData?.totalTrades ?? 0

  return (
    <div className="pb-12 space-y-6 max-w-[1600px] mx-auto relative px-4 sm:px-6 lg:px-8">
      {/* Background Decor - Ambient Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {isSyncing && (
        <div className="bg-blue-500/5 border border-blue-500/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent animate-shimmer" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="text-blue-400 animate-spin-slow" size={20} />
            </div>
            <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1.5">System Sync In Progress</p>
                <p className="text-xs font-bold text-foreground/70">
                    Establishing secure bridge to MetaTrader 5 Terminal. Stats updating in real-time.
                </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-foreground-disabled">
              Protocol: TCP/IP SSL
          </div>
        </div>
      )}

      {/* Top Row: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up">
        <StatCard
          label="Total P&L"
          value={totalPnl}
          isCurrency
          subValue="TOTAL"
          subLabel={`${totalTrades} trades`}
          icon={DollarSign}
          theme="blue"
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Unrealized P&L"
          value={unrealizedPnL}
          isCurrency
          subValue="LIVE"
          subLabel={`${openTrades} open positions`}
          icon={Clock}
          theme="yellow"
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Realized P&L"
          value={totalPnl - unrealizedPnL} // Approximation of realized
          isCurrency
          subValue="TOTAL"
          subLabel={`${totalTrades - openTrades} trades`}
          icon={CheckCircle}
          theme="blue"
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Win Rate"
          value={winRate}
          isPercentage
          subValue="ALPHA"
          icon={Target}
          theme="blue"
          loading={isLiveLoading && !liveData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Top Row: Performance & Calendar */}
        <div className="lg:col-span-8 animate-fade-up delay-100">
           <div className="h-[480px]">
             <PerformanceChart />
           </div>
        </div>

        <div className="lg:col-span-4 animate-fade-up delay-150">
          <div className="h-[480px]">
            <MonthlyPL />
          </div>
        </div>

        {/* Bottom Row: Positions, Activity & Stats */}
        <div className="lg:col-span-4 animate-fade-up delay-200 h-full">
          <OpenPositions />
        </div>

        <div className="lg:col-span-4 animate-fade-up delay-250 h-full">
          <RecentActivity />
        </div>

        <div className="lg:col-span-4 space-y-6 animate-fade-up delay-300">
          <TopPerformers />
          <QuickStats data={liveData} />
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <NewsTicker />
      </div>
    </div>
  )
}


