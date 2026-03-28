'use client'

import { Globe, Building, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionStats {
    trades: number
    pnl: number
    winRate: number
    avgTrade: number
    volume: number
    volumePercent: number
}

interface SessionPerformanceProps {
    data?: {
        asian: SessionStats
        london: SessionStats
        newYork: SessionStats
    }
}

export function SessionPerformance({ data }: SessionPerformanceProps) {
    if (!data) return null

    const formatCurrency = (val: number) => {
        return val < 0 ? `-$${Math.abs(val).toFixed(2)}` : `$${val.toFixed(2)}`
    }

    const formatNumber = (val: number) => val.toFixed(1)

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 mb-6">
            <div className="mb-6">
                <h3 className="font-bold text-[var(--foreground)] text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[var(--foreground-muted)]" />
                    Session Performance
                </h3>
                <p className="text-xs text-[var(--foreground-muted)]">Breakdown by trading session — Asian, London & New York</p>
            </div>

            {/* Timeline Bar */}
            <div className="flex w-full h-8 rounded-lg overflow-hidden mb-2 text-[10px] font-bold tracking-widest text-[#1a1a1a]">
                <div className="bg-[#b38a4d] flex items-center justify-center flex-1" title="Asian Session (22:00 - 08:00 UTC)">ASIAN</div>
                <div className="bg-[#4d70b3] flex items-center justify-center flex-1" title="London Session (08:00 - 13:00 UTC)">LONDON</div>
                <div className="bg-[#4db38a] flex items-center justify-center flex-1" title="New York Session (13:00 - 22:00 UTC)">NEW YORK</div>
            </div>
            <div className="flex w-full justify-between text-[10px] text-[var(--foreground-muted)] font-mono mb-6 px-1">
                <span>00:00</span>
                <span>08:00</span>
                <span>13:00</span>
                <span>22:00</span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Asian Session */}
                <div className="bg-[var(--background-tertiary)] p-4 rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#b38a4d]/20 flex items-center justify-center">
                            <Landmark className="w-4 h-4 text-[#b38a4d]" />
                        </div>
                        <div>
                            <p className="font-bold text-[var(--foreground)] text-sm">Asian</p>
                            <p className="text-[10px] text-[var(--foreground-muted)]">22:00 - 08:00 UTC</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className={cn("text-lg font-bold", data.asian.pnl >= 0 ? "text-blue-400" : "text-red-400")}>
                            {formatCurrency(data.asian.pnl)}
                        </p>
                        <div className="w-full h-1.5 bg-[var(--input-bg)] rounded-full mt-2 overflow-hidden">
                            <div
                                className={cn("h-full rounded-full", data.asian.pnl >= 0 ? "bg-blue-500" : "bg-red-500")}
                                style={{ width: `${data.asian.trades > 0 ? Math.max(2, Math.min(100, data.asian.volumePercent)) : 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">TRADES</p>
                            <p className="font-bold text-sm text-[var(--foreground)]">{data.asian.trades}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">WIN RATE</p>
                            <p className="font-bold text-sm text-blue-400">{data.asian.trades > 0 ? `${formatNumber(data.asian.winRate)}%` : '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">AVG TRADE</p>
                            <p className="font-bold text-sm text-blue-400">{data.asian.trades > 0 ? formatCurrency(data.asian.avgTrade) : '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">VOLUME</p>
                            <p className="font-bold text-sm text-[var(--foreground)]">{data.asian.trades > 0 ? `${formatNumber(data.asian.volumePercent)}%` : '0%'}</p>
                        </div>
                    </div>
                </div>

                {/* London Session */}
                <div className="bg-[var(--background-tertiary)] p-4 rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#4d70b3]/20 flex items-center justify-center">
                            <Building className="w-4 h-4 text-[#4d70b3]" />
                        </div>
                        <div>
                            <p className="font-bold text-[var(--foreground)] text-sm">London</p>
                            <p className="text-[10px] text-[var(--foreground-muted)]">08:00 - 13:00 UTC</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className={cn("text-lg font-bold", data.london.pnl >= 0 ? "text-blue-400" : "text-red-400")}>
                            {formatCurrency(data.london.pnl)}
                        </p>
                        <div className="w-full h-1.5 bg-[var(--input-bg)] rounded-full mt-2 overflow-hidden">
                            <div
                                className={cn("h-full rounded-full", data.london.pnl >= 0 ? "bg-blue-500" : "bg-red-500")}
                                style={{ width: `${data.london.trades > 0 ? Math.max(2, Math.min(100, data.london.volumePercent)) : 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">TRADES</p>
                            <p className="font-bold text-sm text-[var(--foreground)]">{data.london.trades}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">WIN RATE</p>
                            <p className="font-bold text-sm text-blue-400">{data.london.trades > 0 ? `${formatNumber(data.london.winRate)}%` : '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">AVG TRADE</p>
                            <p className="font-bold text-sm text-blue-400">{data.london.trades > 0 ? formatCurrency(data.london.avgTrade) : '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">VOLUME</p>
                            <p className="font-bold text-sm text-[var(--foreground)]">{data.london.trades > 0 ? `${formatNumber(data.london.volumePercent)}%` : '0%'}</p>
                        </div>
                    </div>
                </div>

                {/* New York Session */}
                <div className="bg-[var(--background-tertiary)] p-4 rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#4db38a]/20 flex items-center justify-center">
                            <Building className="w-4 h-4 text-[#4db38a]" />
                        </div>
                        <div>
                            <p className="font-bold text-[var(--foreground)] text-sm">New York</p>
                            <p className="text-[10px] text-[var(--foreground-muted)]">13:00 - 22:00 UTC</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className={cn("text-lg font-bold", data.newYork.pnl >= 0 ? "text-blue-400" : "text-red-400")}>
                            {formatCurrency(data.newYork.pnl)}
                        </p>
                        <div className="w-full h-1.5 bg-[var(--input-bg)] rounded-full mt-2 overflow-hidden">
                            <div
                                className={cn("h-full rounded-full", data.newYork.pnl >= 0 ? "bg-blue-500" : "bg-red-500")}
                                style={{ width: `${data.newYork.trades > 0 ? Math.max(2, Math.min(100, data.newYork.volumePercent)) : 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">TRADES</p>
                            <p className="font-bold text-sm text-[var(--foreground)]">{data.newYork.trades}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">WIN RATE</p>
                            <p className="font-bold text-sm text-blue-400">{data.newYork.trades > 0 ? `${formatNumber(data.newYork.winRate)}%` : '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">AVG TRADE</p>
                            <p className="font-bold text-sm text-blue-400">{data.newYork.trades > 0 ? formatCurrency(data.newYork.avgTrade) : '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-widest mb-1">VOLUME</p>
                            <p className="font-bold text-sm text-[var(--foreground)]">{data.newYork.trades > 0 ? `${formatNumber(data.newYork.volumePercent)}%` : '0%'}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
