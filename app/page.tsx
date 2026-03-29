'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  BarChart3, 
  Brain, 
  RefreshCw, 
  Users, 
  FlaskConical, 
  Shield, 
  Zap,
  Check,
  ChevronRight,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function Home() {
  const [isYearly, setIsYearly] = useState(true)

  const features = [
    {
      title: 'Advanced Analytics',
      description: 'Go beyond P&L. Track expectancy, profit factor, and R-multiples for every strategy.',
      icon: BarChart3,
      color: 'blue'
    },
    {
      title: 'AI Trade Reports',
      description: 'Get personalized insights on your trading habits. Our AI identifies your leaks automatically.',
      icon: Brain,
      color: 'purple'
    },
    {
      title: 'Automated Sync',
      description: 'Sync your MT4/MT5 accounts in seconds. No more manual entry of trades.',
      icon: RefreshCw,
      color: 'green'
    },
    {
      title: 'Community Lounge',
      description: 'Share your performance and learn from top traders in our private verified community.',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Backtesting Engine',
      description: 'Replay markets bar-by-bar and test your strategies with institution-grade data.',
      icon: FlaskConical,
      color: 'amber'
    },
    {
      title: 'Risk Management',
      description: 'Plan your trades with our integrated risk calculator. Never blow an account again.',
      icon: Shield,
      color: 'red'
    }
  ]

  const pricing = [
    {
      name: 'Free',
      price: '0',
      description: 'Perfect for beginners starting their journey.',
      features: [
        'Manual trade entry',
        'Basic analytics',
        'Up to 15 trades/month',
        'Social community access',
        'Public profile'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Pro',
      price: isYearly ? '14.99' : '19.99',
      description: 'The standard for serious retail traders.',
      features: [
        'Automated MT4/MT5 sync',
        'AI Trade Analysis (3/mo)',
        'Unlimited trade logs',
        'Custom tagging system',
        'Ad-free experience'
      ],
      cta: 'Go Pro',
      popular: true
    },
    {
      name: 'Master',
      price: isYearly ? '44.99' : '59.99',
      description: 'For institutional-grade performance.',
      features: [
        'Everything in Pro',
        'Unlimited AI Reports',
        'Backtesting Engine',
        'VIP Priority Support',
        'Institutional API access'
      ],
      cta: 'Join Master',
      popular: false
    }
  ]

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-[#020617]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              TradesBook
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
            <a href="#community" className="hover:text-blue-400 transition-colors">Community</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8">
              <Zap size={14} fill="currentColor" />
              <span>THE NEXT GENERATION OF TRADERS IS HERE</span>
            </div>
            <h1 className="text-6xl sm:text-8xl font-black tracking-tight mb-8">
              Analyze. Optimize.<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600">
                Master the Markets.
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              TradesBook is the professional-grade trading journal that identifies your leaks automatically. 
              Sync your accounts, get AI insights, and join the elite.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button className="h-14 px-10 text-lg bg-blue-600 hover:bg-blue-500 rounded-full group">
                  Get Started Free
                  <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="ghost" className="h-14 px-10 text-lg rounded-full text-slate-300 hover:text-white border border-slate-800">
                <Play className="mr-2 fill-current" size={18} />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-20 pt-8 border-t border-slate-800/50">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">
                Trusted by 2,000+ serious traders worldwide
              </p>
              <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale group hover:grayscale-0 transition-all duration-500">
                <div className="text-2xl font-bold">MetaTrader 5</div>
                <div className="text-2xl font-bold">cTrader</div>
                <div className="text-2xl font-bold">Binance</div>
                <div className="text-2xl font-bold">Interactive Brokers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-slate-900/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Scale</h2>
            <p className="text-slate-400">Built by traders who wanted better data.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 transition-all duration-300">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                    feature.color === 'blue' && "bg-blue-500/10 text-blue-400",
                    feature.color === 'purple' && "bg-purple-500/10 text-purple-400",
                    feature.color === 'green' && "bg-green-500/10 text-green-400",
                    feature.color === 'amber' && "bg-amber-500/10 text-amber-400",
                    feature.color === 'red' && "bg-red-500/10 text-red-400",
                  )}>
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-8">Professional Plans</h2>
            
            <div className="flex items-center justify-center gap-4">
              <span className={cn("text-sm transition-colors", !isYearly ? "text-white" : "text-slate-500")}>Monthly</span>
              <button 
                onClick={() => setIsYearly(!isYearly)}
                className="w-14 h-8 rounded-full bg-slate-800 p-1 flex items-center transition-all"
                aria-label="Toggle yearly pricing"
              >
                <div className={cn(
                  "w-6 h-6 rounded-full bg-blue-500 transition-all shadow-lg",
                  isYearly ? "translate-x-6" : "translate-x-0"
                )} />
              </button>
              <span className={cn("text-sm transition-colors", isYearly ? "text-white" : "text-slate-500")}>
                Yearly <span className="text-green-500 ml-1 font-bold">(-25%)</span>
              </span>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {pricing.map((plan, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "relative p-10 rounded-[32px] border transition-all duration-300",
                  plan.popular 
                    ? "bg-gradient-to-b from-blue-600/10 to-transparent border-blue-500/50 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]" 
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-500 text-white text-xs font-bold uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">${plan.price}</span>
                    <span className="text-slate-500">/mo</span>
                  </div>
                  <p className="text-slate-400 mt-4 text-sm">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-10">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                      <div className="mt-1 w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-blue-500" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                
                <Button className={cn(
                  "w-full h-14 rounded-2xl text-lg font-bold transition-all",
                  plan.popular 
                    ? "bg-blue-600 hover:bg-blue-500 text-white" 
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                )}>
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative w-8 h-8">
                  <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="text-lg font-bold">TradesBook</span>
              </div>
              <p className="text-slate-500 max-w-sm">
                Built for traders by traders. The only journal that works as hard as you do.
              </p>
            </div>
            <div className="flex gap-12 text-sm text-slate-400">
              <div className="flex flex-col gap-4">
                <span className="font-bold text-white uppercase tracking-widest text-xs">Product</span>
                <a href="#features" className="hover:text-blue-400">Features</a>
                <a href="#pricing" className="hover:text-blue-400">Pricing</a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="font-bold text-white uppercase tracking-widest text-xs">Legal</span>
                <Link href="/privacy" className="hover:text-blue-400">Privacy</Link>
                <Link href="/terms" className="hover:text-blue-400">Terms</Link>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-slate-900 text-center text-slate-600 text-sm">
            © 2026 TradesBook. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
