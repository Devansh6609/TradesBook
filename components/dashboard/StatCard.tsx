'use client'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import NumberTicker from '@/components/ui/NumberTicker'

interface StatCardProps {
    label: string
    value: string | number
    subValue?: string | number
    subLabel?: string
    icon: LucideIcon
    theme?: 'blue' | 'yellow' | 'green' | 'purple' | 'red' | 'default'
    className?: string
    loading?: boolean
    isCurrency?: boolean
    isPercentage?: boolean
}

const themeStyles = {
    blue: {
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-400',
        badgeBg: 'bg-blue-500/10',
        badgeColor: 'text-blue-400',
        border: 'group-hover:border-blue-500/30',
        glow: 'from-blue-500/10 via-transparent to-transparent',
        accent: 'blue-500'
    },
    yellow: {
        iconBg: 'bg-yellow-500/10',
        iconColor: 'text-yellow-400',
        badgeBg: 'bg-yellow-500/10',
        badgeColor: 'text-yellow-400',
        border: 'group-hover:border-yellow-500/30',
        glow: 'from-yellow-500/10 via-transparent to-transparent',
        accent: 'yellow-500'
    },
    green: {
        iconBg: 'bg-green-500/10',
        iconColor: 'text-green-400',
        badgeBg: 'bg-green-500/10',
        badgeColor: 'text-green-400',
        border: 'group-hover:border-green-500/30',
        glow: 'from-green-500/10 via-transparent to-transparent',
        accent: 'green-500'
    },
    purple: {
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-400',
        badgeBg: 'bg-purple-500/10',
        badgeColor: 'text-purple-400',
        border: 'group-hover:border-purple-500/30',
        glow: 'from-purple-500/10 via-transparent to-transparent',
        accent: 'purple-500'
    },
    red: {
        iconBg: 'bg-red-500/10',
        iconColor: 'text-red-400',
        badgeBg: 'bg-red-500/10',
        badgeColor: 'text-red-400',
        border: 'group-hover:border-red-500/30',
        glow: 'from-red-500/10 via-transparent to-transparent',
        accent: 'red-500'
    },
    default: {
        iconBg: 'bg-zinc-500/10',
        iconColor: 'text-zinc-400',
        badgeBg: 'bg-zinc-500/10',
        badgeColor: 'text-zinc-400',
        border: 'group-hover:border-zinc-500/30',
        glow: 'from-zinc-500/5 via-transparent to-transparent',
        accent: 'zinc-500'
    },
}

export function StatCard({
    label,
    value,
    subLabel,
    icon: Icon,
    theme = 'blue',
    className,
    loading = false,
    isCurrency = false,
    isPercentage = false,
}: StatCardProps) {
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ""))
    const isNegative = numericValue < 0

    const styles = themeStyles[theme] || themeStyles.blue

    return (
        <div className={cn(
            "relative overflow-hidden bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 transition-all duration-300 group cursor-default",
            className
        )}>
            <div className="flex items-start justify-between mb-4">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                    styles.iconBg,
                    styles.iconColor
                )}>
                    <Icon size={18} strokeWidth={2} />
                </div>
                {theme === 'blue' && (
                    <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Total</span>
                    </div>
                )}
            </div>

            <div className="space-y-1 mb-6">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
                {loading ? (
                    <div className="h-8 w-32 bg-white/5 animate-pulse rounded" />
                ) : (
                    <div className="flex flex-col">
                        <span className={cn(
                            "text-2xl font-bold tracking-tight",
                            isNegative ? "text-red-500" : "text-white"
                        )}>
                            {isCurrency && (numericValue < 0 ? '-$' : '+$')}
                            {Math.abs(numericValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {isPercentage && '%'}
                        </span>
                        
                        {isPercentage && (
                            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-3">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(Math.max(numericValue, 0), 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {subLabel && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-500 hover:text-blue-400 transition-colors cursor-pointer w-fit group/link">
                   <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
                   <span>{subLabel}</span>
                </div>
            )}
        </div>
    )
}



