import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import RollingNumber from '@/components/ui/RollingNumber'

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
    const numericValue = (typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ""))) || 0
    const isNegative = numericValue < 0
    const isWinRate = label.toLowerCase().includes('win rate') || label.toLowerCase().includes('success')

    return (
        <div className={cn(
            "relative bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 overflow-hidden group transition-all duration-300 h-full flex flex-col justify-between",
            "hover:bg-[#0f0f0f]",
            styles.border !== 'border-slate-500/10' && styles.border, // Highlighted border for non-default themes
            className
        )}>
            {/* Background Gradient Glow */}
            <div className={cn(
                "absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none",
                styles.glow
            )} />

            <div className="relative z-10">
                {/* Header: Icon and Badge */}
                <div className="flex items-start justify-between mb-6">
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-500",
                        styles.iconBg,
                        styles.iconColor
                    )}>
                        <Icon strokeWidth={2.5} size={18} />
                    </div>
                    
                    {subValue && (
                        <div className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
                            "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        )}>
                            {subValue}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#8E99AE]">
                        {label}
                    </p>
                    
                    <div className="flex items-baseline gap-2">
                        {loading ? (
                            <div className="h-10 w-32 animate-pulse rounded-xl bg-white/5" />
                        ) : (
                            <h3 className={cn(
                                "text-3xl font-extrabold tracking-[-0.03em] text-white",
                                isNegative && "text-loss-light"
                            )}>
                                <RollingNumber 
                                    value={Math.abs(numericValue)} 
                                    prefix={isCurrency ? (numericValue >= 0 ? '+$' : '-$') : ''}
                                    decimalPlaces={isPercentage ? 0 : 2}
                                    suffix={isPercentage ? '%' : ''}
                                    baseColor={isNegative ? 'text-loss-light' : (theme === 'blue' ? 'text-blue-400' : 'text-white')}
                                />
                            </h3>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / Progress */}
            <div className="relative z-10 mt-6">
                {isWinRate ? (
                    <div className="space-y-3">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)] w-[var(--progress-width)]" 
                                style={{ '--progress-width': `${numericValue}%` } as React.CSSProperties}
                            />
                        </div>
                    </div>
                ) : subLabel && (
                    <div className="flex items-center gap-2">
                        <p className={cn(
                            "text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                            theme === 'blue' ? "text-blue-400" : "text-white/30"
                        )}>
                            {subLabel.startsWith('->') ? subLabel : `-> ${subLabel}`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
