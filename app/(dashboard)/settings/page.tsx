'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User, Bell, Shield, Wallet, Monitor, Trash2,
  Save, AlertTriangle, CheckCircle, Smartphone,
  Target, BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { api } from '@/lib/apiClient'

interface Settings {
  id: string
  // Privacy
  publicProfile: boolean
  showOnLeaderboard: boolean
  showTrades: boolean
  shareAnalytics: boolean

  // Trading
  currency: string
  timezone: string
  showPnlPerTrade: boolean
  showTotalPnl: boolean
  showWinRate: boolean
  showTradeCount: boolean

  // Appearance
  theme: string

  // Notifications
  pushNotifications: boolean
  tradeAlerts: boolean
  weeklyReports: boolean

  // Balance
  accountBalance: number
}

const SECTIONS = [
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'trading', label: 'Trading Preferences', icon: Wallet },
  { id: 'appearance', label: 'Appearance', icon: Monitor },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Data Management', icon: Trash2, className: 'text-red-400' },
]

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState('privacy')
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false)
  const [clearConfirmation, setClearConfirmation] = useState('')

  // Fetch Settings
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      return api.settings.get()
    }
  })

  // Update Settings Mutation
  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<Settings>) => {
      return api.settings.update(newSettings as any)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  })

  // Clear Data Mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      return api.settings.clearData()
    },
    onSuccess: () => {
      setIsClearDataModalOpen(false)
      setClearConfirmation('')
      window.location.reload()
    }
  })

  const updateSetting = (key: keyof Settings, value: any) => {
    mutation.mutate({ [key]: value })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-[var(--foreground-muted)] animate-pulse">Synchronizing Terminal Settings...</p>
        </div>
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'privacy':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-obsidian rounded-3xl p-8 space-y-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">Privacy & Security</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Manage your visibility and data sharing</p>
                </div>
              </div>

              <div className="grid gap-6">
                {[
                  { key: 'publicProfile', label: 'Public Profile', desc: 'Allow others to view your trading profile page', icon: User },
                  { key: 'showOnLeaderboard', label: 'Show on Leaderboard', desc: 'Appear in the public trading leaderboard rank', icon: Target },
                  { key: 'showTrades', label: 'Show Individual Trades', desc: 'Let others see your detailed trade execution history', icon: Monitor },
                  { key: 'shareAnalytics', label: 'Share Analytics', desc: 'Allow sharing of your performance statistics', icon: BarChart3 }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <item.icon className="w-5 h-5 text-[var(--foreground-muted)] group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{item.label}</p>
                        <p className="text-sm text-[var(--foreground-muted)]">{item.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings?.[item.key as keyof Settings] as boolean ?? false}
                      onCheckedChange={(checked) => updateSetting(item.key as keyof Settings, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'trading':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-obsidian rounded-3xl p-8 space-y-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <Wallet className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">Trading Preferences</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Configure your terminal and account defaults</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-widest pl-1">Primary Currency</label>
                  <div className="relative group">
                    <Select
                      value={settings?.currency || 'USD'}
                      onChange={(val) => updateSetting('currency', val)}
                      className="w-full bg-black/40 border-white/10 rounded-2xl py-3 pl-4 pr-10 focus:border-purple-500/50 transition-all hover:bg-black/60"
                      options={[
                        { value: 'USD', label: 'USD - United States Dollar' },
                        { value: 'EUR', label: 'EUR - Euro' },
                        { value: 'GBP', label: 'GBP - British Pound' },
                        { value: 'JPY', label: 'JPY - Japanese Yen' },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-widest pl-1">Starting Balance</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-bold">$</div>
                    <input
                      type="number"
                      value={settings?.accountBalance || 0}
                      onChange={(e) => updateSetting('accountBalance', parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-[var(--foreground)] focus:outline-none focus:border-purple-500/50 transition-all hover:bg-black/60"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-8 border-t border-white/5">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Dashboard Metrics</h3>
                <div className="grid gap-4">
                  {[
                    { key: 'showPnlPerTrade', label: 'P&L Per Trade', desc: 'Display profit/loss on each individual trade record' },
                    { key: 'showTotalPnl', label: 'Cumulative P&L', desc: 'Show your total net performance across all trades' },
                    { key: 'showWinRate', label: 'Win Percentage', desc: 'Track your winning ratio on the main dashboard' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] hover:border-white/[0.08] transition-all">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{item.label}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">{item.desc}</p>
                      </div>
                      <Switch
                        checked={settings?.[item.key as keyof Settings] as boolean ?? true}
                        onCheckedChange={(checked) => updateSetting(item.key as keyof Settings, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-obsidian rounded-3xl p-8 space-y-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                  <Monitor className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">Appearance</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Customize the look and feel of your workspace</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/20 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] translate-x-10 -translate-y-10 group-hover:bg-blue-500/20 transition-all" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-[var(--foreground)] text-lg">Stealth Terminal</p>
                      <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white uppercase">ACTIVE</div>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)] mb-4">The signature pitch-black obsidian theme with deep blue accents.</p>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="w-full h-full bg-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 relative group opacity-60">
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                      <p className="font-bold text-[var(--foreground)] text-lg">Frosted Light</p>
                      <p className="text-sm text-[var(--foreground-muted)]">A clean, high-clarity light theme for focused day sessions.</p>
                    </div>
                    <div className="mt-4">
                      <span className="text-[10px] font-bold text-amber-500 uppercase px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">COMING SOON</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Smartphone className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--foreground)]">Streamer Mode</p>
                    <p className="text-sm text-[var(--foreground-muted)]">Automatically masks sensitive account balances for content creators</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold py-2">
                  SOON
                </Button>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-obsidian rounded-3xl p-8 space-y-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                  <Bell className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--foreground)]">Notifications</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Stay synchronized with your trade execution flow</p>
                </div>
              </div>

              <div className="grid gap-4">
                {[
                  { key: 'pushNotifications', label: 'Master Sync', desc: 'Main toggle for all browser-level notifications' },
                  { key: 'tradeAlerts', label: 'Trade Execution Alerts', desc: 'Get notified instantly when an order fills or closes on MT5' },
                  { key: 'weeklyReports', label: 'Performance Recaps', desc: 'Receive a weekly automated breakdown of your P&L clusters' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.01] border border-white/[0.03] hover:border-yellow-500/20 transition-all group">
                    <div>
                      <p className="font-bold text-[var(--foreground)] group-hover:text-yellow-400 transition-colors uppercase text-sm tracking-wide">{item.label}</p>
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">{item.desc}</p>
                    </div>
                    <Switch
                      checked={settings?.[item.key as keyof Settings] as boolean ?? false}
                      onCheckedChange={(checked) => updateSetting(item.key as keyof Settings, checked)}
                      className={activeSection === 'notifications' ? 'group-hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]' : ''}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'data':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-obsidian rounded-3xl p-8 space-y-8 border-red-500/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
                  <p className="text-sm text-[var(--foreground-muted)] font-medium">Irreversible account operations</p>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-red-500/[0.02] border border-red-500/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-[40px] translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                <div className="relative z-10">
                  <h4 className="font-extrabold text-[var(--foreground)] text-lg mb-2">Wipe Trading History</h4>
                  <p className="text-sm text-[var(--foreground-muted)] mb-8 max-w-md leading-relaxed">
                    This will permanently excise all trades, journal entries, strategy data, and performance statistics from our servers.
                    <span className="text-red-400 font-bold block mt-2">Caution: This action is permanent and atomic.</span>
                  </p>
                  <Button
                    variant="danger"
                    onClick={() => setIsClearDataModalOpen(true)}
                    className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 hover:border-red-600 rounded-2xl px-8 py-4 font-bold transition-all shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]"
                  >
                    Clear All Terminal Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8">
      <div className="flex flex-col md:flex-row gap-12 mt-8">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">Settings</h1>
              <p className="text-[var(--foreground-muted)] font-medium pl-1">MT5 Terminal Node v1.0.4</p>
            </div>

            <nav className="flex flex-col gap-2">
              {SECTIONS.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-4 px-6 py-4 rounded-3xl text-left transition-all duration-300 relative group",
                      isActive
                        ? "bg-blue-600/10 text-white border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
                        : "text-[var(--foreground-muted)] hover:bg-white/[0.03] hover:text-white"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                      isActive ? "bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-white/5"
                    )}>
                      <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[var(--foreground-muted)] group-hover:text-white", section.className)} />
                    </div>
                    <span className="font-bold tracking-wide uppercase text-xs">{section.label}</span>
                    {isActive && (
                      <div className="absolute right-6 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,1)]" />
                    )}
                  </button>
                )
              })}
            </nav>

            <div className="glass-obsidian rounded-3xl p-6 border-white/5 mt-4 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all">
                  <CheckCircle className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-xs font-bold text-amber-500 tracking-widest uppercase">System Status</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                  <span>MT5 Sync</span>
                  <span className="text-green-400">Stable</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">
                  <span>Journal Node</span>
                  <span className="text-green-400">Online</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                  <div className="w-3/4 h-full bg-amber-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 min-w-0">
          <div className="max-w-3xl">
            {renderSection()}
          </div>
        </div>
      </div>

      {/* Clear Data Modal */}
      <Modal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        title="Account Extraction Confirmation"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
            <p className="text-sm text-red-100/80 leading-relaxed font-medium">
              This will permanently purge <strong>all trading data</strong>. Strategy configurations and journal entries will be unrecoverable.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-red-400 uppercase tracking-widest pl-1">
              Confirm Authorization
            </label>
            <input
              type="text"
              value={clearConfirmation}
              onChange={(e) => setClearConfirmation(e.target.value)}
              className="w-full bg-black/60 border border-red-500/20 rounded-2xl px-6 py-4 text-[var(--foreground)] focus:outline-none focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-all font-mono tracking-tighter"
              placeholder="TYPE 'DELETE' TO CONFIRM"
            />
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <Button
              variant="danger"
              disabled={clearConfirmation !== 'DELETE' || clearDataMutation.isPending}
              onClick={() => clearDataMutation.mutate()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-900/20 disabled:grayscale transition-all"
            >
              {clearDataMutation.isPending ? 'PURGING DATA...' : 'PERFORM ACCOUNT WIPE'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsClearDataModalOpen(false)}
              className="w-full text-[var(--foreground-muted)] font-bold hover:text-white"
            >
              Abort Operation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
