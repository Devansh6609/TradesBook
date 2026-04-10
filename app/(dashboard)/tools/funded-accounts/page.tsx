'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/apiClient'
import { 
    Target, Plus, ShieldCheck, TrendingUp, BarChart3, 
    Zap, Rocket, Award, Globe, Activity, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FundedAccountCard } from '@/components/tools/FundedAccountCard'
import { AddFundedAccountModal } from '@/components/tools/AddFundedAccountModal'
import { AddTradeModal } from '@/components/tools/AddTradeModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { calculateFundedAccountStats, FundedAccountStats } from '@/lib/utils/funded-account-utils'
import { cn } from '@/lib/utils'

export default function FundedAccountsPage() {
    const queryClient = useQueryClient()
    const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false)
    const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false)
    const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>()

    const { data: fundedAccountsData, isLoading: isLoadingFunded } = useQuery({
        queryKey: ['fundedAccounts'],
        queryFn: () => api.fundedAccounts.list()
    })

    const { data: accountsData } = useQuery({
        queryKey: ['accounts'],
        queryFn: () => api.accounts.list()
    })

    const { data: allTrades } = useQuery({
        queryKey: ['trades'],
        queryFn: () => api.trades.list({ limit: 1000 })
    })

    const createAccountMutation = useMutation({
        mutationFn: (data: any) => api.fundedAccounts.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fundedAccounts'] })
            setIsAddAccountModalOpen(false)
        }
    })

    const fundedAccounts = fundedAccountsData?.fundedAccounts || []
    const accounts = accountsData?.accounts || []
    const trades = allTrades?.trades || []

    // Calculate Global Stats
    const globalStats = useMemo(() => {
        if (fundedAccounts.length === 0) return { totalPnl: 0, avgWinRate: 0, passedCount: 0, totalAccountSize: 0 };

        let totalPnl = 0;
        let totalWinRate = 0;
        let passedCount = 0;
        let totalAccountSize = 0;

        fundedAccounts.forEach((account: any) => {
            const accountTrades = trades.filter(t => t.accountId === account.accountId);
            const linkedAccount = accounts.find(a => a.id === account.accountId);
            const unrealizedPnl = linkedAccount?.unrealizedPnl || 0;
            const stats = calculateFundedAccountStats(account, accountTrades, unrealizedPnl);

            totalPnl += stats.totalPnL;
            totalWinRate += stats.winRate;
            totalAccountSize += account.accountSize;
            if (stats.isTargetMet || account.status === 'PASSED') passedCount++;
        });

        return {
            totalPnl,
            avgWinRate: totalWinRate / fundedAccounts.length,
            passedCount,
            totalAccountSize
        };
    }, [fundedAccounts, trades, accounts]);

    const openTradeModal = (accountId?: string) => {
        setSelectedAccountId(accountId)
        setIsAddTradeModalOpen(true)
    }

    return (
        <div className="max-w-7xl mx-auto pb-24 space-y-10">
            {/* Professional Management Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[.4em]">Prop Accountability Portfolio</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
                        Allocation <span className="text-white/20">Control</span>
                    </h1>
                    <p className="text-sm font-bold text-foreground-disabled/40 max-w-lg">
                        Strategic oversight for {fundedAccounts.length} active prop dependencies and equity evaluations.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => openTradeModal()}
                        variant="outline"
                        className="h-14 px-8 border-white/5 bg-white/[0.02] hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-2xl"
                    >
                        <RefreshCw className="w-4 h-4 text-blue-500" /> Sync MT5
                    </Button>
                    <Button 
                        onClick={() => setIsAddAccountModalOpen(true)}
                        className="h-14 px-10 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_15px_40px_rgba(59,130,246,0.3)]"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Protocol
                    </Button>
                </div>
            </div>

            {/* High-Density Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 md:px-0">
                {[
                    { label: 'Asset Allocation', value: `$${(globalStats?.totalAccountSize || 0).toLocaleString()}`, icon: Globe },
                    { label: 'Net Realized', value: `${(globalStats?.totalPnl || 0) >= 0 ? '+' : '-'}$${Math.abs(globalStats?.totalPnl || 0).toLocaleString()}`, icon: TrendingUp, color: (globalStats?.totalPnl || 0) >= 0 ? 'text-green-500' : 'text-red-500' },
                    { label: 'Portfolio WinRate', value: `${globalStats?.avgWinRate.toFixed(1) || '0'}%`, icon: Activity, color: 'text-blue-400' },
                    { label: 'Phase Completion', value: `${globalStats?.passedCount || 0} Assets`, icon: Award, color: 'text-yellow-500' },
                ].map((stat, i) => (
                    <div key={i} className="group p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[9px] font-black text-foreground-disabled/30 uppercase tracking-[.25em]">{stat.label}</p>
                            <stat.icon className="w-4 h-4 text-foreground-disabled/20 group-hover:text-foreground-disabled/50 transition-colors" />
                        </div>
                        <p className={cn("text-3xl font-black tracking-tighter", stat.color || "text-foreground")}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Accounts Listing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-0">
                {isLoadingFunded ? (
                    [1, 2].map(i => <Skeleton key={i} className="h-[600px] rounded-[3rem]" />)
                ) : fundedAccounts.length > 0 ? (
                    fundedAccounts.map(account => {
                        const accountTrades = trades.filter(t => t.accountId === account.accountId)
                        const linkedAccount = accounts.find(a => a.id === account.accountId)
                        const unrealizedPnl = linkedAccount?.unrealizedPnl || 0
                        const stats = calculateFundedAccountStats(account as any, accountTrades, unrealizedPnl);

                        return (
                            <FundedAccountCard 
                                key={account.id}
                                account={account as any} 
                                stats={stats} 
                                onAddTrade={() => openTradeModal(account.accountId || undefined)}
                            />
                        )
                    })
                ) : (
                    <div className="lg:col-span-2 py-32 text-center rounded-[3rem] border border-dashed border-white/5 bg-white/[0.01]">
                        <div className="space-y-4 max-w-xs mx-auto">
                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <Target className="w-8 h-8 text-foreground-disabled/20" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-widest">No Active Vectors</h3>
                            <p className="text-[11px] font-bold text-foreground-disabled/30 leading-relaxed uppercase tracking-widest">
                                Connect your first evaluation to begin performance monitoring.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <AddFundedAccountModal 
                isOpen={isAddAccountModalOpen}
                onClose={() => setIsAddAccountModalOpen(false)}
                accounts={accounts}
                onAdd={(data) => createAccountMutation.mutate(data)}
            />

            <AddTradeModal 
                isOpen={isAddTradeModalOpen}
                onClose={() => setIsAddTradeModalOpen(false)}
                accounts={accounts}
                defaultAccountId={selectedAccountId}
            />
        </div>
    )
}
