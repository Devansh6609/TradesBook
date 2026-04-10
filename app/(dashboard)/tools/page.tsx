'use client'

import Link from 'next/link'
import {
    Calculator, Clock, Brain, PlayCircle,
    ArrowRight, Wrench, Sparkles, Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolCardProps {
    title: string
    description: string
    icon: React.ReactNode
    href?: string
    status: 'available' | 'popular' | 'live' | 'coming-soon'
    delay?: number
}

function ToolCard({ title, description, icon, href, status, delay = 0 }: ToolCardProps) {
    const isClickable = status !== 'coming-soon' && href

    const statusBadge = {
        'popular': { text: 'POPULAR', className: 'bg-blue-600 text-white animate-pulse' },
        'live': { text: 'LIVE', className: 'bg-green-600 text-white' },
        'coming-soon': { text: 'COMING SOON', className: 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]' },
        'available': null
    }

    const Wrapper = isClickable ? Link : 'div'
    const wrapperProps = isClickable ? { href } : {}

    return (
        <Wrapper
            {...wrapperProps as any}
            className={cn(
                "bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden group",
                "transition-all duration-300 animate-fade-up",
                isClickable && "hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/15 hover:border-blue-500/40 cursor-pointer",
                !isClickable && "opacity-50 hover:opacity-60"
            )}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:to-transparent transition-all duration-500" />

            {/* Status Badge */}
            {statusBadge[status] && (
                <div className={cn(
                    "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-transform duration-300 group-hover:scale-105",
                    statusBadge[status]?.className
                )}>
                    {statusBadge[status]?.text}
                </div>
            )}

            {/* Icon */}
            <div className="relative w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                {icon}
            </div>

            {/* Content */}
            <h3 className="relative text-lg font-semibold text-[var(--foreground)] mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
            <p className="relative text-sm text-[var(--foreground-muted)] mb-4 group-hover:text-[var(--foreground)] transition-colors">{description}</p>

            {/* Action */}
            {isClickable ? (
                <div className="relative flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-all duration-300">
                    Open Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
            ) : (
                <div className="relative flex items-center text-[var(--foreground-muted)] text-sm">
                    <Sparkles className="w-4 h-4 mr-1 animate-pulse" /> In Development
                </div>
            )}
        </Wrapper>
    )
}

export default function ToolsPage() {
    const tools = [
        {
            title: 'Position Size Calculator',
            description: 'Calculate optimal lot size based on your risk tolerance and stop-loss distance',
            icon: <Calculator className="w-6 h-6 text-blue-400" />,
            href: '/tools/position-calculator',
            status: 'popular' as const
        },
        {
            title: 'Forex Market Hours',
            description: 'Track real-time trading sessions and find the best times to trade forex pairs',
            icon: <Clock className="w-6 h-6 text-blue-400" />,
            href: '/tools/market-hours',
            status: 'live' as const
        },
        {
            title: '20 Pips Challenge',
            description: 'Track and manage your compound growth journey with the 20 pips a day trading challenge.',
            icon: <Target className="w-6 h-6 text-blue-400" />,
            href: '/tools/20-pips-challenge',
            status: 'popular' as const
        },
        {
            title: 'AI Trade Analyser',
            description: 'Get AI-powered analysis and detailed reports on your trading performance',
            icon: <Brain className="w-6 h-6 text-blue-400" />,
            href: '/ai-report',
            status: 'available' as const
        },
        {
            title: 'Demo Trading',
            description: 'Practice trading strategies risk-free with virtual funds',
            icon: <PlayCircle className="w-6 h-6 text-blue-400" />,
            status: 'coming-soon' as const
        },
    ]

    const availableCount = tools.filter(t => t.status !== 'coming-soon').length
    const comingSoonCount = tools.filter(t => t.status === 'coming-soon').length

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 animate-fade-up">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-12">
                        <Wrench className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)]">Trading Tools</h1>
                        <p className="text-[var(--foreground-muted)]">Professional calculators and utilities to enhance your trading workflow</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                    <div className="text-center px-6 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl transition-all duration-300 hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10">
                        <div className="text-2xl font-bold text-blue-400">{availableCount}</div>
                        <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">Available</div>
                    </div>
                    <div className="text-center px-6 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl transition-all duration-300 hover:border-[var(--border-hover)] hover:-translate-y-1">
                        <div className="text-2xl font-bold text-[var(--foreground-muted)]">{comingSoonCount}</div>
                        <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider">Coming Soon</div>
                    </div>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool, i) => (
                    <ToolCard key={i} {...tool} delay={i * 100} />
                ))}
            </div>

            {/* Custom Styles */}
            <style jsx>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-up {
          animation: fade-up 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
        </div>
    )
}
