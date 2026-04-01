'use client'

import { Globe, Building, Landmark, Clock, Sun, Moon, Cloud } from 'lucide-react'
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
        return val < 0 ? `-$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    }

    const SessionCard = ({ title, time, stats, icon: Icon, color, bgLight, border }: { title: string, time: string, stats: SessionStats, icon: any, color: string, bgLight: string, border: string }) => (
        <div className="bg-[#0a0a0a] p-6 rounded-3xl border border-white/5 flex flex-col h-full transition-all duration-300 hover:border-white/10 group">
            <div className="flex items-center gap-3 mb-6">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", bgLight, border)}>
                    <Icon className={cn("w-5 h-5", color)} />
                </div>
                <div>
                    <h4 className="font-black text-white text-base font-jakarta tracking-tight leading-none">{title}</h4>
                    <p className="text-[10px] text-white/30 font-bold tracking-widest uppercase mt-1.5">{time}</p>
                </div>
            </div>

            <div className="mb-8">
                <p className={cn("text-3xl font-black font-jakarta tracking-tighter", stats.pnl >= 0 ? "text-blue-500" : "text-red-500")}>
                    {formatCurrency(stats.pnl)}
                </p>
                <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                    <div
                        className={cn("h-full transition-all duration-1000", stats.pnl >= 0 ? "bg-blue-500" : "bg-red-500")}
                        style={{ width: `${stats.trades > 0 ? Math.max(5, Math.min(100, stats.volumePercent)) : 0}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5 leading-none">TRADES</p>
                    <p className="font-black text-sm text-white font-jakarta tracking-tight">{stats.trades}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5 leading-none">WIN RATE</p>
                    <p className="font-black text-sm text-blue-500 font-jakarta tracking-tight">
                        {stats.trades > 0 ? `${stats.winRate.toFixed(1)}%` : '-'}
                    </p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5 leading-none">AVG TRADE</p>
                    <p className="font-black text-sm text-white/80 font-jakarta tracking-tight">{stats.trades > 0 ? formatCurrency(stats.avgTrade) : '-'}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1.5 leading-none">VOLUME</p>
                    <p className="font-black text-sm text-white/80 font-jakarta tracking-tight">{stats.trades > 0 ? `${stats.volumePercent.toFixed(1)}%` : '0%'}</p>
                </div>
            </div>
        </div>
    )

    return (
        <div className="bg-[#0a0f1d]/40 border border-white/5 rounded-[40px] p-10">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white font-jakarta tracking-tight">Session Performance</h3>
                        <p className="text-xs text-white/30 uppercase font-black tracking-widest mt-1">Breakdown by trading session — Asian, London & New York</p>
                    </div>
                </div>
                <div className="px-4 py-2 bg-[#111111] rounded-xl border border-white/5 flex items-center gap-2 shadow-2xl">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-black text-white/60 tracking-[0.2em]">UTC TIME ZONE</span>
                </div>
            </div>

            <div className="relative mb-12">
                <div className="flex w-full h-12 rounded-2xl overflow-hidden mb-4 text-[10px] font-black tracking-[0.3em] relative border border-white/5">
                    <div className="bg-amber-500/10 text-amber-500 flex items-center justify-center flex-1 border-r border-white/5" title="Asian Session (22:00 - 08:00 UTC)">ASIAN</div>
                    <div className="bg-blue-500/10 text-blue-500 flex items-center justify-center flex-1 border-r border-white/5" title="London Session (08:00 - 13:00 UTC)">LONDON</div>
                    <div className="bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-1" title="New York Session (13:00 - 22:00 UTC)">NEW YORK</div>
                </div>
                <div className="flex w-full justify-between px-2">
                    {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'].map(time => (
                        <div key={time} className="flex flex-col items-center gap-2">
                            <div className="w-px h-2 bg-white/10" />
                            <span className="text-[10px] font-bold text-white/20 font-mono">{time}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <SessionCard
                    title="Asian Session"
                    time="22:00 - 08:00 UTC"
                    stats={data.asian}
                    icon={Moon}
                    color="text-amber-500"
                    bgLight="bg-amber-500/10"
                    border="border-amber-500/20"
                />
                <SessionCard
                    title="London Session"
                    time="08:00 - 13:00 UTC"
                    stats={data.london}
                    icon={Cloud}
                    color="text-blue-500"
                    bgLight="bg-blue-500/10"
                    border="border-blue-500/20"
                />
                <SessionCard
                    title="New York Session"
                    time="13:00 - 22:00 UTC"
                    stats={data.newYork}
                    icon={Sun}
                    color="text-emerald-500"
                    bgLight="bg-emerald-500/10"
                    border="border-emerald-500/20"
                />
            </div>
        </div>
    )
}
