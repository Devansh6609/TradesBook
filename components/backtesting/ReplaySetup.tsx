'use client'

import { useState } from 'react'
import { FlaskConical, ChevronDown, Calendar } from 'lucide-react'
import { ReplayConfig, SYMBOL_OPTIONS, TIMEFRAME_OPTIONS, Timeframe } from '@/lib/backtesting/types'
import { cn } from '@/lib/utils'

interface Props {
    onStart: (config: ReplayConfig) => void
    isLoading?: boolean
}

export function ReplaySetup({ onStart, isLoading }: Props) {
    const [symbol, setSymbol] = useState(SYMBOL_OPTIONS[0])
    const [timeframe, setTimeframe] = useState<Timeframe>('1h')
    const [startDate, setStartDate] = useState('2024-01-01')
    const [capital, setCapital] = useState(10000)
    const [showSymbols, setShowSymbols] = useState(false)

    const grouped = SYMBOL_OPTIONS.reduce((acc, s) => {
        if (!acc[s.category]) acc[s.category] = []
        acc[s.category].push(s)
        return acc
    }, {} as Record<string, typeof SYMBOL_OPTIONS>)

    const handleStart = () => {
        onStart({
            symbol: symbol.value,
            displaySymbol: symbol.label,
            timeframe,
            startDate,
            speed: 1,
            initialCapital: capital,
            lotSize: 0.10,
            defaultSLPips: 20,
            defaultTPPips: 40,
            pipValue: symbol.pipValue,
        })
    }

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] px-4 animate-fade-in">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                        <FlaskConical size={28} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-[var(--foreground)] mb-2">Market Replay</h1>
                    <p className="text-sm text-[var(--foreground-muted)]">
                        Practice trading on historical data, bar by bar — like FXReplay
                    </p>
                </div>

                {/* Setup Card */}
                <div className="glass-obsidian rounded-2xl border border-[var(--border)] p-6 space-y-5">
                    {/* Symbol */}
                    <div className="space-y-2 relative">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Symbol</label>
                        <button
                            onClick={() => setShowSymbols(!showSymbols)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--foreground)] hover:border-blue-500/50 transition-colors"
                        >
                            <span>{symbol.label}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-0.5 rounded-md">{symbol.category}</span>
                                <ChevronDown size={14} className={cn('text-[var(--foreground-muted)] transition-transform', showSymbols && 'rotate-180')} />
                            </div>
                        </button>

                        {showSymbols && (
                            <div className="absolute z-50 top-full mt-1 w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
                                {Object.entries(grouped).map(([cat, syms]) => (
                                    <div key={cat}>
                                        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-disabled)] bg-[var(--background-tertiary)]">{cat}</div>
                                        {syms.map(s => (
                                            <button
                                                key={s.value}
                                                onClick={() => { setSymbol(s); setShowSymbols(false) }}
                                                className={cn('w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--background-tertiary)] transition-colors', s.value === symbol.value && 'text-blue-400 bg-blue-500/5')}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Timeframe */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Timeframe</label>
                        <div className="grid grid-cols-6 gap-1">
                            {TIMEFRAME_OPTIONS.map(tf => (
                                <button
                                    key={tf.value}
                                    onClick={() => setTimeframe(tf.value)}
                                    className={cn(
                                        'py-2 text-xs font-bold rounded-lg transition-all',
                                        timeframe === tf.value
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-muted)] hover:border-blue-500/40'
                                    )}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Replay Start Date</label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                max={new Date().toISOString().slice(0, 10)}
                                title="Replay start date"
                                aria-label="Replay start date"
                                className="input w-full pl-8 text-sm"
                            />
                        </div>
                        <p className="text-[10px] text-[var(--foreground-disabled)]">Candles after this date will be hidden until revealed by playback</p>
                    </div>

                    {/* Capital */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Virtual Capital</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-sm">$</span>
                            <input
                                type="number"
                                value={capital}
                                onChange={e => setCapital(Math.max(100, Number(e.target.value)))}
                                min={100}
                                step={1000}
                                title="Virtual starting capital"
                                aria-label="Virtual starting capital"
                                className="input w-full pl-6 text-sm"
                            />
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={handleStart}
                        disabled={isLoading}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:from-blue-400 hover:to-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Loading candles…
                            </>
                        ) : (
                            <>
                                <FlaskConical size={16} />
                                Start Replay
                            </>
                        )}
                    </button>

                    {/* Keyboard hint */}
                    <p className="text-[10px] text-center text-[var(--foreground-disabled)]">
                        Space = Play/Pause · [ = Step back · ] = Step forward
                    </p>
                </div>
            </div>
        </div>
    )
}
