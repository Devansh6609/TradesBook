'use client'

import { useState } from 'react'
import { OHLCVBar, OpenPosition, ReplayConfig, SYMBOL_OPTIONS } from '@/lib/backtesting/types'
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
    config: ReplayConfig
    currentBar: OHLCVBar | null
    openPositions: OpenPosition[]
    onPlaceTrade: (dir: 'LONG' | 'SHORT', lots: number, sl: number | null, tp: number | null) => void
}

export function OrderPanel({ config, currentBar, openPositions, onPlaceTrade }: Props) {
    const [lots, setLots] = useState(config.lotSize)
    const [slPips, setSlPips] = useState(config.defaultSLPips)
    const [tpPips, setTpPips] = useState(config.defaultTPPips)
    const [slEnabled, setSlEnabled] = useState(true)
    const [tpEnabled, setTpEnabled] = useState(true)

    const sym = SYMBOL_OPTIONS.find(s => s.value === config.symbol)
    const pipValue = sym?.pipValue ?? 1
    const pipSize = sym?.pipSize ?? 0.0001
    // Derive decimal places from pip size so forex shows 5dp, gold 2dp, BTC 0dp etc.
    const priceDecimals = pipSize >= 1 ? 1 : pipSize >= 0.1 ? 2 : pipSize >= 0.01 ? 2 : pipSize >= 0.001 ? 3 : 5
    const riskPerTrade = slEnabled ? slPips * pipValue * lots * 100 : 0
    const rrRatio = slEnabled && tpEnabled ? (tpPips / slPips).toFixed(1) : '—'

    const price = currentBar?.close ?? 0

    const handleBuy = () => onPlaceTrade('LONG', lots, slEnabled ? slPips : null, tpEnabled ? tpPips : null)
    const handleSell = () => onPlaceTrade('SHORT', lots, slEnabled ? slPips : null, tpEnabled ? tpPips : null)

    return (
        <div className="flex flex-col border-b border-[var(--border)]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Place Order</span>
                <span className="text-xs font-mono font-semibold text-[var(--foreground)]">
                    {price > 0 ? price.toFixed(priceDecimals) : '—'}
                </span>
            </div>

            <div className="px-4 py-4 space-y-4">
                {/* LONG / SHORT buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleBuy}
                        disabled={!currentBar}
                        className="flex flex-col items-center py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    >
                        <TrendingUp size={18} className="mb-1" />
                        <span className="text-sm">BUY</span>
                        <span className="text-[10px] opacity-70">LONG</span>
                    </button>
                    <button
                        onClick={handleSell}
                        disabled={!currentBar}
                        className="flex flex-col items-center py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 font-bold hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                    >
                        <TrendingDown size={18} className="mb-1" />
                        <span className="text-sm">SELL</span>
                        <span className="text-[10px] opacity-70">SHORT</span>
                    </button>
                </div>

                {/* Lot size */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Position Size</label>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setLots(l => Math.max(0.01, +(l - 0.01).toFixed(2)))} className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-lg flex items-center justify-center" title="Decrease lot size" aria-label="Decrease lot size">−</button>
                        <input
                            type="number"
                            value={lots}
                            onChange={e => setLots(Math.max(0.01, Math.min(100, +e.target.value)))}
                            step={0.01}
                            min={0.01}
                            max={100}
                            title="Lot size"
                            aria-label="Lot size"
                            className="input flex-1 text-center text-sm font-mono"
                        />
                        <button onClick={() => setLots(l => +(l + 0.01).toFixed(2))} className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-lg flex items-center justify-center" title="Increase lot size" aria-label="Increase lot size">+</button>
                    </div>
                    <div className="text-[10px] text-[var(--foreground-disabled)] text-center">lots (1 lot = 100,000 units)</div>
                </div>

                {/* Stop Loss */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1.5">
                            <AlertTriangle size={10} className="text-red-400" />
                            Stop Loss
                        </label>
                        <button
                            onClick={() => setSlEnabled(!slEnabled)}
                            className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors', slEnabled ? 'bg-red-500/15 text-red-400' : 'bg-[var(--background-tertiary)] text-[var(--foreground-disabled)]')}
                        >
                            {slEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    {slEnabled && (
                        <div className="flex items-center gap-1">
                            <button onClick={() => setSlPips(p => Math.max(1, p - 5))} className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-lg flex items-center justify-center" title="Decrease stop loss" aria-label="Decrease stop loss">−</button>
                            <div className="flex-1 flex items-center gap-1">
                                <input
                                    type="number"
                                    value={slPips}
                                    onChange={e => setSlPips(Math.max(1, +e.target.value))}
                                    min={1}
                                    title="Stop loss in pips"
                                    aria-label="Stop loss in pips"
                                    className="input flex-1 text-center text-sm font-mono"
                                />
                                <span className="text-[10px] text-[var(--foreground-muted)]">pips</span>
                            </div>
                            <button onClick={() => setSlPips(p => p + 5)} className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-lg flex items-center justify-center" title="Increase stop loss" aria-label="Increase stop loss">+</button>
                        </div>
                    )}
                </div>

                {/* Take Profit */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1.5">
                            <Target size={10} className="text-emerald-400" />
                            Take Profit
                        </label>
                        <button
                            onClick={() => setTpEnabled(!tpEnabled)}
                            className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors', tpEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[var(--background-tertiary)] text-[var(--foreground-disabled)]')}
                        >
                            {tpEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    {tpEnabled && (
                        <div className="flex items-center gap-1">
                            <button onClick={() => setTpPips(p => Math.max(1, p - 5))} className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-lg flex items-center justify-center" title="Decrease take profit" aria-label="Decrease take profit">−</button>
                            <div className="flex-1 flex items-center gap-1">
                                <input
                                    type="number"
                                    value={tpPips}
                                    onChange={e => setTpPips(Math.max(1, +e.target.value))}
                                    min={1}
                                    title="Take profit in pips"
                                    aria-label="Take profit in pips"
                                    className="input flex-1 text-center text-sm font-mono"
                                />
                                <span className="text-[10px] text-[var(--foreground-muted)]">pips</span>
                            </div>
                            <button onClick={() => setTpPips(p => p + 5)} className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-lg flex items-center justify-center" title="Increase take profit" aria-label="Increase take profit">+</button>
                        </div>
                    )}
                </div>

                {/* Risk summary */}
                <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--foreground-muted)] flex items-center gap-1"><DollarSign size={11} />Risk</span>
                        <span className="font-bold text-red-400">${riskPerTrade.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--foreground-muted)]">R:R Ratio</span>
                        <span className={cn('font-bold', parseFloat(rrRatio) >= 2 ? 'text-emerald-400' : parseFloat(rrRatio) >= 1 ? 'text-amber-400' : 'text-[var(--foreground-muted)]')}>
                            1 : {rrRatio}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
