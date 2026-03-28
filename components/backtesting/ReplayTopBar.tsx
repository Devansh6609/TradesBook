'use client'

import { ReplayConfig, ReplayStatus, Timeframe } from '@/lib/backtesting/types'
import { cn } from '@/lib/utils'
import { Settings, ChevronDown } from 'lucide-react'

interface Props {
    config: ReplayConfig
    status: ReplayStatus
    runningBalance: number
    currentTimeframe: Timeframe // kept for type compatibility but not used here anymore
    onTimeframeChange: (tf: Timeframe) => void
    onSpeedChange: (speed: ReplayConfig['speed']) => void
    onNewSession: () => void
}

export function ReplayTopBar({
    config,
    status,
    runningBalance,
    onNewSession,
}: Props) {
    const isProfit = runningBalance >= config.initialCapital

    return (
        <div className="flex-shrink-0 h-14 flex items-center px-4 border-b border-[var(--border)] bg-[#0d1117]">
            <div className="flex items-center gap-4">
                {/* Symbol badge */}
                <button
                    onClick={onNewSession}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                    title="Change symbol / start new session"
                >
                    <span className="text-[13px] font-bold text-white tracking-wide">{config.displaySymbol}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                </button>

                <div className="w-px h-5 bg-white/10" />

                {/* Status pill */}
                <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', status === 'playing' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : status === 'loading' ? 'bg-blue-500 animate-pulse' : 'bg-slate-600')} />
                    <span className={cn(
                        'text-[11px] font-bold tracking-widest uppercase',
                        status === 'playing' ? 'text-emerald-400' : status === 'loading' ? 'text-blue-400' : 'text-slate-500'
                    )}>
                        {status === 'playing' ? 'Live' : status === 'loading' ? 'Loading' : status === 'paused' ? 'Paused' : status}
                    </span>
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side controls */}
            <div className="flex items-center gap-4">
                {/* Running balance */}
                <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">BALANCE</span>
                    <span className={cn('text-[15px] font-black font-mono tracking-tight', isProfit ? 'text-emerald-400' : 'text-red-400')}>
                        ${runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="w-px h-5 bg-white/10" />

                {/* Settings */}
                <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors" title="Settings">
                    <Settings size={15} />
                </button>
            </div>
        </div>
    )
}
