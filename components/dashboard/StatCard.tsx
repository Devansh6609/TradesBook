import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
    label: string
    value: string | number
    subValue?: string | number
    subLabel?: string
    icon: LucideIcon
    theme?: 'blue' | 'yellow' | 'green' | 'purple' | 'red' | 'default'
    className?: string
    loading?: boolean
}
const themeStyles = {
    blue: {
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-400',
        badgeBg: 'bg-blue-500/10',
        badgeColor: 'text-blue-400',
        border: 'border-blue-500/30',
        glow: 'from-blue-500/5 to-transparent',
    },
    yellow: {
        iconBg: 'bg-yellow-500/10',
        iconColor: 'text-yellow-400',
        badgeBg: 'bg-yellow-500/10',
        badgeColor: 'text-yellow-400',
        border: 'border-yellow-500/20',
        glow: 'from-yellow-500/5 to-transparent',
    },
    green: {
        iconBg: 'bg-green-500/10',
        iconColor: 'text-green-400',
        badgeBg: 'bg-green-500/10',
        badgeColor: 'text-green-400',
        border: 'border-green-500/30',
        glow: 'from-green-500/5 to-transparent',
    },
    purple: {
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-400',
        badgeBg: 'bg-purple-500/10',
        badgeColor: 'text-purple-400',
        border: 'border-purple-500/20',
        glow: 'from-purple-500/5 to-transparent',
    },
    red: {
        iconBg: 'bg-red-500/10',
        iconColor: 'text-red-400',
        badgeBg: 'bg-red-500/10',
        badgeColor: 'text-red-400',
        border: 'border-red-500/30',
        glow: 'from-red-500/5 to-transparent',
    },
    default: {
        iconBg: 'bg-[var(--background-tertiary)]',
        iconColor: 'text-[var(--foreground-muted)]',
        badgeBg: 'bg-[var(--background-tertiary)]',
        badgeColor: 'text-[var(--foreground-muted)]',
        border: 'border-[var(--border)]',
        glow: 'from-blue-500/2 to-transparent',
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
}: StatCardProps) {
    const styles = themeStyles[theme]

    return (
        <div className={cn(
            "hover-card bg-[var(--card-bg)] border rounded-2xl p-6 relative overflow-hidden group",
            styles.border,
            className
        )}>
            {/* Subtle Gradient Background */}
            <div className={cn("absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-40 group-hover:opacity-60", styles.glow)} />

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between mb-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300", styles.iconBg, "group-hover:scale-110")}>
                        <Icon className={cn("w-6 h-6", styles.iconColor)} />
                    </div>
                    {/* Optional Badge Placeholder or Trend Indicator could go here */}
                </div>

                <div>
                    <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-widest mb-1">{label}</p>

                    {loading ? (
                        <div className="h-8 w-24 bg-[var(--background-tertiary)] rounded animate-pulse" />
                    ) : (
                        <p className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                            {value}
                        </p>
                    )}

                    {(subValue || subLabel) && (
                        <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] mt-2 font-medium">
                            {subValue && <span className={styles.iconColor}>{subValue}</span>}
                            {subLabel && <span>{subLabel}</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

