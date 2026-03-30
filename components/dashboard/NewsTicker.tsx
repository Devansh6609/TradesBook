'use client'

import { useEffect, useState } from 'react'

const initialEvents = [
    { time: '14:30', currency: 'USD', flag: '🇺🇸', event: 'CPI m/m', impact: 'H' },
    { time: '15:15', currency: 'EUR', flag: '🇪🇺', event: 'ECB Rate Decision', impact: 'H' },
    { time: '16:00', currency: 'GBP', flag: '🇬🇧', event: 'BoE Gov Bailey Speaks', impact: 'M' },
    { time: '18:30', currency: 'CAD', flag: '🇨🇦', event: 'Unemployment Rate', impact: 'M' },
    { time: '21:00', currency: 'JPY', flag: '🇯🇵', event: 'BoJ Outlook Report', impact: 'L' },
    { time: '02:30', currency: 'AUD', flag: '🇦🇺', event: 'Retail Sales m/m', impact: 'M' },
]

export function NewsTicker() {
    const [events] = useState(initialEvents)

    return (
        <div className="w-full bg-[#0c0c0c] border border-white/5 rounded-2xl h-12 flex items-center overflow-hidden group shadow-2xl">
            <div className="flex items-center px-6 h-full bg-[#121212] border-r border-white/5 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-4 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] whitespace-nowrap">Economic_Calendar</span>
            </div>

            <div className="flex-1 overflow-hidden relative h-full flex items-center">
                <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-[11px] font-medium">
                    {events.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 group/item cursor-default">
                            <span className="text-zinc-700 font-bold tracking-tighter">{item.time}</span>
                            <span className="text-lg">{item.flag}</span>
                            <span className="text-zinc-500 font-black uppercase tracking-tight group-hover/item:text-white transition-colors">{item.currency}</span>
                            <span className="text-white/80 font-bold group-hover/item:text-blue-400 transition-colors">{item.event}</span>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest",
                                item.impact === 'H' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                item.impact === 'M' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                                "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            )}>
                                {item.impact}
                            </span>
                        </div>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {events.map((item, i) => (
                        <div key={`dup-${i}`} className="flex items-center gap-4 group/item cursor-default">
                            <span className="text-zinc-700 font-bold tracking-tighter">{item.time}</span>
                            <span className="text-lg">{item.flag}</span>
                            <span className="text-zinc-500 font-black uppercase tracking-tight group-hover/item:text-white transition-colors">{item.currency}</span>
                            <span className="text-white/80 font-bold group-hover/item:text-blue-400 transition-colors">{item.event}</span>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest",
                                item.impact === 'H' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                item.impact === 'M' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                                "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            )}>
                                {item.impact}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

