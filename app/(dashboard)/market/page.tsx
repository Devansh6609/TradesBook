'use client'

import { useState } from 'react'
import { Store, Calendar, Newspaper } from 'lucide-react'
import { EconomicCalendar } from '@/components/market/EconomicCalendar'
import { EnhancedNewsList } from '@/components/market/EnhancedNewsList'
import { cn } from '@/lib/utils'

type TabType = 'calendar' | 'news'

export default function MarketPage() {
    const [activeTab, setActiveTab] = useState<TabType>('calendar')

    const tabs = [
        { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
        { id: 'news' as const, label: 'News', icon: Newspaper },
    ]

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 animate-fade-up">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                        <Store className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--foreground)]">Market</h1>
                        <p className="text-[var(--foreground-muted)] text-sm">Economic calendar & live forex news</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-[var(--background-secondary)] rounded-xl mb-6 w-fit animate-fade-up" style={{ animationDelay: '100ms' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-tertiary)]"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
                {activeTab === 'calendar' && <EconomicCalendar />}
                {activeTab === 'news' && <EnhancedNewsList />}
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
                    animation: fade-up 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    )
}
