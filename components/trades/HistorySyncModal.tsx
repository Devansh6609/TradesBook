'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { History, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

import { api } from '@/lib/apiClient'

interface HistorySyncModalProps {
    isOpen: boolean
    onClose: () => void
}

export function HistorySyncModal({ isOpen, onClose }: HistorySyncModalProps) {
    const queryClient = useQueryClient()
    const [syncType, setSyncType] = useState<'COUNT' | 'ALL'>('COUNT')
    const [count, setCount] = useState('50')
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    const syncMutation = useMutation({
        mutationFn: async () => {
            return api.sync.request({
                type: syncType,
                value: syncType === 'COUNT' ? count : 'ALL',
            })
        },
        onSuccess: () => {
            setStatus('success')
            // Don't close immediately so user sees success state
            setTimeout(() => {
                onClose()
                setStatus('idle')
            }, 2000)
        },
        onError: (error: Error) => {
            setStatus('error')
            setErrorMessage(error.message)
        },
    })

    const handleSync = () => {
        setStatus('idle')
        syncMutation.mutate()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Sync Trading History"
            size="md"
        >
            <div className="space-y-6">
                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Request Sent!</h3>
                            <p className="text-[var(--foreground-muted)] max-w-xs mx-auto mt-2">
                                Your MT5 EA will start sending your history in a few seconds. Refresh the trade list soon.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
                            <History className="w-5 h-5 text-blue-400 shrink-0" />
                            <p className="text-sm text-blue-100/80 leading-relaxed">
                                Syncing history will automatically fetch your past trades from MetaTrader 5 and add them to your dashboard.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-medium text-[var(--foreground-muted)]">Select Sync Mode</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSyncType('COUNT')}
                                    className={cn(
                                        "p-4 rounded-xl border flex flex-col gap-2 transition-all text-left",
                                        syncType === 'COUNT'
                                            ? "bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/50"
                                            : "bg-[var(--background-tertiary)] border-[var(--border)] hover:border-[var(--foreground-disabled)]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                        syncType === 'COUNT' ? "bg-blue-500 text-white" : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
                                    )}>
                                        <History size={18} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">Last N Trades</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">Fetch specific count</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSyncType('ALL')}
                                    className={cn(
                                        "p-4 rounded-xl border flex flex-col gap-2 transition-all text-left",
                                        syncType === 'ALL'
                                            ? "bg-purple-600/10 border-purple-500/50 ring-1 ring-purple-500/50"
                                            : "bg-[var(--background-tertiary)] border-[var(--border)] hover:border-[var(--foreground-disabled)]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                        syncType === 'ALL' ? "bg-purple-500 text-white" : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
                                    )}>
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">Full History</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">Fetch everything</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {syncType === 'COUNT' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--foreground-muted)]">Number of Trades</label>
                                <Input
                                    type="number"
                                    value={count}
                                    onChange={(e) => setCount(e.target.value)}
                                    placeholder="e.g., 50"
                                    className="bg-[var(--background-tertiary)] border-[var(--border)]"
                                />
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-2 items-center text-red-400 text-sm">
                                <AlertCircle size={16} />
                                {errorMessage}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                disabled={syncMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                className={cn(
                                    "gap-2",
                                    syncType === 'COUNT' ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"
                                )}
                                onClick={handleSync}
                                isLoading={syncMutation.isPending}
                            >
                                {syncMutation.isPending ? "Requesting..." : "Start Sync"}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    )
}
