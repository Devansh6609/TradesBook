'use client'
// Dashboard layout: redirect unauthenticated users to login
// Auth check is client-side since output:'export' disallows server-side headers
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Providers } from '@/components/providers'
import { QuickTradeButton } from '@/components/trades/QuickTradeButton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const hasToken = document.cookie.includes('tradefxbook_access_token')
    if (!hasToken) {
      router.replace('/login')
    }
  }, [router])

  return (
    <Providers>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:ml-64 min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 p-4 lg:p-6 overflow-auto bg-background">
            {children}
          </main>
        </div>
        <QuickTradeButton />
      </div>
    </Providers>
  )
}
