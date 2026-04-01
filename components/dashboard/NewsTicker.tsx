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
        <div className="fixed bottom-0 left-0 right-0 h-8 bg-[var(--header-bg)] border-t border-[var(--border)] flex items-center z-50">
            <div className="flex items-center px-4 h-full bg-blue-600 z-10">
                <Newspaper size={14} className="text-white mr-2" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Market News</span>
            </div>

            <div className="flex-1 overflow-hidden relative h-full flex items-center">
                <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-xs text-[var(--foreground-muted)]">
                    {news.map((item, i) => (
                        <span key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {item}
                        </span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {news.map((item, i) => (
                        <span key={`dup-${i}`} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* Inline styles for marquee if not in tailwind.config */}
            <style jsx>{`
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    )
}
