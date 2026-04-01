'use client'

import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Receipt,
  BookOpen,
  BarChart3,
  TrendingUp,
  LineChart,
  Store,
  Brain,
  FlaskConical,
  Users,
  Wrench,
  Sparkles,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface NavItem {
  name: string
  href?: string
  icon: React.ElementType
  badge?: 'PRO' | 'SOON' | 'NEW'
  children?: NavItem[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Trades', href: '/trades', icon: Receipt },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  {
    name: 'Analysis',
    icon: BarChart3,
    children: [
      { name: 'Performance', href: '/analytics', icon: TrendingUp },
      { name: 'Trade Analysis', href: '/analytics/trade-analysis', icon: LineChart },
    ]
  },
  { name: 'Market', href: '/market', icon: Store },
  { name: 'AI Report', href: '/ai-report', icon: Brain, badge: 'NEW' },
  { name: 'Backtesting', href: '/backtesting', icon: FlaskConical, badge: 'NEW' },
  { name: 'Traders Lounge', href: '/community', icon: Crown, badge: 'NEW' },
  { name: 'Tools', href: '/tools', icon: Wrench },
]

const bottomNavigation: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user: sessionUser, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['Analysis'])

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const isChildActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some(child => isActive(child.href))
    }
    return false
  }

  const renderBadge = (badge?: 'PRO' | 'SOON' | 'NEW') => {
    if (!badge) return null

    const styles = {
      PRO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      SOON: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      NEW: 'bg-green-500/20 text-green-400 border-green-500/30',
    }

    return (
      <span className={cn(
        'ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded border',
        styles[badge]
      )}>
        {badge}
      </span>
    )
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.name)
    const active = item.href ? isActive(item.href) : isChildActive(item)

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300',
              active
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                : 'text-foreground-muted hover:text-foreground hover:bg-white/[0.03] border border-transparent'
            )}
          >
            <Icon size={16} className={cn("transition-colors", active ? "text-blue-400" : "text-foreground-muted")} />
            <span>{item.name}</span>
            <ChevronDown
              size={14}
              className={cn(
                'ml-auto transition-transform duration-500',
                isExpanded && 'rotate-180'
              )}
            />
          </button>
          {isExpanded && (
            <div className="mt-1.5 ml-3 pl-4 border-l border-white/5 space-y-1">
              {item.children?.map(child => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        href={item.href || '#'}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 group',
          active
            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
            : 'text-foreground-muted hover:text-foreground hover:bg-white/[0.03] border border-transparent'
        )}
      >
        <Icon size={16} className={cn("transition-colors group-hover:scale-110", active ? "text-blue-400" : "text-foreground-muted")} />
        <span>{item.name}</span>
        {renderBadge(item.badge)}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileMenu}
          className="p-2"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-background-secondary/60 backdrop-blur-xl border-r border-white/5 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col shadow-[20px_0_40px_rgba(0,0,0,0.5)]',
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-white/5 bg-white/[0.02]">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="relative w-9 h-9 p-1.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Image
                src="/logo.png"
                alt="TradesBook Logo"
                fill
                className="object-contain p-1.5"
                priority
              />
            </div>
            <div className="flex flex-col">
                <span className="font-black text-sm tracking-tight text-foreground leading-none">TRADESBOOK</span>
                <span className="text-[10px] font-bold text-blue-400/80 tracking-[0.2em] leading-tight">TERMINAL</span>
            </div>
          </Link>
        </div>

        {/* User Profile - Premium Compact */}
        <div className="px-4 py-5 border-b border-white/5">
          <div className="group flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 cursor-pointer overflow-hidden relative">
            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles size={8} className="text-amber-400 animate-pulse" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              {sessionUser?.image ? (
                <img
                  src={sessionUser.image}
                  alt={sessionUser.name || 'User'}
                  className="w-10 h-10 rounded-xl"
                />
              ) : (
                <User size={18} className="text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-black text-foreground truncate uppercase tracking-wider">
                  {sessionUser?.name || 'TERMINAL USER'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                    <span className="text-[9px] font-bold text-foreground-muted tracking-widest uppercase">
                        Active Session
                    </span>
                </div>
            </div>
          </div>
        </div>

        {/* Menu Label */}
        <div className="px-4 pt-4 pb-2">
          <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Menu</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => renderNavItem(item))}

          {/* Coming Soon Item */}
          <Link
            href="/coming-soon"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
          >
            <Sparkles size={20} />
            <span>Coming Soon</span>
            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-500/20 text-green-400 border border-green-500/30">
              NEW
            </span>
          </Link>
        </nav>

        {/* Support Section */}
        <div className="border-t border-white/5 bg-white/[0.01]">
          <div className="px-6 pt-4 pb-2 text-[10px] font-black text-foreground-muted uppercase tracking-[0.2em]">
            Support & Config
          </div>
          <div className="px-3 pb-4 space-y-1">
            {bottomNavigation.map((item) => renderNavItem(item))}

            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-loss-light/70 hover:text-loss-light hover:bg-loss/10 border border-transparent hover:border-loss/20 transition-all duration-300 group"
            >
              <LogOut size={16} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Terminate Session</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
