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
            <h1 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] leading-none mb-1">{pageInfo.title}_Vector</h1>
            <span className="text-[9px] font-bold text-foreground-disabled uppercase tracking-widest">{currentDate}</span>
          </div>
          <div className="h-8 w-px bg-white/5 hidden lg:block" />
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-xl mx-12 hidden md:block">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-disabled group-hover:text-blue-400 transition-colors z-10" />
            <input
              type="text"
              placeholder="Search Global Market Vectors..."
              className="w-full bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl pl-11 pr-16 py-2.5 text-[11px] text-white placeholder:text-foreground-disabled/30 focus:outline-none focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 transition-all relative z-1"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-foreground-disabled uppercase tracking-widest flex items-center gap-1 z-10 group-hover:border-blue-500/30 transition-colors">
              <span className="opacity-50">CTRL</span>
              <span className="text-blue-500">+</span>
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
           {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Add Button */}
          <button 
            className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
            aria-label="Add trade"
            title="Add trade"
          >
            <Plus size={18} />
          </button>

          {/* Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0c0c0c] border border-white/5 rounded-lg">
            <Clock size={14} className="text-zinc-500" />
            <span className="text-xs font-medium text-white tabular-nums">
              {isMounted && currentTime ? format(currentTime, 'HH:mm:ss a') : '00:00:00 AM'}
            </span>
          </div>

          {/* Notifications */}
          <button 
            className="relative p-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={18} />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full border border-black" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/5 ml-1">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
              {user?.image ? (
                <img src={user.image} alt="User" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-[10px] text-white font-bold">
                  DP
                </div>
              )}
            </div>
            <ChevronDown size={14} className="text-zinc-500" />
          </div>
        </div>
      </div>
    </header>
  )
}


