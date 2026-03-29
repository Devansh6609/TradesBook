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
  const { theme, toggleTheme, mounted } = useTheme()
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
    <header className="sticky top-0 z-30 h-16 bg-[var(--header-bg)]/95 backdrop-blur-md border-b border-[var(--border)]">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side - Page title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden p-2"
            title="Open menu"
          >
            <Menu size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">{pageInfo.title}</h1>
            <p className="text-xs text-[var(--foreground-muted)]">{currentDate}</p>
          </div>
        </div>

        {/* Center - Search bar */}
        <div className="hidden md:flex items-center flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-disabled)]"
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-11 pr-16 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-disabled)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-[var(--foreground-disabled)] bg-[var(--background-tertiary)] rounded border border-[var(--border)]">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="hidden sm:flex w-10 h-10 p-0 rounded-full bg-[var(--input-bg)] border border-[var(--border)] hover:bg-[var(--background-tertiary)] transition-all duration-300"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {isMounted ? (
              theme === 'dark' ? (
                <Sun size={18} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon size={18} className="text-blue-600 transition-transform duration-300 hover:-rotate-12" />
              )
            ) : (
              <div className="w-[18px] h-[18px]" />
            )}
          </Button>

          {/* Add Trade Button */}
          <Button
            size="sm"
            className="w-10 h-10 p-0 rounded-full bg-blue-600 hover:bg-blue-700"
            title="Add Trade"
          >
            <Plus size={20} className="text-white" />
          </Button>

          {/* Clock - Only render time on client to prevent hydration mismatch */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg">
            <Clock size={16} className="text-[var(--foreground-disabled)]" />
            <span className="text-sm font-medium text-[var(--foreground-muted)]" suppressHydrationWarning>
              {isMounted && currentTime ? format(currentTime, 'hh:mm:ss a') : '--:--:-- --'}
            </span>
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative w-10 h-10 p-0 rounded-full hover:bg-[var(--background-tertiary)]"
            title="Notifications"
          >
            <Bell size={20} className="text-[var(--foreground-muted)]" />
          </Button>

          {/* User avatar dropdown */}
          <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="w-9 h-9 rounded-full"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <ChevronDown size={16} className="text-[var(--foreground-disabled)] hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  )
}
