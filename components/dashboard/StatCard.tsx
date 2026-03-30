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
        border: 'border-blue-500/20',
        glow: 'from-blue-500/10 via-transparent to-transparent',
    },
    yellow: {
        iconBg: 'bg-yellow-500/10',
        iconColor: 'text-yellow-400',
        badgeBg: 'bg-yellow-500/10',
        badgeColor: 'text-yellow-400',
        border: 'border-yellow-500/20',
        glow: 'from-yellow-500/10 via-transparent to-transparent',
    },
    green: {
        iconBg: 'bg-green-500/10',
        iconColor: 'text-green-400',
        badgeBg: 'bg-green-500/10',
        badgeColor: 'text-green-400',
        border: 'border-green-500/20',
        glow: 'from-green-500/10 via-transparent to-transparent',
    },
    purple: {
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-400',
        badgeBg: 'bg-purple-500/10',
        badgeColor: 'text-purple-400',
        border: 'border-purple-500/20',
        glow: 'from-purple-500/10 via-transparent to-transparent',
    },
    red: {
        iconBg: 'bg-red-500/10',
        iconColor: 'text-red-400',
        badgeBg: 'bg-red-500/10',
        badgeColor: 'text-red-400',
        border: 'border-red-500/20',
        glow: 'from-red-500/10 via-transparent to-transparent',
    },
    default: {
        iconBg: 'bg-slate-500/10',
        iconColor: 'text-slate-400',
        badgeBg: 'bg-slate-500/10',
        badgeColor: 'text-slate-400',
        border: 'border-slate-500/10',
        glow: 'from-slate-500/5 via-transparent to-transparent',
    },
}

export function StatCard({
    label,
    value,
    subValue,
    subLabel,
    icon: Icon,
    theme = 'default',
    className,
    loading = false,
    isCurrency = false,
    isPercentage = false,
}: StatCardProps) {
    const styles = themeStyles[theme]
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ""))
    const isNegative = numericValue < 0

    return (
        <div className={cn(
            "premium-card group",
            className
        )}>
            {/* Corner Accent */}
            <div className={cn("absolute top-0 right-0 w-16 h-16 opacity-10 transition-opacity group-hover:opacity-20", 
                theme === 'green' ? "bg-profit" : theme === 'red' ? "bg-loss" : "bg-blue-500")} 
                style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} 
            />

            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110 shadow-lg",
                        styles.iconBg,
                        styles.border
                    )}>
                        <Icon className={cn("h-5 w-5", styles.iconColor)} />
                    </div>
                    {subValue && (
                        <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border", styles.badgeBg, styles.badgeColor, styles.border)}>
                            {subValue}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-disabled flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-foreground-disabled/30" />
                        {label}
                    </p>
                    
                    <div className="flex items-baseline gap-2">
                        {loading ? (
                            <div className="h-10 w-32 animate-pulse rounded-xl bg-white/5" />
                        ) : (
                            <h3 className={cn(
                                "text-3xl font-black tracking-tighter sm:text-4xl",
                                isNegative ? "text-loss-light" : theme === 'green' ? "text-profit-light" : "text-foreground"
                            )}>
                                <NumberTicker 
                                    value={Math.abs(numericValue)} 
                                    decimalPlaces={2}
                                    prefix={isCurrency ? (numericValue < 0 ? '-$' : '$') : ''}
                                    suffix={isPercentage ? '%' : ''}
                                />
                            </h3>
                        )}
                    </div>

                    {subLabel && (
                        <p className="text-[9px] font-bold text-foreground-disabled uppercase tracking-widest mt-1">
                            {subLabel}
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Tech Detail */}
            <div className="absolute bottom-2 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[7px] font-mono text-foreground-disabled/50 ml-2">TECH_ID: {numericValue.toString(16).slice(0, 4).toUpperCase()}</span>
            </div>
        </div>
    )
}


