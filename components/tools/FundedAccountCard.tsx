'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { 
    Target, TrendingUp, AlertTriangle, CheckCircle2, 
    ShieldAlert, Activity, History, TrendingDown, 
    MoreHorizontal, Plus, RefreshCw, BarChart3,
    ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FundedAccountStats } from '@/lib/utils/funded-account-utils'
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { Button } from '@/components/ui/Button'

interface FundedAccountCardProps {
    account: {
        id: string
        propFirmName: string
        accountSize: number
        status: string
        step: number
        currentStep: number
        accountId?: string
    }
    stats: FundedAccountStats
    onAddTrade?: () => void
}

export function FundedAccountCard({ account, stats, onAddTrade }: FundedAccountCardProps) {
    const dailyDrawdownUsedPcnt = (stats.dailyDrawdownUsed / stats.dailyDrawdownLimitAmount) * 100
    const maxDrawdownUsedPcnt = (stats.maxDrawdownUsed / stats.maxDrawdownLimitAmount) * 100

    const isNearBreach = dailyDrawdownUsedPcnt > 80 || maxDrawdownUsedPcnt > 80
    const chartData = stats.equityCurve.map((val, idx) => ({ value: val }))

    return (
        <Card className="flex flex-col bg-[#0a0a0a] border-white/5 overflow-hidden group hover:border-blue-500/20 transition-all duration-500 rounded-[2.5rem] shadow-2xl">
            {/* Upper Section: Identity & Actions */}
            <div className="p-8 pb-6 space-y-6">
                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-500">
                            <Activity className="w-7 h-7 text-foreground-disabled/20 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <h3 className="text-lg font-black tracking-tight text-white uppercase italic">{account.propFirmName}</h3>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                    account.status === 'ACTIVE' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                    account.status === 'PASSED' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                                    "bg-white/5 border-white/10 text-foreground-disabled/40"
                                )}>
                                    PHASE {account.currentStep}
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-foreground-disabled/30 uppercase tracking-[.2em]">${account.accountSize.toLocaleString()} Core Allocation</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={onAddTrade}
                            variant="outline"
                            className="h-10 w-10 p-0 rounded-xl border-white/5 bg-white/5 hover:bg-blue-600 hover:text-white transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                        <button className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-foreground-disabled/20">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Big Profit Number */}
                <div className="flex items-end justify-between py-2">
                    <div>
                        <p className={cn(
                            "text-4xl font-black tracking-tighter leading-none mb-2",
                            stats.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                            {stats.totalPnL >= 0 ? '+' : ''}${Math.abs(stats.totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                stats.totalPnL >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                            )}>
                                {stats.totalPnL >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {((stats.totalPnL / account.accountSize) * 100).toFixed(2)}%
                            </div>
                            <span className="text-[9px] font-black text-foreground-disabled/20 uppercase tracking-widest italic">Return on Equity</span>
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[9px] font-black text-foreground-disabled/30 uppercase tracking-widest">Victory Pct</p>
                        <p className="text-xl font-black text-white italic">{stats.winRate.toFixed(1)}%</p>
                    </div>
                </div>
            </div>

            {/* Middle Section: Visualization */}
            <div className="px-8 pb-8 space-y-6">
                {/* Micro Sparkline */}
                <div className="h-20 w-full bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]/50 pointer-events-none z-10" />
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#3b82f6" 
                                strokeWidth={2.5} 
                                dot={false}
                                animationDuration={1000}
                            />
                            <YAxis hide domain={['dataMin', 'dataMax']} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Critical Monitors */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                            <p className="text-[9px] font-black text-foreground-disabled/40 uppercase tracking-widest flex items-center gap-1.5">
                                <Activity className="w-3 h-3 text-blue-500" /> Daily Loss
                            </p>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                dailyDrawdownUsedPcnt > 70 ? "text-red-500" : "text-white/40"
                            )}>{dailyDrawdownUsedPcnt.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className={cn(
                                    "h-full transition-all duration-1000 ease-out rounded-full",
                                    dailyDrawdownUsedPcnt > 80 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" : 
                                    dailyDrawdownUsedPcnt > 50 ? "bg-yellow-500" : "bg-blue-600"
                                )}
                                style={{ width: `${Math.min(100, dailyDrawdownUsedPcnt)}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                            <p className="text-[9px] font-black text-foreground-disabled/40 uppercase tracking-widest flex items-center gap-1.5">
                                <ShieldAlert className="w-3 h-3 text-red-500/50" /> Max Breach
                            </p>
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{maxDrawdownUsedPcnt.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-white/10 transition-all duration-1000 ease-out rounded-full"
                                style={{ width: `${Math.min(100, maxDrawdownUsedPcnt)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Alert Section */}
            {(stats.isDailyDrawdownBreached || stats.isTargetMet) && (
                <div className={cn(
                    "mt-auto p-5 py-4 flex items-center justify-center gap-3 transition-colors",
                    stats.isDailyDrawdownBreached ? "bg-red-500/10 border-t border-red-500/20" : "bg-green-500/10 border-t border-green-500/20"
                )}>
                    {stats.isDailyDrawdownBreached ? (
                        <>
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-[.25em]">Critical Protocol Breach</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-[.25em]">Target Threshold Met</span>
                        </>
                    )}
                </div>
            )}
        </Card>
    )
}

