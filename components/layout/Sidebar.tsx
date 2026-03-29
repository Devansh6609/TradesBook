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
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              active
                ? 'bg-blue-600/10 text-blue-400'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5'
            )}
          >
            <Icon size={20} />
            <span>{item.name}</span>
            <ChevronDown
              size={16}
              className={cn(
                'ml-auto transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          </button>
          {isExpanded && (
            <div className="mt-1 ml-4 pl-4 border-l border-[var(--border)] space-y-1">
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
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          active
            ? 'bg-blue-600/10 text-blue-400'
            : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5'
        )}
      >
        <Icon size={20} />
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
          'fixed left-0 top-0 z-40 h-screen w-64 bg-[var(--background-secondary)] border-r border-[var(--border)] transition-transform duration-300 flex flex-col',
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 h-16 px-4 border-b border-[var(--border)]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg text-[var(--foreground)]"
          >
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="TradesBook Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="ml-1">TradesBook</span>
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              PRO
            </span>
          </Link>
        </div>

        {/* User Profile */}
        <div className="px-3 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--foreground)]/5 cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              {sessionUser?.image ? (
                <img
                  src={sessionUser.image}
                  alt={sessionUser.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <User size={20} className="text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">
                  {sessionUser?.name || 'User'}
                </p>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-500/20 text-green-400 border border-green-500/30">
                  FREE
                </span>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] truncate">
                {sessionUser?.email}
              </p>
            </div>
            <ChevronDown size={16} className="text-[var(--foreground-muted)]" />
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
        <div className="border-t border-[var(--border)]">
          <div className="px-4 pt-4 pb-2">
            <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Support</span>
          </div>
          <div className="px-3 pb-4 space-y-1">
            {bottomNavigation.map((item) => renderNavItem(item))}

            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all"
            >
              <LogOut size={20} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
