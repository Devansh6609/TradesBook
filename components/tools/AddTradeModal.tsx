'use client'

import React, { useState } from 'react'
import { 
    X, Plus, Globe, History, Zap, 
    TrendingUp, Shield, Calendar, Layers,
    Calculator, Info, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/apiClient'

interface AddTradeModalProps {
    isOpen: boolean
    onClose: () => void
    defaultAccountId?: string
    accounts: any[]
}

export function AddTradeModal({ isOpen, onClose, defaultAccountId, accounts }: AddTradeModalProps) {
    const [activeTab, setActiveTab] = useState<'manual' | 'sync'>('manual')
    const queryClient = useQueryClient()
    
    // Manual Form State
    const [formData, setFormData] = useState({
        accountId: defaultAccountId || '',
        symbol: '',
        type: 'BUY' as 'BUY' | 'SELL',
        quantity: 0.1,
        entryPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        status: 'OPEN' as 'OPEN' | 'CLOSED',
        exitPrice: 0,
        commission: 0,
        swap: 0,
        entryDate: new Date().toISOString().split('T')[0]
    })

    const [isSyncing, setIsSyncing] = useState(false)
    const [syncStatus, setSyncStatus] = useState<string | null>(null)

    const addTradeMutation = useMutation({
        mutationFn: (data: any) => api.trades.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trades'] })
            queryClient.invalidateQueries({ queryKey: ['fundedAccounts'] })
            onClose()
        }
    })

    const syncMutation = useMutation({
        mutationFn: () => fetch('/api/mt5/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'ALL', value: 'ALL' })
        }),
        onSuccess: () => {
            setIsSyncing(true)
            setSyncStatus('Sync request sent. Waiting for MT5 EA...')
            // In a real app, we'd poll or wait for a websocket
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['trades'] })
                setIsSyncing(false)
                setSyncStatus('Sync complete.')
            }, 3000)
        }
    })

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl" onClick={onClose} />
            
            <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3 uppercase">
                            <Plus className="w-6 h-6 text-blue-500" />
                            Record Trade
                        </h2>
                        <p className="text-xs font-bold text-foreground-disabled/40 uppercase tracking-widest mt-1">Operational Entry Management</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-foreground-disabled" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-white/5 mx-8 mt-8 rounded-2xl gap-2">
                    <button 
                        onClick={() => setActiveTab('manual')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'manual' ? "bg-white/10 text-white shadow-lg" : "text-foreground-disabled/50 hover:text-foreground-disabled"
                        )}
                    >
                        <Layers className="w-4 h-4" /> Manual Entry
                    </button>
                    <button 
                        onClick={() => setActiveTab('sync')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === 'sync' ? "bg-blue-600 text-white shadow-lg" : "text-foreground-disabled/50 hover:text-foreground-disabled"
                        )}
                    >
                        <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} /> MT5 Sync
                    </button>
                </div>

                <div className="p-8 pb-10">
                    {activeTab === 'manual' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground-disabled/40 uppercase tracking-widest px-1">Instrument</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. XAUUSD"
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 px-5 text-sm font-bold focus:border-blue-500/50 outline-none transition-colors"
                                        value={formData.symbol}
                                        onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground-disabled/40 uppercase tracking-widest px-1">Broker Account</label>
                                    <select 
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 px-5 text-sm font-bold focus:border-blue-500/50 outline-none transition-colors appearance-none"
                                        value={formData.accountId}
                                        onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.brokerName} ({acc.accountNumber})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground-disabled/40 uppercase tracking-widest px-1">Position Type</label>
                                    <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 h-14">
                                        <button 
                                            onClick={() => setFormData({ ...formData, type: 'BUY' })}
                                            className={cn(
                                                "flex-1 rounded-xl text-[10px] font-black transition-all",
                                                formData.type === 'BUY' ? "bg-green-500 text-white" : "text-foreground-disabled/30"
                                            )}
                                        >BUY</button>
                                        <button 
                                            onClick={() => setFormData({ ...formData, type: 'SELL' })}
                                            className={cn(
                                                "flex-1 rounded-xl text-[10px] font-black transition-all",
                                                formData.type === 'SELL' ? "bg-red-500 text-white" : "text-foreground-disabled/30"
                                            )}
                                        >SELL</button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground-disabled/40 uppercase tracking-widest px-1">Volume (Lots)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 px-5 text-sm font-bold focus:border-blue-500/50 outline-none transition-colors"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground-disabled/40 uppercase tracking-widest px-1">Entry Price</label>
                                    <input 
                                        type="number" step="0.00001"
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 px-5 text-sm font-bold focus:border-blue-500/50 outline-none transition-colors"
                                        value={formData.entryPrice}
                                        onChange={e => setFormData({ ...formData, entryPrice: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground-disabled/40 uppercase tracking-widest px-1">Stop Loss</label>
                                    <input 
                                        type="number" step="0.00001"
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 px-5 text-sm font-bold focus:border-red-500/50 outline-none transition-colors"
                                        value={formData.stopLoss}
                                        onChange={e => setFormData({ ...formData, stopLoss: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-foreground-disabled/40 uppercase tracking-widest px-1">Take Profit</label>
                                    <input 
                                        type="number" step="0.00001"
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 px-5 text-sm font-bold focus:border-green-500/50 outline-none transition-colors"
                                        value={formData.takeProfit}
                                        onChange={e => setFormData({ ...formData, takeProfit: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <Button 
                                onClick={() => addTradeMutation.mutate(formData)}
                                disabled={addTradeMutation.isPending || !formData.symbol || !formData.accountId}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-16 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[.25em] transition-all"
                            >
                                Commmit Manual Entry
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8 py-10 text-center">
                            <div className="w-24 h-24 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                <History className={cn("w-10 h-10 text-blue-400/40", isSyncing && "animate-pulse")} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-widest">MT5 History Stream</h3>
                                <p className="text-sm text-foreground-disabled/60 font-medium max-w-sm mx-auto leading-relaxed">
                                    Synchronize your entire trade history directly from MetaTrader 5 via the TradesBook EA.
                                </p>
                            </div>

                            {syncStatus && (
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                    {syncStatus}
                                </div>
                            )}

                            <div className="pt-4 space-y-4">
                                <Button 
                                    onClick={() => syncMutation.mutate()}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white h-16 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[.25em] transition-all gap-3"
                                    disabled={isSyncing}
                                >
                                    <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} /> Initialize Global Sync
                                </Button>
                                <p className="text-[9px] font-black text-foreground-disabled/20 uppercase tracking-[.2em]">
                                    Last Sync: {new Date().toLocaleTimeString()}
                                </p>
                            </div>

                            <div className="flex items-start gap-3 p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-left">
                                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Integration Note</p>
                                    <p className="text-[11px] text-foreground-disabled/50 font-medium leading-relaxed">
                                        Ensure your MT5 Terminal is running and the TradesBook EA is active on at least one chart. Your API Key must be correctly configured in the EA inputs.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
