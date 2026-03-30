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
                "relative overflow-hidden bg-[#0c0c0c] border border-blue-500/20 rounded-[2rem] p-8 transition-all duration-700 group cursor-default shadow-[0_0_50px_rgba(59,130,246,0.1)]",
                className
            )}>
                {/* Massive Blue Ambient Glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-inner group-hover:scale-110 transition-all duration-500">
                           <Icon size={22} className="text-blue-400 group-hover:rotate-6 transition-transform" />
                        </div>
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black rounded-lg border border-blue-500/20 tracking-widest uppercase">TOTAL</span>
                    </div>

                    <div className="mt-auto space-y-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] leading-none">{label}</p>
                        <h2 className="text-4xl font-black tracking-tighter text-white font-mono flex items-baseline gap-1">
                            {isCurrency && (isNegative ? '-$' : '+$')}
                            <NumberTicker value={Math.abs(numericValue)} decimalPlaces={2} />
                        </h2>
                        {subLabel && (
                            <div className="flex items-center gap-2 pt-2 text-blue-500/60 group-hover:text-blue-400 transition-colors cursor-pointer">
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">→ {subLabel}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            "relative overflow-hidden bg-[#0c0c0c] border border-white/5 rounded-[2rem] p-7 transition-all duration-500 group cursor-default",
            styles.border,
            className
        )}>
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className={cn(
                    "w-11 h-11 rounded-1.5xl bg-zinc-900/50 border border-white/5 flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                    styles.text
                )}>
                    <Icon size={20} strokeWidth={2.5} className="group-hover:rotate-6 transition-transform" />
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] leading-none mb-3">{label}</span>
                        <h2 className={cn(
                        "text-3xl font-black tracking-tighter transition-colors duration-500 font-mono",
                        isNegative ? "text-red-500" : "text-white"
                    )}>
                        {isCurrency && (isNegative ? '-$' : '+$')}
                        <NumberTicker value={Math.abs(numericValue)} decimalPlaces={2} />
                        {isPercentage && '%'}
                    </h2>
                    
                    {isPercentage && (
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-4 border border-white/5 p-0.5">
                            <div 
                                className={cn("h-full rounded-full transition-all duration-1000 ease-out", styles.accent)}
                                style={{ width: `${Math.min(Math.max(numericValue, 0), 100)}%` }}
                            />
                        </div>
                    )}
                </div>

                {subLabel && (
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight opacity-60 group-hover:opacity-100 transition-opacity">
                        {subLabel}
                    </p>
                )}
            </div>

            <div className={cn(
                "absolute -bottom-10 -right-10 w-32 h-32 blur-3xl rounded-full transition-all duration-1000 opacity-0 group-hover:opacity-10",
                styles.accent
            )} />
        </div>
    )
}



