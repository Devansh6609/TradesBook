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
    variant?: 'default' | 'hero'
}

const themeStyles = {
    blue: {
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-400',
        badgeBg: 'bg-blue-500/10',
        badgeColor: 'text-blue-400',
        border: 'group-hover:border-blue-500/30',
        glow: 'from-blue-500/10 via-transparent to-transparent',
        accent: 'bg-blue-500',
        text: 'text-blue-400'
    },
    yellow: {
        iconBg: 'bg-yellow-500/10',
        iconColor: 'text-yellow-400',
        badgeBg: 'bg-yellow-500/10',
        badgeColor: 'text-yellow-400',
        border: 'group-hover:border-yellow-500/30',
        glow: 'from-yellow-500/10 via-transparent to-transparent',
        accent: 'bg-yellow-500',
        text: 'text-yellow-400'
    },
    green: {
        iconBg: 'bg-green-500/10',
        iconColor: 'text-green-400',
        badgeBg: 'bg-green-500/10',
        badgeColor: 'text-green-400',
        border: 'group-hover:border-green-500/30',
        glow: 'from-green-500/10 via-transparent to-transparent',
        accent: 'bg-green-500',
        text: 'text-green-400'
    },
    purple: {
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-400',
        badgeBg: 'bg-purple-500/10',
        badgeColor: 'text-purple-400',
        border: 'group-hover:border-purple-500/30',
        glow: 'from-purple-500/10 via-transparent to-transparent',
        accent: 'bg-purple-500',
        text: 'text-purple-400'
    },
    red: {
        iconBg: 'bg-red-500/10',
        iconColor: 'text-red-400',
        badgeBg: 'bg-red-500/10',
        badgeColor: 'text-red-400',
        border: 'group-hover:border-red-500/30',
        glow: 'from-red-500/10 via-transparent to-transparent',
        accent: 'bg-red-500',
        text: 'text-red-400'
    },
    default: {
        iconBg: 'bg-zinc-500/10',
        iconColor: 'text-zinc-400',
        badgeBg: 'bg-zinc-500/10',
        badgeColor: 'text-zinc-400',
        border: 'group-hover:border-zinc-500/30',
        glow: 'from-zinc-500/5 via-transparent to-transparent',
        accent: 'bg-zinc-500',
        text: 'text-zinc-400'
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
    variant = 'default'
}: StatCardProps) {
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ""))
    const isNegative = numericValue < 0
    const styles = themeStyles[theme]

    if (variant === 'hero') {
        return (
            <div className={cn(
                "relative overflow-hidden bg-zinc-950/40 border border-blue-500/10 rounded-[2.5rem] p-9 transition-all duration-700 group cursor-default shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between",
                className
            )}>
                {/* Ambient Blue Logic */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-10">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-all duration-500">
                           <Icon size={24} strokeWidth={2.5} className="text-blue-500 group-hover:rotate-12 transition-transform" />
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="px-3 py-1 bg-white/5 backdrop-blur-md text-white text-[9px] font-black rounded-full border border-white/10 tracking-widest uppercase">LIVE</div>
                             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] leading-none opacity-80">{label}</p>
                        <h2 className="text-[42px] font-black tracking-tighter text-white tabular-nums leading-none">
                            {isCurrency && (isNegative ? '-$' : '+$')}
                            <NumberTicker value={Math.abs(numericValue)} decimalPlaces={2} />
                        </h2>
                        {subLabel && (
                            <div className="flex items-center gap-2 pt-3">
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">{subLabel}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            "relative overflow-hidden bg-zinc-950/30 border border-white/5 rounded-[2rem] p-7 transition-all duration-500 group cursor-default hover:bg-zinc-900/40",
            styles.border,
            className
        )}>
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className={cn(
                    "w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center transition-all duration-500 group-hover:bg-zinc-800",
                    styles.text
                )}>
                    <Icon size={20} strokeWidth={2.5} className="group-hover:rotate-6 transition-transform" />
                </div>
                {isPercentage && (
                     <span className={cn("text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-[0.2em]", styles.badgeBg, styles.badgeColor, styles.border)}>Active</span>
                )}
            </div>

            <div className="space-y-4 relative z-10">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-none mb-2 opacity-80">{label}</span>
                        <h2 className={cn(
                        "text-[32px] font-black tracking-tighter transition-colors duration-500 tabular-nums leading-none",
                        isNegative ? "text-loss-light" : isCurrency ? "text-profit-light" : "text-white"
                    )}>
                        {isCurrency && (isNegative ? '-$' : '+$')}
                        <NumberTicker value={Math.abs(numericValue)} decimalPlaces={2} />
                        {isPercentage && '%'}
                    </h2>
                    
                    {isPercentage && (
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-5 shadow-inner">
                            <div 
                                className={cn("h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_0_10px_rgba(59,130,246,0.3)]", styles.accent)}
                                style={{ width: `${Math.min(Math.max(numericValue, 0), 100)}%` }}
                            />
                        </div>
                    )}
                </div>

                {subLabel && (
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                        {subLabel}
                    </p>
                )}
            </div>

            <div className={cn(
                "absolute -bottom-12 -right-12 w-40 h-40 blur-[60px] rounded-full transition-all duration-1000 opacity-0 group-hover:opacity-[0.03]",
                styles.accent
            )} />
        </div>
    )
}



