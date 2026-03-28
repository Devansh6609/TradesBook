'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, TrendingUp, TrendingDown, Loader2, Check, Zap } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { AssetIcon } from "@/components/market/AssetIcon"
import { calculateTradePnL } from '@/lib/trades'
import { cn } from '@/lib/utils'

const POPULAR_SYMBOLS = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'GBPJPY',
    'AUDUSD', 'USDCAD', 'NZDUSD', 'US30', 'NAS100'
]

interface QuickTradeData {
    symbol: string
    type: 'BUY' | 'SELL'
    entryPrice: string
    exitPrice: string
    quantity: string
    entryDate: string
    exitDate: string
    status: 'OPEN' | 'CLOSED'
}

export function QuickTradeButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const modalRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()

    // Partial close state
    const [partialCloseQty, setPartialCloseQty] = useState<number>(0)
    const [partialClosePrice, setPartialClosePrice] = useState<number>(0)
    const [pendingPartialCloses, setPendingPartialCloses] = useState<{ quantity: number; exitPrice: number; pnl: number }[]>([])

    const now = new Date()
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

    const [form, setForm] = useState<QuickTradeData>({
        symbol: '',
        type: 'BUY',
        entryPrice: '',
        exitPrice: '',
        quantity: '0.01',
        entryDate: localISO,
        exitDate: localISO,
        status: 'CLOSED',
    })

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }
        if (isOpen) document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen])

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            setTimeout(() => document.addEventListener('mousedown', handleClick), 100)
        }
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isOpen])

    const resetForm = () => {
        const now = new Date()
        const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        setForm({
            symbol: '', type: 'BUY', entryPrice: '', exitPrice: '',
            quantity: '0.01', entryDate: localISO, exitDate: localISO, status: 'CLOSED',
        })
        setError('')
        setSuccess(false)
        setPartialCloseQty(0)
        setPartialClosePrice(0)
        setPendingPartialCloses([])
    }

    const handleSubmit = async () => {
        if (!form.symbol.trim()) { setError('Symbol is required'); return }
        if (!form.entryPrice || parseFloat(form.entryPrice) <= 0) { setError('Entry price is required'); return }
        if (form.status === 'CLOSED' && (!form.exitPrice || parseFloat(form.exitPrice) <= 0)) { setError('Exit price is required for closed trades'); return }

        setIsSubmitting(true)
        setError('')

        try {
            const res = await fetch('/api/trades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: form.symbol.toUpperCase().trim(),
                    type: form.type,
                    entryPrice: parseFloat(form.entryPrice),
                    exitPrice: form.status === 'CLOSED' ? parseFloat(form.exitPrice) : undefined,
                    quantity: parseFloat(form.quantity) || 0.01,
                    entryDate: new Date(form.entryDate).toISOString(),
                    exitDate: form.status === 'CLOSED' ? new Date(form.exitDate).toISOString() : undefined,
                    status: form.status,
                    commission: 0,
                    swap: 0,
                    fees: 0,
                    ...(pendingPartialCloses.length > 0 && {
                        partialCloses: pendingPartialCloses.map(pc => ({
                            quantity: pc.quantity,
                            exitPrice: pc.exitPrice,
                        })),
                    }),
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save trade')
            }

            setSuccess(true)
            queryClient.invalidateQueries({ queryKey: ['trades'] })
            queryClient.invalidateQueries({ queryKey: ['analytics'] })

            setTimeout(() => {
                resetForm()
                setIsOpen(false)
            }, 1200)
        } catch (err: any) {
            setError(err.message || 'Failed to save trade')
        } finally {
            setIsSubmitting(false)
        }
    }

    const update = (field: keyof QuickTradeData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
        setError('')
    }

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => { resetForm(); setIsOpen(true) }}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                    bg-gradient-to-br from-blue-500 to-blue-600
                    text-white shadow-lg shadow-blue-500/30
                    hover:shadow-xl hover:shadow-blue-500/40 hover:scale-110
                    active:scale-95 transition-all duration-200
                    flex items-center justify-center group"
                title="Quick Add Trade"
            >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        ref={modalRef}
                        className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-blue-400" />
                                <h2 className="text-lg font-semibold text-[var(--foreground)]">Quick Trade</h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                aria-label="Close quick trade modal"
                                className="p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition-colors text-[var(--foreground-muted)]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {success ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <Check className="w-8 h-8 text-green-400" />
                                </div>
                                <p className="text-lg font-semibold text-green-400">Trade Saved!</p>
                            </div>
                        ) : (
                            <div className="px-5 py-4 space-y-4">
                                {/* Symbol Quick Select */}
                                <div>
                                    <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5 block">
                                        Symbol
                                    </label>
                                    <input
                                        type="text"
                                        value={form.symbol}
                                        onChange={e => update('symbol', e.target.value.toUpperCase())}
                                        placeholder="e.g. EURUSD, XAUUSD"
                                        className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/50 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                    />
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {POPULAR_SYMBOLS.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => update('symbol', s)}
                                                className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-all ${form.symbol === s
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]'
                                                    }`}
                                            >
                                                <AssetIcon symbol={s} size="sm" />
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Direction */}
                                <div>
                                    <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5 block">
                                        Direction
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => update('type', 'BUY')}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${form.type === 'BUY'
                                                ? 'bg-green-500/15 text-green-400 border-2 border-green-500/40'
                                                : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border-2 border-transparent hover:border-[var(--border)]'
                                                }`}
                                        >
                                            <TrendingUp className="w-4 h-4" /> BUY / LONG
                                        </button>
                                        <button
                                            onClick={() => update('type', 'SELL')}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${form.type === 'SELL'
                                                ? 'bg-red-500/15 text-red-400 border-2 border-red-500/40'
                                                : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] border-2 border-transparent hover:border-[var(--border)]'
                                                }`}
                                        >
                                            <TrendingDown className="w-4 h-4" /> SELL / SHORT
                                        </button>
                                    </div>
                                </div>

                                {/* Price & Lot Row */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5 block">
                                            Entry
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={form.entryPrice}
                                            onChange={e => update('entryPrice', e.target.value)}
                                            placeholder="1.0850"
                                            className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/50 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5 block">
                                            Exit
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={form.exitPrice}
                                            onChange={e => update('exitPrice', e.target.value)}
                                            placeholder="1.0900"
                                            className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/50 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5 block">
                                            Lot Size
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.quantity}
                                            onChange={e => update('quantity', e.target.value)}
                                            placeholder="0.01"
                                            className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                {/* Status Toggle */}
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                                        Status
                                    </label>
                                    <div className="flex bg-[var(--background-secondary)] rounded-lg p-0.5 border border-[var(--border)]">
                                        <button
                                            onClick={() => update('status', 'CLOSED')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${form.status === 'CLOSED'
                                                ? 'bg-blue-500 text-white'
                                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                                }`}
                                        >
                                            Closed
                                        </button>
                                        <button
                                            onClick={() => update('status', 'OPEN')}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${form.status === 'OPEN'
                                                ? 'bg-blue-500 text-white'
                                                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                                                }`}
                                        >
                                            Open
                                        </button>
                                    </div>
                                </div>

                                {/* Dates (collapsed) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5 block">
                                            Entry Date
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={form.entryDate}
                                            onChange={e => update('entryDate', e.target.value)}
                                            title="Entry date and time"
                                            className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    {form.status === 'CLOSED' && (
                                        <div>
                                            <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-1.5 block">
                                                Exit Date
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={form.exitDate}
                                                onChange={e => update('exitDate', e.target.value)}
                                                title="Exit date and time"
                                                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Partial Closes */}
                                <div className="border border-[var(--border)] rounded-lg p-3 space-y-3">
                                    <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider block">Partial Closes</span>

                                    {/* Pending list */}
                                    {pendingPartialCloses.length > 0 && (
                                        <div className="space-y-1.5">
                                            {pendingPartialCloses.map((pc, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-[var(--foreground)]">{pc.quantity.toFixed(2)} lots</span>
                                                        <span className="text-[var(--foreground-muted)]">@</span>
                                                        <span className="font-mono text-[var(--foreground)]">{pc.exitPrice.toFixed(5)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("font-mono font-semibold", pc.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                                                            {pc.pnl >= 0 ? '+' : ''}${pc.pnl.toFixed(2)}
                                                        </span>
                                                        <button type="button" title="Remove" onClick={() => setPendingPartialCloses(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300">
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add inputs */}
                                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                                        <div>
                                            <label className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-0.5 block">Qty (Lots)</label>
                                            <input
                                                type="number" step="0.01" min="0.01" placeholder="0.50"
                                                value={partialCloseQty || ''}
                                                onChange={(e) => setPartialCloseQty(parseFloat(e.target.value) || 0)}
                                                className="w-full h-8 px-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider mb-0.5 block">Close Price</label>
                                            <input
                                                type="number" step="0.00001" placeholder="1.2345"
                                                value={partialClosePrice || ''}
                                                onChange={(e) => setPartialClosePrice(parseFloat(e.target.value) || 0)}
                                                className="w-full h-8 px-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/50"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            disabled={!partialCloseQty || !partialClosePrice || partialCloseQty <= 0 || partialClosePrice <= 0 || !form.entryPrice}
                                            onClick={() => {
                                                if (partialCloseQty > 0 && partialClosePrice > 0 && form.entryPrice) {
                                                    const result = calculateTradePnL({
                                                        type: form.type,
                                                        entryPrice: parseFloat(form.entryPrice),
                                                        exitPrice: partialClosePrice,
                                                        quantity: partialCloseQty,
                                                        symbol: form.symbol,
                                                    });
                                                    setPendingPartialCloses(prev => [...prev, { quantity: partialCloseQty, exitPrice: partialClosePrice, pnl: result.pnl }]);
                                                    setPartialCloseQty(0);
                                                    setPartialClosePrice(0);
                                                }
                                            }}
                                            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded-md transition-all"
                                        >
                                            ADD
                                        </button>
                                    </div>

                                    {/* Live preview */}
                                    {partialCloseQty > 0 && partialClosePrice > 0 && form.entryPrice && parseFloat(form.entryPrice) > 0 && (() => {
                                        const previewResult = calculateTradePnL({
                                            type: form.type,
                                            entryPrice: parseFloat(form.entryPrice),
                                            exitPrice: partialClosePrice,
                                            quantity: partialCloseQty,
                                            symbol: form.symbol,
                                        });
                                        return (
                                            <div className="flex items-center justify-between text-[10px] text-[var(--foreground-muted)] px-1">
                                                <span>Preview P&L:</span>
                                                <span className={cn("font-mono font-bold", previewResult.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                                                    {previewResult.pnl >= 0 ? '+' : ''}${previewResult.pnl.toFixed(2)}
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Error */}
                                {error && (
                                    <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
                                )}

                                {/* Action */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all
                                        bg-gradient-to-r from-blue-500 to-blue-600 text-white
                                        hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/25
                                        disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Zap className="w-4 h-4" /> Save Trade
                                        </span>
                                    )}
                                </button>

                                <p className="text-center text-xs text-[var(--foreground-muted)]">
                                    You can add details like emotions, strategy & notes later
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
