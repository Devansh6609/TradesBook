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
      {/* Dynamic Background Accents */}
      <div className="absolute -top-40 -left-64 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none opacity-50 animate-pulse-slow" />
      <div className="absolute top-[20%] right-[-100px] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none opacity-40" />
      <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none opacity-30" />

      {isSyncing && (
        <div className="bg-blue-500/10 border border-blue-500/20 backdrop-blur-2xl rounded-[1.5rem] p-5 flex items-center justify-between group overflow-hidden relative shadow-[0_0_40px_rgba(59,130,246,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent animate-shimmer" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30 shadow-inner">
                <Clock className="text-blue-400 animate-spin-slow" size={24} />
            </div>
            <div>
                <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] leading-none mb-2">Protocol_Live_Sync</h4>
                <p className="text-sm font-bold text-foreground/80 tracking-tight">
                    Establishing high-fidelity bridge to MT5 Terminal. Data stream is currently active.
                </p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/60 shadow-lg">
              Encryption: AES-256-GCM
          </div>
        </div>
      )}

      {/* Primary Stat Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up">
        <StatCard
          label="Total P&L"
          value={totalPnl}
          isCurrency
          subLabel={`${totalTrades} trades`}
          icon={DollarSign}
          variant="hero"
          loading={isLiveLoading && !liveData}
        />
        <StatCard
            label="Unrealized P&L"
            value={unrealizedPnL}
            isCurrency
            subLabel={`${openTrades} active`}
            icon={Clock}
            theme={unrealizedPnL >= 0 ? 'green' : 'red'}
            loading={isLiveLoading && !liveData}
        />
        <StatCard
            label="Realized P&L"
            value={totalPnl - unrealizedPnL}
            isCurrency
            subLabel="Settled"
            icon={CheckCircle}
            theme="blue"
            loading={isLiveLoading && !liveData}
        />
        <StatCard
          label="Win Rate"
          value={winRate}
          isPercentage
          subLabel="Probability"
          icon={Target}
          theme="purple"
          loading={isLiveLoading && !liveData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Chart & Calendar side-by-side */}
        <div className="lg:col-span-8 h-full min-h-[500px]">
            <PerformanceChart />
        </div>
        <div className="lg:col-span-4 h-full">
            <div className="bg-[#0c0c0c] border border-white/5 rounded-[2rem] p-1 h-full shadow-xl">
                <MonthlyPL />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
            <OpenPositions />
            <RecentActivity />
        </div>
        <div className="lg:col-span-4 space-y-8">
            <TopPerformers />
            <QuickStats data={liveData} />
        </div>
      </div>

      <div className="pt-8 border-t border-white/5 relative z-10">
        <NewsTicker />
      </div>
    </div>
  )
}


