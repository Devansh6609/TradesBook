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
  badge?: 'PRO' | 'SOON' | 'NEW' | 'ELITE'
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
      { name: 'Performance', href: '/analysis/performance', icon: TrendingUp },
      { name: 'Trade Analysis', href: '/analysis/trade-analysis', icon: LineChart },
    ]
  },
  { name: 'Market', href: '/market/calendar', icon: Store },
  { name: 'AI Report', href: '/ai-report', icon: Brain, badge: 'PRO' },
  { name: 'Backtesting', href: '/backtesting', icon: FlaskConical, badge: 'ELITE' },
  { name: 'Traders Lounge', icon: Users, children: [
      { name: 'Community', href: '/community', icon: Users },
      { name: 'Leaderboard', href: '/leaderboard', icon: Crown },
  ]},
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

  const renderBadge = (badge?: 'PRO' | 'SOON' | 'NEW' | 'ELITE') => {
    if (!badge) return null

    const styles = {
      PRO: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      SOON: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      NEW: 'bg-green-500/10 text-green-400 border-green-500/20',
      ELITE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    }

    return (
      <span className={cn(
        'ml-auto px-1.5 py-0.5 text-[8px] font-black rounded border tracking-widest',
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
            key={item.href || item.name}
            href={item.href || '#'}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 group relative overflow-hidden',
              active
                ? 'bg-blue-500/10 text-blue-400'
                : 'text-foreground-muted hover:text-foreground hover:bg-white/[0.03]'
            )}
          >
            {active && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            )}
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
        <div className="flex items-center gap-3 h-20 px-6 border-b border-white/5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="relative w-8 h-8 p-1">
              <Image
                src="/logo.png"
                alt="TradeFXBook Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base tracking-tight text-white leading-none">TradeFXBook</span>
                  <span className="px-1 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded border border-amber-500/20 tracking-tighter">BETA</span>
                </div>
            </div>
          </Link>
        </div>
        {/* User Profile - Premium Compact */}
        <div className="px-4 py-6">
          <div className="group/user p-3 rounded-2xl transition-all duration-500 bg-zinc-900/30 border border-white/5 hover:border-blue-500/20 relative">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-black shadow-lg">
                  PB
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#090909]" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-white tracking-widest uppercase truncate">Patel</span>
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">FREE</span>
                </div>
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter truncate">Trader_ID_042</span>
              </div>
              <div className="ml-auto opacity-0 group-hover/user:opacity-100 transition-opacity">
                <Settings size={12} className="text-zinc-600 hover:text-blue-400 cursor-pointer" />
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
