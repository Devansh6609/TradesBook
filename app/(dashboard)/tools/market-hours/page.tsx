'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Sun, Moon, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// Session data (UTC hours) - based on research from Babypips, Capital.com
const sessions = [
    {
        id: 'sydney',
        name: 'Sydney',
        flag: '🇦🇺',
        timezone: 'Australia/Sydney',
        timezoneAbbr: 'AEDT',
        utcOffset: '+11',
        openHourUTC: 21,
        closeHourUTC: 6,
        color: '#10b981', // emerald
    },
    {
        id: 'tokyo',
        name: 'Tokyo',
        flag: '🇯🇵',
        timezone: 'Asia/Tokyo',
        timezoneAbbr: 'JST',
        utcOffset: '+9',
        openHourUTC: 0,
        closeHourUTC: 9,
        color: '#f43f5e', // rose
    },
    {
        id: 'london',
        name: 'London',
        flag: '🇬🇧',
        timezone: 'Europe/London',
        timezoneAbbr: 'GMT',
        utcOffset: '+0',
        openHourUTC: 7,
        closeHourUTC: 16,
        color: '#3b82f6', // blue
    },
    {
        id: 'newyork',
        name: 'New York',
        flag: '🇺🇸',
        timezone: 'America/New_York',
        timezoneAbbr: 'EST',
        utcOffset: '-5',
        openHourUTC: 13,
        closeHourUTC: 22,
        color: '#22c55e', // green
    },
]

// Best trading times
const bestTimes = [
    {
        label: 'HIGHEST VOLUME',
        labelColor: 'bg-blue-600 text-white',
        title: 'London + New York Overlap',
        time: '6:30 pm - 10:30 pm',
        description: 'Maximum liquidity, tightest spreads. Peak at 7:30 pm-9:30 pm. Best for EUR/USD, GBP/USD, USD/JPY.',
        pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
    },
    {
        label: 'LONDON OPEN',
        labelColor: 'bg-green-600 text-white',
        title: 'High Volatility Window',
        time: '1:30 pm - 3:30 pm',
        description: "Day's first major expansion in volatility. Sets directional bias for EUR/GBP crosses.",
        pairs: ['EUR/GBP', 'EUR/USD', 'GBP/JPY'],
    },
    {
        label: 'TOKYO OPEN',
        labelColor: 'bg-amber-500 text-white',
        title: 'Best Asia Window',
        time: '5:30 am - 8:30 am',
        description: 'Strongest Asian session activity. Best for USD/JPY, EUR/JPY, AUD/USD, NZD/USD pairs.',
        pairs: ['USD/JPY', 'AUD/USD', 'NZD/USD'],
    },
]

// Volume pattern
const volumePattern = [
    45, 50, 48, 42, 35, 28, 22, 55, 70, 65, 60, 55,
    50, 85, 100, 95, 80, 65, 55, 45, 40, 48, 42, 40
]

export default function MarketHoursPage() {
    const [is24Hour, setIs24Hour] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Get current position (0-100%)
    const getCurrentTimePosition = () => {
        const hours = currentTime.getUTCHours()
        const minutes = currentTime.getUTCMinutes()
        const seconds = currentTime.getUTCSeconds()
        return ((hours + minutes / 60 + seconds / 3600) / 24) * 100
    }

    // Check if forex market is open
    const isMarketOpen = () => {
        const day = currentTime.getUTCDay()
        const hour = currentTime.getUTCHours()
        if (day === 6) return false
        if (day === 0 && hour < 21) return false
        if (day === 5 && hour >= 22) return false
        return true
    }

    // Check if session is open
    const isSessionOpen = (session: typeof sessions[0]) => {
        const hour = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60
        if (session.openHourUTC > session.closeHourUTC) {
            return hour >= session.openHourUTC || hour < session.closeHourUTC
        }
        return hour >= session.openHourUTC && hour < session.closeHourUTC
    }

    // Format time for timezone
    const formatTime = (tz: string) => {
        try {
            return currentTime.toLocaleTimeString('en-US', {
                timeZone: tz,
                hour: 'numeric',
                minute: '2-digit',
                hour12: !is24Hour,
            })
        } catch { return '--:--' }
    }

    // Format date for timezone
    const formatDate = (tz: string, offset: string) => {
        try {
            const d = currentTime.toLocaleDateString('en-US', {
                timeZone: tz,
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            })
            return `${d} (UTC ${offset})`
        } catch { return '--' }
    }

    // Main time display
    const formatMainTime = () => {
        return currentTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: !is24Hour,
        })
    }

    // Session bar style
    const getBarStyle = (s: typeof sessions[0]) => {
        const start = (s.openHourUTC / 24) * 100
        const end = (s.closeHourUTC / 24) * 100
        if (s.openHourUTC > s.closeHourUTC) {
            return [
                { left: `${start}%`, width: `${100 - start}%` },
                { left: '0%', width: `${end}%` }
            ]
        }
        return [{ left: `${start}%`, width: `${end - start}%` }]
    }

    // Volume SVG
    const volumePath = (() => {
        const pts = volumePattern.map((v, i) => `${(i / 23) * 100},${100 - v}`).join(' L ')
        return `M 0,100 L ${pts} L 100,100 Z`
    })()

    const volumeLine = (() => {
        const pts = volumePattern.map((v, i) => `${(i / 23) * 100},${100 - v}`).join(' L ')
        return `M ${pts}`
    })()

    // Hour labels (showing every 1 hour like TradeFxBook)
    const hourLabels = Array.from({ length: 25 }, (_, i) => i)

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Back Link */}
            <Link href="/tools" className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-6 transition-colors">
                <ArrowLeft size={18} />
                Back to Tools
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center">
                        <Clock className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)]">Forex Market Hours</h1>
                        <p className="text-[var(--foreground-muted)]">Track trading sessions across the globe in real-time</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Toggle */}
                    <div className="flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-full px-3 py-1.5">
                        <span className={cn("text-sm font-medium cursor-pointer", !is24Hour ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]")}
                            onClick={() => setIs24Hour(false)}>12h</span>
                        <button onClick={() => setIs24Hour(!is24Hour)}
                            className={cn("w-10 h-5 rounded-full relative transition-colors", is24Hour ? "bg-blue-600" : "bg-[var(--background-tertiary)]")}
                            aria-label="Toggle format">
                            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all", is24Hour ? "left-5" : "left-0.5")} />
                        </button>
                        <span className={cn("text-sm font-medium cursor-pointer", is24Hour ? "text-[var(--foreground)]" : "text-[var(--foreground-muted)]")}
                            onClick={() => setIs24Hour(true)}>24h</span>
                    </div>

                    {/* Clock */}
                    <div className="bg-blue-600 rounded-xl px-5 py-3 text-white">
                        <div className="flex items-center gap-3">
                            <Clock className="w-6 h-6" />
                            <div>
                                <div className="text-2xl font-bold">{formatMainTime()}</div>
                                <div className="text-xs text-blue-200">{currentTime.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 mb-6">
                {/* Status & Legend */}
                <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium",
                        isMarketOpen() ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                        <span className={cn("w-2.5 h-2.5 rounded-full", isMarketOpen() ? "bg-green-400 animate-pulse" : "bg-red-400")} />
                        {isMarketOpen() ? 'Market Open' : 'Market Closed'}
                    </div>
                    <div className="flex items-center gap-6 text-xs text-[var(--foreground-muted)]">
                        <div className="flex items-center gap-2"><Sun size={16} className="text-amber-400" />Day</div>
                        <div className="flex items-center gap-2"><Moon size={16} className="text-blue-300" />Night</div>
                    </div>
                </div>

                {/* Timeline Container - Everything with the same timeline */}
                <div className="relative">
                    {/* Hour Labels Row */}
                    <div className="flex mb-2">
                        <div className="w-40 flex-shrink-0" />
                        <div className="flex-1 relative h-5">
                            {hourLabels.filter(h => h % 3 === 0 && h < 24).map(hour => (
                                <span
                                    key={hour}
                                    className="absolute text-[10px] text-[var(--foreground-muted)] -translate-x-1/2"
                                    style={{ left: `${(hour / 24) * 100}%` }}
                                >
                                    {is24Hour ? `${hour}:00` : `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Sessions + Volume in single relative container for unified time line */}
                    <div className="relative">
                        {/* SESSION ROWS */}
                        <div className="space-y-3">
                            {sessions.map(session => {
                                const bars = getBarStyle(session)
                                const isOpen = isSessionOpen(session)
                                return (
                                    <div key={session.id} className="flex items-center">
                                        {/* Info */}
                                        <div className="w-40 flex-shrink-0 pr-4">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-lg">{session.flag}</span>
                                                <span className="font-semibold text-[var(--foreground)]">{session.name}</span>
                                            </div>
                                            <div className="text-base font-bold text-[var(--foreground)]">{formatTime(session.timezone)}</div>
                                            <div className="text-[10px] text-[var(--foreground-muted)]">{formatDate(session.timezone, session.utcOffset)}</div>
                                        </div>

                                        {/* Bar */}
                                        <div className="flex-1">
                                            <div className="text-[10px] text-[var(--foreground-muted)] uppercase mb-1">
                                                {session.name} Session <span className={isOpen ? "text-green-400" : ""}>{isOpen ? 'OPEN' : 'CLOSED'}</span>
                                            </div>
                                            <div className="relative h-6 bg-[var(--background-tertiary)] rounded overflow-hidden">
                                                {bars.map((bar, i) => (
                                                    <div
                                                        key={i}
                                                        className="absolute h-full rounded"
                                                        style={{ ...bar, backgroundColor: session.color, opacity: isOpen ? 1 : 0.5 }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Volume Section */}
                        <div className="mt-6 pt-4 border-t border-[var(--border)]">
                            <div className="flex items-center justify-between text-sm text-[var(--foreground-muted)] mb-2">
                                <div>Trading Volume is usually {isMarketOpen() ? 'active' : 'closed'} at this time.</div>
                                <span className={cn("px-2 py-0.5 text-xs rounded", isMarketOpen() ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                    ● {isMarketOpen() ? 'Open' : 'Closed'}
                                </span>
                            </div>
                            <div className="flex">
                                <div className="w-40 flex-shrink-0" />
                                <div className="flex-1 relative h-20 bg-[var(--background-tertiary)] rounded overflow-hidden">
                                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                                                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
                                            </linearGradient>
                                        </defs>
                                        <path d={volumePath} fill="url(#vg)" />
                                        <path d={volumeLine} fill="none" stroke="#22c55e" strokeWidth="0.5" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* GLOBAL CURRENT TIME LINE - spans entire container */}
                        <div
                            className="absolute pointer-events-none z-30"
                            style={{
                                left: `calc(160px + (100% - 160px) * ${getCurrentTimePosition() / 100})`,
                                top: 0,
                                bottom: 0,
                            }}
                        >
                            {/* Main line */}
                            <div
                                className="absolute h-full w-0.5"
                                style={{
                                    background: 'linear-gradient(to bottom, #22c55e, #22c55e)',
                                    boxShadow: '0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.4)',
                                    left: '-1px',
                                }}
                            />
                            {/* Top circle */}
                            <div
                                className="absolute w-3 h-3 rounded-full"
                                style={{
                                    background: '#22c55e',
                                    boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
                                    top: '-6px',
                                    left: '-6px',
                                }}
                            />
                            {/* Bottom circle with time label */}
                            <div
                                className="absolute w-3 h-3 rounded-full"
                                style={{
                                    background: '#22c55e',
                                    boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
                                    bottom: '-6px',
                                    left: '-6px',
                                }}
                            />
                            {/* Time label at bottom */}
                            <div
                                className="absolute whitespace-nowrap text-xs font-medium px-2 py-1 rounded"
                                style={{
                                    background: '#22c55e',
                                    color: 'white',
                                    bottom: '-28px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                }}
                            >
                                {formatMainTime()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Best Times */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">Best Times to Trade</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {bestTimes.map((item, i) => (
                        <div key={i} className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={cn("px-2 py-0.5 text-xs font-bold rounded", item.labelColor)}>{item.label}</span>
                                <span className="text-xs text-[var(--foreground-muted)]">{item.title}</span>
                            </div>
                            <div className="text-lg font-bold text-[var(--foreground)] mb-2">{item.time}</div>
                            <p className="text-sm text-[var(--foreground-muted)] mb-2">{item.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {item.pairs.map(p => (
                                    <span key={p} className="px-2 py-0.5 text-xs bg-[var(--background-tertiary)] text-[var(--foreground-muted)] rounded">{p}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
