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
    <div className="pb-12 space-y-8 max-w-[1600px] mx-auto relative">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-fade-up">
        <StatCard
          label="Account Balance"
          value={currentBalance}
          isCurrency
          subLabel="FIXED_CAPITAL"
          icon={Wallet}
          theme="blue"
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Total Revenue"
          value={totalPnl}
          isCurrency
          subLabel={`${totalTrades} EXECUTIONS`}
          icon={DollarSign}
          theme={totalPnl >= 0 ? 'green' : 'red'}
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Live Equity"
          value={equity}
          isCurrency
          subLabel="FLOATING_VALUATION"
          icon={CheckCircle}
          theme="blue"
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Floating P&L"
          value={unrealizedPnL}
          isCurrency
          subLabel={`${openTrades} ACTIVE_THREADS`}
          icon={Clock}
          theme={unrealizedPnL >= 0 ? 'green' : 'red'}
          loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Success Rate"
          value={winRate}
          isPercentage
          subLabel="ALPHA_METRIC"
          icon={Target}
          theme="purple"
          loading={isLiveLoading && !liveData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Performance Section */}
        <div className="lg:col-span-8 space-y-8 animate-fade-up delay-100">
           <div className="h-full min-h-[460px]">
             <PerformanceChart />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
             <OpenPositions />
             <RecentActivity />
           </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="lg:col-span-4 space-y-8 animate-fade-up delay-200">
          <div className="min-h-[400px]">
            <MonthlyPL />
          </div>
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


