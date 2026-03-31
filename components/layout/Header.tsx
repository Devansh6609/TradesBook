'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell, Plus, Sun, Moon, Clock, ChevronDown, Menu, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
import { format } from 'date-fns'

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Dashboard' },
  '/trades': { title: 'Trades' },
  '/journal': { title: 'Journal' },
  '/analytics': { title: 'Analytics' },
  '/accounts': { title: 'Accounts' },
  '/settings': { title: 'Settings' },
  '/market': { title: 'Market' },
  '/ai-report': { title: 'AI Report' },
  '/backtesting': { title: 'Backtesting' },
  '/tools': { title: 'Tools' },
}

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const pageInfo = pageTitles[pathname] || { title: 'Dashboard' }
  const currentDate = format(new Date(), 'EEE, MMM d')

  return (
    <header className="sticky top-0 z-40 h-20 bg-background/40 backdrop-blur-3xl border-b border-white/5 px-8 lg:px-12 transition-all duration-500">
      <div className="flex items-center justify-between h-full w-full mx-auto">
        {/* Left side - Context Info */}
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <h1 className="text-[17px] font-black text-white tracking-widest uppercase leading-none mb-2">{pageInfo.title}</h1>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] opacity-60">{currentDate}</span>
            </div>
          </div>
        </div>

        {/* Center - Search Bar Area */}
        <div className="flex-1 max-w-2xl mx-16 hidden md:block">
          <div className="relative group">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-blue-500 transition-all duration-500 z-10" />
            <input
              type="text"
              placeholder="Search for metrics, trades, or tools..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-16 py-3 text-[11px] font-medium text-white placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.04] transition-all duration-500 relative z-1"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-zinc-900/50 border border-white/10 rounded-lg text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1 z-10 opacity-40 group-hover:opacity-100 transition-opacity">
              <span className="text-[7px]">CTRL</span>
              <span className="text-zinc-600">/</span>
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-500 group"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon size={18} className="group-hover:rotate-[360deg] transition-transform duration-700" /> : <Sun size={18} />}
            </button>

            {/* Quick Add Button */}
            <button 
              className="flex items-center justify-center w-11 h-11 bg-blue-600 rounded-2xl text-white hover:bg-blue-500 transition-all duration-500 shadow-xl shadow-blue-600/20 active:scale-90 group"
              aria-label="Add trade"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>

          {/* Clock Widget */}
          <div className="hidden xl:flex items-center gap-3 px-5 h-11 bg-white/[0.02] border border-white/5 rounded-2xl transition-all duration-500 hover:border-white/10 hover:bg-white/[0.04] group">
            <Clock size={15} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
            <span className="text-[12px] font-black text-white tabular-nums tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">
              {isMounted && currentTime ? format(currentTime, 'HH:mm:ss a') : '00:00:00 AM'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button 
              className="relative p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-500"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <div className="absolute top-3.5 right-3.5 w-1.5 h-1.5 bg-blue-500 rounded-full border-2 border-background animate-pulse" />
            </button>

            {/* Help & Support */}
            <button 
              className="p-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-500"
              aria-label="Help"
            >
              <HelpCircle size={18} />
            </button>

            {/* User Profile Mini */}
            <div className="flex items-center gap-2 pl-6 ml-2 border-l border-white/10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 overflow-hidden shadow-2xl group cursor-pointer hover:border-blue-500/30 transition-all duration-500 p-0.5">
                {user?.image ? (
                  <img src={user.image} alt="User" className="w-full h-full object-cover rounded-[10px]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-[10px] text-[10px] text-white font-black">
                    PB
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}


