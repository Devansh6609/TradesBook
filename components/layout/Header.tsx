'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell, Plus, Sun, Moon, Clock, ChevronDown, Menu } from 'lucide-react'
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
    <header className="sticky top-0 z-40 h-18 bg-black/40 backdrop-blur-2xl border-b border-white/5 px-6 lg:px-10 transition-all duration-500">
      <div className="flex items-center justify-between h-full max-w-[1700px] mx-auto">
        {/* Left side - Context Info */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col">
            <h1 className="text-sm font-bold text-white tracking-tight leading-none mb-1">{pageInfo.title}</h1>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{currentDate}</span>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-xl mx-12 hidden md:block">
          <div className="relative group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-blue-400 transition-colors z-10" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-[#121212] border border-white/5 rounded-xl pl-11 pr-16 py-2.5 text-[12px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 transition-all relative z-1"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-zinc-900 border border-white/10 rounded-md text-[8px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 z-10 transition-colors">
              <span className="opacity-50">CTRL</span>
              <span className="text-zinc-500">+</span>
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Add Button */}
            <button 
              className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              aria-label="Add trade"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Clock */}
          <div className="hidden xl:flex items-center gap-2.5 px-4 h-9 bg-[#121212] border border-white/5 rounded-xl transition-all hover:border-white/10">
            <Clock size={14} className="text-zinc-500" />
            <span className="text-[11px] font-bold text-white tabular-nums tracking-tighter">
              {isMounted && currentTime ? format(currentTime, 'HH:mm:ss a') : '00:00:00 AM'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Notifications */}
            <button 
              className="relative p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full border-2 border-[#121212]" />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-3 ml-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 overflow-hidden shadow-inner group cursor-pointer hover:border-white/20 transition-all">
                {user?.image ? (
                  <img src={user.image} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-[10px] text-white font-black">
                    DP
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


