'use client'

import React, { useState } from 'react'
import { X, Shield, Cpu, Globe, Key, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/apiClient'
import { useAccount } from '@/contexts/AccountContext'

interface ConnectAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ConnectAccountModal({ isOpen, onClose }: ConnectAccountModalProps) {
  const [platform, setPlatform] = useState<'MT4' | 'MT5'>('MT5')
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    broker: '',
    server: '',
    login: '',
    password: '',
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const { refreshAccounts } = useAccount()

  if (!isOpen) return null

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // In a real app, this would call the API
      // await api.mt5.connect({ ...formData, platform })
      
      // Simulate connection
      await new Promise(r => setTimeout(r, 2000))
      setStep(3)
      refreshAccounts()
    } catch (err) {
      console.error(err)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#0A0C10] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="relative p-8 pb-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Connect Terminal</h2>
            <p className="text-[10px] font-bold text-foreground-disabled uppercase tracking-[0.2em] mt-1">Establishing Secure Neural Link</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="rounded-full w-10 h-10 p-0 hover:bg-white/5 border border-white/5"
          >
            <X size={18} className="text-foreground-disabled" />
          </Button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setPlatform('MT4')}
                  className={cn(
                    "relative p-6 rounded-3xl border transition-all text-left group",
                    platform === 'MT4' ? "bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                    platform === 'MT4' ? "bg-blue-500 text-white" : "bg-white/5 text-foreground-disabled"
                  )}>
                    <Cpu size={20} />
                  </div>
                  <span className="block text-sm font-black text-white uppercase tracking-widest">MetaTrader 4</span>
                  <span className="block text-[9px] font-bold text-foreground-disabled uppercase tracking-widest mt-1">Legacy Protocol</span>
                  {platform === 'MT4' && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                </button>

                <button 
                  onClick={() => setPlatform('MT5')}
                  className={cn(
                    "relative p-6 rounded-3xl border transition-all text-left group",
                    platform === 'MT5' ? "bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                    platform === 'MT5' ? "bg-blue-500 text-white" : "bg-white/5 text-foreground-disabled"
                  )}>
                    <Cpu size={20} />
                  </div>
                  <span className="block text-sm font-black text-white uppercase tracking-widest">MetaTrader 5</span>
                  <span className="block text-[9px] font-bold text-foreground-disabled uppercase tracking-widest mt-1">Next-Gen Engine</span>
                  {platform === 'MT5' && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-widest ml-1">Friendly Account Name</label>
                  <input 
                    type="text" 
                    placeholder="E.G. FTMO CHALLENGE 100K"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-foreground-disabled/30 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-widest ml-1">Broker Name</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground-disabled" />
                    <input 
                      type="text" 
                      placeholder="E.G. IC MARKETS, FTMO..."
                      value={formData.broker}
                      onChange={(e) => setFormData({...formData, broker: e.target.value})}
                      className="w-full pl-12 pr-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-foreground-disabled/30 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.broker}
                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20"
              >
                Continue to Auth
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-widest ml-1">Server Name</label>
                  <input 
                    type="text" 
                    placeholder="E.G. ICMARKETS-LIVE05"
                    value={formData.server}
                    onChange={(e) => setFormData({...formData, server: e.target.value})}
                    className="w-full px-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-foreground-disabled/30 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-widest ml-1">Login (Account ID)</label>
                        <input 
                            type="text" 
                            placeholder="6528192"
                            value={formData.login}
                            onChange={(e) => setFormData({...formData, login: e.target.value})}
                            className="w-full px-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-foreground-disabled/30 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-foreground-disabled uppercase tracking-widest ml-1">Master Password</label>
                        <div className="relative">
                            <Key size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground-disabled" />
                            <input 
                                type="password" 
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full pl-12 pr-5 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-xs font-bold text-white placeholder:text-foreground-disabled/30 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
                            />
                        </div>
                    </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                  <Shield size={20} className="text-amber-500 shrink-0" />
                  <p className="text-[9px] font-bold text-amber-500/80 uppercase tracking-widest leading-relaxed">
                    Credentials are encrypted in transit using AES-256 protocols. We never execute trades on your behalf.
                  </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1 h-14 rounded-2xl border border-white/5 hover:bg-white/5 text-[11px] font-black uppercase tracking-[0.2em]"
                >
                  Back
                </Button>
                <Button 
                   onClick={handleConnect}
                   disabled={!formData.server || !formData.login || !formData.password || isConnecting}
                   className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20"
                >
                  {isConnecting ? "Initiating Protocol..." : `Link ${platform} Account`}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 py-12 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping" />
                    <CheckCircle2 size={48} className="text-blue-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">Terminal Linked</h3>
                    <p className="text-[10px] font-bold text-foreground-disabled uppercase tracking-[0.2em] mt-2">
                        {formData.name} is now active in your dashboard
                    </p>
                </div>
                <Button 
                    onClick={onClose}
                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[11px] font-black uppercase tracking-[0.2em]"
                >
                    Return to Dashboard
                </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
