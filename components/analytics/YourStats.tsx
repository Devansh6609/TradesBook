'use client'

import { cn } from '@/lib/utils'

interface YourStatsProps {
    monthlyStats: {
        bestMonth: { value: number; label: string }
        worstMonth: { value: number; label: string }
        averagePerMonth: number
    }
}

export function YourStats({ monthlyStats }: YourStatsProps) {
    const formatCurrency = (val: number) => {
        return val < 0 ? `-$${Math.abs(val).toFixed(2)}` : `$${val.toFixed(2)}`
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="font-bold text-[var(--foreground)] text-lg">Your Stats</h3>
                <span className="text-xs text-[var(--foreground-muted)] border border-[var(--border)] rounded px-2 py-0.5 ml-2">30 DAYS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Best Month */}
                <div className="bg-[var(--background-tertiary)] p-4 rounded-xl border border-[var(--border)]">
                    <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-1">BEST MONTH</p>
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(monthlyStats?.bestMonth?.value || 0)}</p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">{monthlyStats?.bestMonth?.label || '-'}</p>
                </div>

                {/* Worst Month */}
                <div className="bg-[var(--background-tertiary)] p-4 rounded-xl border border-[var(--border)]">
                    <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-1">WORST MONTH</p>
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(monthlyStats?.worstMonth?.value || 0)}</p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">{monthlyStats?.worstMonth?.label || '-'}</p>
                </div>

                {/* Average */}
                <div className="bg-[var(--background-tertiary)] p-4 rounded-xl border border-[var(--border)]">
                    <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-1">AVERAGE</p>
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(monthlyStats?.averagePerMonth || 0)}</p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">per Month</p>
                </div>
            </div>
        </div>
    )
}
