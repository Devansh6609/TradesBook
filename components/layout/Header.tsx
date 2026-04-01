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

import { useAccount } from '@/contexts/AccountContext'
import { ConnectAccountModal } from '@/components/dashboard/ConnectAccountModal'

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth()
  const { selectedAccount, accounts, setSelectedAccountId } = useAccount()
  const pathname = usePathname()
  const { theme, toggleTheme, mounted } = useTheme()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const pageInfo = pageTitles[pathname] || { title: 'Dashboard' }
  const currentDate = format(new Date(), 'EEE, MMM d')

  return (
    <header className="sticky top-0 z-30 h-16 bg-background-secondary/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side - Page title */}
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-white/5"
            title="Open menu"
          >
            <Menu size={20} />
          </Button>
          <div className="hidden sm:block">
            <div className="flex items-center gap-3">
              <h1 className="text-[11px] font-black text-foreground uppercase tracking-[0.4em] leading-none">{pageInfo.title}</h1>
              {selectedAccount && (
                <div className="flex items-center gap-2 px-2.5 py-1 bg-background-tertiary border border-border rounded-lg group hover:border-blue-500/30 transition-all cursor-pointer">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.5)]",
                    selectedAccount.status === 'ACTIVE' ? "bg-blue-500 animate-pulse" : "bg-red-500"
                  )} />
                  <span className="text-[9px] font-black text-foreground-disabled uppercase tracking-widest group-hover:text-foreground transition-colors">
                    {selectedAccount.name || selectedAccount.accountNumber}
                  </span>
                  <ChevronDown size={10} className="text-foreground-disabled group-hover:text-foreground" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] font-black text-foreground-disabled uppercase tracking-[0.2em]">{currentDate}</span>
                <div className="h-1 w-1 rounded-full bg-white/10" />
                <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">London Session</span>
                </div>
            </div>
          </div>
        </div>

        {/* Center - Premium Search bar */}
        <div className="hidden md:flex items-center flex-1 max-w-lg mx-12">
          <div className="relative w-full group">
            <Search
              size={12}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-disabled group-focus-within:text-blue-400 transition-colors"
            />
            <input
              type="text"
              placeholder="QUICK_COMMAND (CTRL+K)"
              className="w-full pl-11 pr-16 py-2 bg-background-tertiary border border-border rounded-xl text-[9px] font-black text-foreground placeholder:text-foreground-disabled/30 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:bg-background-tertiary/80 transition-all uppercase tracking-[0.2em]"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Account Status Badge - Functional */}
          {selectedAccount && (
             <div className="hidden xl:flex flex-col items-end px-4 py-1.5 bg-background-tertiary border border-border rounded-xl">
               <div className="flex items-center gap-2">
                 <span className="text-[11px] font-mono font-black text-foreground leading-none">
                   ${selectedAccount.balance?.toLocaleString()}
                 </span>
                 <div className="w-px h-2 bg-white/10" />
                 <span className={cn(
                   "text-[9px] font-black",
                   selectedAccount.equity >= selectedAccount.balance ? "text-profit-light" : "text-loss-light"
                 )}>
                   {selectedAccount.equity >= selectedAccount.balance ? '+' : ''}
                   {selectedAccount.balance > 0 ? ((selectedAccount.equity / selectedAccount.balance - 1) * 100).toFixed(2) : '0.00'}%
                 </span>
               </div>
               <span className="text-[7px] font-black text-foreground-disabled uppercase tracking-[0.2em] mt-1">EQUITY_REALTIME</span>
             </div>
          )}

          {/* Clock - Digital Terminal Look */}
          <div className="hidden lg:flex flex-col items-end px-4 py-1.5 bg-background-tertiary border border-border rounded-xl">
            <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
                <span className="text-[11px] font-mono font-black text-foreground leading-none" suppressHydrationWarning>
                    {isMounted && currentTime ? format(currentTime, 'HH:mm:ss') : '00:00:00'}
                </span>
            </div>
            <span className="text-[7px] font-black text-foreground-disabled uppercase tracking-[0.2em] mt-1">UTC_REF_01</span>
          </div>

          <div className="flex items-center gap-1 bg-background-tertiary p-1 rounded-2xl border border-border">
              {/* Add Account Modal Trigger */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConnectModal(true)}
                className="w-9 h-9 p-0 rounded-xl hover:bg-white/5"
                title="Connect MT4/MT5"
              >
                <Plus size={16} className="text-foreground-disabled group-hover:text-blue-400" />
              </Button>

              <div className="w-px h-4 bg-white/5 mx-1" />

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-9 h-9 p-0 rounded-xl hover:bg-white/5"
              >
                {isMounted ? (
                  theme === 'dark' ? (
                    <Sun size={14} className="text-amber-400" />
                  ) : (
                    <Moon size={14} className="text-blue-400" />
                  )
                ) : (
                  <div className="w-4 h-4" />
                )}
              </Button>
          </div>

          {/* User avatar - Glass dropdown */}
          <button className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/10 shadow-lg">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="w-8 h-8 rounded-xl"
                />
              ) : (
                <span className="text-white text-[10px] font-black">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      <ConnectAccountModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
    </header>
  )
}
