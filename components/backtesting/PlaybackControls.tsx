'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Play, Pause, ChevronRight, ChevronsRight, X, BarChart2 } from 'lucide-react'
import { SpeedOption, SPEED_OPTIONS } from '@/lib/backtesting/useReplayEngine'
import { Timeframe, TIMEFRAME_OPTIONS } from '@/lib/backtesting/types'
import { ReplayStatus } from '@/lib/backtesting/types'

interface Props {
    status: ReplayStatus
    currentIndex: number
    totalBars: number
    speed: SpeedOption
    timeframe: Timeframe
    onToggle: () => void
    onStepForward: () => void
    onJumpToEnd: () => void
    onSpeedChange: (s: SpeedOption) => void
    onTimeframeChange: (tf: Timeframe) => void
    onEndSession: () => void
    onEnterSelectMode: () => void
}

export function PlaybackControls({
    status, currentIndex, totalBars, speed, timeframe,
    onToggle, onStepForward, onJumpToEnd, onSpeedChange, onTimeframeChange, onEndSession, onEnterSelectMode,
}: Props) {
    const isPlaying = status === 'playing'
    const atEnd = currentIndex >= totalBars - 1
    const disabled = status === 'loading' || status === 'setup'

    // ── Keyboard shortcuts ───────────────────────────────────────────────────────
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return
            if (e.code === 'Space') { e.preventDefault(); onToggle() }
            if (e.key === ']') { e.preventDefault(); onStepForward() }
        }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [onToggle, onStepForward])

    const pill = 'flex items-center justify-center rounded-lg transition-all duration-150'

    // Progress pct for the thin bar above the toolbar
    const pct = totalBars > 0 ? (currentIndex / (totalBars - 1)) * 100 : 0

    return (
        // Floating pill — position absolute over the chart, centered bottom
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-1.5 z-20">

            {/* Thin progress bar */}
            <div className="w-72 h-0.5 bg-white/10 rounded-full overflow-hidden pointer-events-auto">
                <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-100"
                    style={{ width: `${pct}%` }}
                />
            </div>

            {/* Main floating pill — matches TradingView exact layout */}
            <div className="pointer-events-auto flex items-center gap-px bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-1 py-1 shadow-2xl shadow-black/50">

                {/* Divider helper */}
                {/* 1. Select bar indicator (clickable to re-enter select mode) */}
                <button
                    onClick={onEnterSelectMode}
                    title="Change start point"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-slate-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                >
                    <BarChart2 size={13} className="text-blue-400" />
                    <span className="font-mono">{currentIndex.toLocaleString()}</span>
                    <span className="text-slate-600">/</span>
                    <span className="font-mono text-slate-600">{totalBars.toLocaleString()}</span>
                </button>

                <div className="w-px h-5 bg-white/10 mx-0.5" />

                {/* 2. Play / Pause */}
                <button
                    onClick={onToggle}
                    disabled={disabled || atEnd}
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className={cn(
                        pill, 'w-9 h-9',
                        disabled || atEnd
                            ? 'text-slate-600 cursor-not-allowed'
                            : isPlaying
                                ? 'text-amber-400 hover:bg-amber-400/10'
                                : 'text-blue-400 hover:bg-blue-400/10'
                    )}
                >
                    {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
                </button>

                {/* 3. Step forward — ⏭ (one candle at a time) */}
                <button
                    onClick={onStepForward}
                    disabled={disabled || atEnd}
                    title="Step forward 1 bar  ( ] )"
                    aria-label="Step forward 1 bar"
                    className={cn(pill, 'w-9 h-9 text-slate-300 hover:text-white hover:bg-white/5 disabled:text-slate-600 disabled:cursor-not-allowed')}
                >
                    <ChevronRight size={17} />
                </button>

                {/* 4. Jump to end — ⏭| */}
                <button
                    onClick={onJumpToEnd}
                    disabled={disabled || atEnd}
                    title="Jump to end (reveal all bars)"
                    aria-label="Jump to end"
                    className={cn(pill, 'w-9 h-9 text-slate-300 hover:text-white hover:bg-white/5 disabled:text-slate-600 disabled:cursor-not-allowed')}
                >
                    <ChevronsRight size={17} />
                </button>

                <div className="w-px h-5 bg-white/10 mx-0.5" />

                {/* 5. Speed selector */}
                <div className="relative">
                    <select
                        value={speed}
                        onChange={e => onSpeedChange(+e.target.value as SpeedOption)}
                        title="Playback speed"
                        aria-label="Playback speed"
                        className="appearance-none bg-[none] bg-transparent text-[11px] font-bold text-slate-300 hover:text-white px-2 py-1.5 pr-5 cursor-pointer focus:outline-none rounded-lg hover:bg-white/5 transition-colors"
                    >
                        {SPEED_OPTIONS.map(s => (
                            <option key={s} value={s} className="bg-[#0d1117] text-white">{s}x</option>
                        ))}
                    </select>
                </div>

                <div className="w-px h-5 bg-white/10 mx-0.5" />

                {/* 6. Timeframe selector — change TF mid-session */}
                <div className="relative">
                    <select
                        value={timeframe}
                        onChange={e => onTimeframeChange(e.target.value as Timeframe)}
                        title="Change timeframe"
                        aria-label="Change timeframe"
                        className="appearance-none bg-[none] bg-transparent text-[11px] font-bold text-slate-300 hover:text-white px-2 py-1.5 pr-5 cursor-pointer focus:outline-none rounded-lg hover:bg-white/5 transition-colors"
                    >
                        {TIMEFRAME_OPTIONS.map(tf => (
                            <option key={tf.value} value={tf.value} className="bg-[#0d1117] text-white">{tf.label}</option>
                        ))}
                    </select>
                </div>

                <div className="w-px h-5 bg-white/10 mx-0.5" />

                {/* 7. End / Exit */}
                <button
                    onClick={onEndSession}
                    title="End session"
                    aria-label="End session"
                    className={cn(pill, 'w-9 h-9 text-slate-500 hover:text-red-400 hover:bg-red-400/10')}
                >
                    <X size={16} />
                </button>
            </div>

            {/* Keyboard hint */}
            <div className="pointer-events-none text-[9px] text-slate-600 tracking-wider">
                SPACE = Play/Pause &nbsp;·&nbsp; ] = Step Forward
            </div>
        </div>
    )
}
