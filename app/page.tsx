import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image 
                  src="/logo.png" 
                  alt="TradesBook Logo" 
                  fill 
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                TradesBook
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
              <a href="#analytics" className="hover:text-blue-400 transition-colors">Analytics</a>
              <a href="#testimonials" className="hover:text-blue-400 transition-colors">Traders</a>
              <a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-4">
              <a href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2">
                Sign In
              </a>
              <a href="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Ambient Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-blue-900/20 blur-[120px] rounded-full -z-10 opacity-50" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full -z-10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Trusted by 2,000+ traders
          </div>
          
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight mb-8 leading-[1.1]">
            Master Your<br />
            <span className="text-blue-500">Trading</span> Journal
          </h1>
          
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            The professional grade trading journal that does the work for you. 
            Import your history, analyze your edge, and grow your equity curve with 
            data-driven insights. Built for serious traders.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a
              href="/register"
              className="w-full sm:w-auto px-10 py-4 bg-white text-black font-bold rounded-full transition-all hover:bg-blue-50 hover:scale-105 active:scale-95 shadow-xl"
            >
              Start Journaling Now
            </a>
            <div className="text-sm font-medium text-slate-500">
              No credit card required
            </div>
          </div>

          {/* Dashboard Preview Image Placeholder/Mockup */}
          <div className="mt-20 relative px-4 lg:px-0">
            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] -z-10 translate-y-20 max-w-4xl mx-auto rounded-[40px]" />
            <div className="max-w-6xl mx-auto rounded-[32px] overflow-hidden border border-white/10 shadow-2xl p-4 bg-slate-900/50 backdrop-blur-xl">
              <div className="aspect-video relative rounded-2xl overflow-hidden bg-slate-950 border border-white/5">
                <div className="absolute inset-0 flex items-center justify-center text-slate-800 font-bold text-4xl">
                  Dashboard Analytics Preview
                  {/* We can use generate_image later for a dashboard screenshot if needed */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 italic">Built for Performance</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Stop guessing and start measuring. TradesBook gives you the metrics that matter.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Seamless Automation',
                description: 'Import your trades via CSV or API from major brokers like MetaTrader, TradingView, and Bybit instantly.',
                icon: '⚡'
              },
              {
                title: 'Advanced Analytics',
                description: 'Deep dive into your performance with R-multiple analysis, expectancy, and strategy-based tracking.',
                icon: '📊'
              },
              {
                title: 'Market Replay',
                description: 'Revisit your trades with interactive charts. See exactly what you saw at the moment of execution.',
                icon: '🕒'
              },
              {
                title: 'Strategic Insights',
                description: 'Identify your best-performing symbols, sessions, and setups with our proprietary scoring system.',
                icon: '🎯'
              },
              {
                title: 'Risk Management',
                description: 'Monitor your drawdown and leverage usage. Develop consistent risk habits for long-term survival.',
                icon: '🛡️'
              },
              {
                title: 'AI Trading Buddy',
                description: 'Get automated feedback on your journaling consistency and setup performance via TradesBook AI.',
                icon: '🤖'
              }
            ].map((feature) => (
              <div key={feature.title} className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/[0.07] transition-all">
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-20 border-t border-white/5 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-3 mb-8">
            <div className="relative w-8 h-8">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="text-xl font-bold">TradesBook</span>
          </div>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            The ultimate companion for every serious trader aiming for consistency and funded status.
          </p>
          <div className="flex justify-center gap-8 text-slate-500 text-sm mb-12">
            <a href="#" className="hover:text-blue-500 transition-colors">Twitter</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Discord</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Instagram</a>
          </div>
          <div className="text-slate-600 text-xs">
            © 2026 TradesBook. Build for Traders, by Traders.
          </div>
        </div>
      </footer>
    </main>
  )
}

