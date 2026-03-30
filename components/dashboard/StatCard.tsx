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
    theme = 'default',
    className,
    loading = false,
    isCurrency = false,
    isPercentage = false,
}: StatCardProps) {
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ""))
    const isNegative = numericValue < 0

    const styles = themeStyles[theme]

    return (
        <div className={cn(
            "relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-6 transition-all duration-500 group cursor-default",
            styles.border,
            className
        )}>
            {/* Ambient Background Glow */}
            <div className={cn(
                "absolute -inset-0.5 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-700",
                styles.glow
            )} />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-10 h-10 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                        styles.iconColor
                    )}>
                        <Icon size={18} strokeWidth={2.5} className="group-hover:rotate-6 transition-transform" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-foreground-disabled/60 uppercase tracking-[0.2em] leading-none mb-1">{label}</span>
                        <div className="h-0.5 w-4 bg-blue-500/30 rounded-full group-hover:w-8 transition-all" />
                    </div>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {loading ? (
                    <div className="h-10 w-32 bg-white/5 animate-pulse rounded-lg" />
                ) : (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className={cn(
                                "text-3xl font-black tracking-tighter transition-colors duration-500 font-mono",
                                isNegative ? "text-red-500" : "text-white"
                            )}>
                                {isCurrency && (numericValue < 0 ? '-$' : '$')}
                                <NumberTicker 
                                    value={Math.abs(numericValue)} 
                                    decimalPlaces={2}
                                />
                                {isPercentage && '%'}
                            </span>
                        </div>
                        {isPercentage && (
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1 border border-white/5">
                                <div 
                                    className={cn("h-full transition-all duration-1000 ease-out", styles.iconBg.replace('/10', ''))}
                                    style={{ width: `${Math.min(Math.max(numericValue, 0), 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}
                {subLabel && (
                    <div className="flex items-center gap-2 pt-1">
                        <div className="w-0.5 h-3 rounded-full bg-blue-500/50 group-hover:bg-blue-500 transition-colors" />
                        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em] group-hover:text-zinc-400 transition-colors">{subLabel}</span>
                    </div>
                )}
            </div>

            {/* Subtle Corner Glow */}
            <div className={cn(
                "absolute -top-12 -right-12 w-32 h-32 blur-3xl rounded-full transition-all duration-1000 opacity-20 group-hover:opacity-40",
                `bg-${styles.accent}`
            )} />
        </div>
    )
}



