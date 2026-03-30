'use client'

import { useEffect, useState } from 'react'
import { Newspaper } from 'lucide-react'

const initialNews = [
    "EUR/USD holds steady ahead of ECB decision",
    "Gold prices surge as inflation concerns return",
    "Bitcoin tests key resistance level at $65k",
    "Federal Reserve signals potential rate cuts in Q3",
    "Japancse Yen volatilty continues amidst BOJ rumors",
    "Oil prices dip on inventory build news",
    "S&P 500 reaches new all-time high",
]

export function NewsTicker() {
    const [news] = useState(initialNews)

    return (
        <div className="w-full bg-[#0c0c0c] border border-white/5 rounded-2xl h-11 flex items-center overflow-hidden group">
            <div className="flex items-center px-6 h-full bg-zinc-900 border-r border-white/5 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-3" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] whitespace-nowrap">Market Feed</span>
            </div>

            <div className="flex-1 overflow-hidden relative h-full flex items-center bg-black/20">
                <div className="animate-marquee whitespace-nowrap flex items-center gap-16 text-[11px] font-medium text-zinc-500">
                    {news.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 group/item cursor-default">
                            <span className="text-zinc-700 font-black">/</span>
                            <span className="hover:text-blue-400 transition-colors uppercase tracking-tight">{item}</span>
                        </div>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {news.map((item, i) => (
                        <div key={`dup-${i}`} className="flex items-center gap-3 group/item cursor-default">
                            <span className="text-zinc-700 font-black">/</span>
                            <span className="hover:text-blue-400 transition-colors uppercase tracking-tight">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .animate-marquee {
                    animation: marquee 40s linear infinite;
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

