'use client'

import { OpenPosition } from '@/lib/backtesting/types'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, X } from 'lucide-react'

interface Props {
    positions: OpenPosition[]
    onClose: (id: string) => void
}

export function OpenPositions({ positions, onClose }: Props) {
    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Open Positions</span>
                {positions.length > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                        {positions.length}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {positions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center">
                            <TrendingUp size={16} className="text-[var(--foreground-disabled)]" />
                        </div>
                        <p className="text-xs text-[var(--foreground-disabled)] leading-relaxed">
                            No open positions.<br />Use BUY/SELL to enter a trade.
                        </p>
                    </div>
                ) : (
                    <div className="p-3 space-y-2">
                        {positions.map(pos => {
                            const isLong = pos.direction === 'LONG'
                            const isProfit = pos.floatingPnl >= 0
                            return (
                                <div
                                    key={pos.id}
                                    className={cn(
                                        'rounded-xl border p-3 space-y-2 transition-all',
                                        isLong
                                            ? 'border-emerald-500/20 bg-emerald-500/5'
                                            : 'border-orange-500/20 bg-orange-500/5'
                                    )}
                                >
                                    {/* Direction + Close button */}
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold',
                                            isLong ? 'bg-emerald-500/15 text-emerald-400' : 'bg-orange-500/15 text-orange-400'
                                        )}>
                                            {isLong ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {pos.direction}
                                        </span>
                                        <button
                                            onClick={() => onClose(pos.id)}
                                            title="Close position at market"
                                            aria-label="Close position at market"
                                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <X size={10} />
                                            Close
                                        </button>
                                    </div>

                                    {/* Price info */}
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                        <div>
                                            <div className="text-[9px] text-[var(--foreground-disabled)] uppercase tracking-wider">Entry</div>
                                            <div className="text-xs font-mono font-semibold text-[var(--foreground)]">{pos.entryPrice.toFixed(4)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] text-[var(--foreground-disabled)] uppercase tracking-wider">Size</div>
                                            <div className="text-xs font-mono font-semibold text-[var(--foreground)]">{pos.lots} lot</div>
                                        </div>
                                        {pos.slPrice !== null && (
                                            <div>
                                                <div className="text-[9px] text-red-400/70 uppercase tracking-wider">SL</div>
                                                <div className="text-xs font-mono text-red-400">{pos.slPrice.toFixed(4)}</div>
                                            </div>
                                        )}
                                        {pos.tpPrice !== null && (
                                            <div>
                                                <div className="text-[9px] text-emerald-400/70 uppercase tracking-wider">TP</div>
                                                <div className="text-xs font-mono text-emerald-400">{pos.tpPrice.toFixed(4)}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Floating P&L */}
                                    <div className={cn(
                                        'flex items-center justify-center py-2 rounded-lg text-sm font-black font-mono',
                                        isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                    )}>
                                        {isProfit ? '+' : ''}{pos.floatingPnl.toFixed(2)} USD
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
