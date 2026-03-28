'use client'
// Auth layout: redirect authenticated users to dashboard
// Auth check is now client-side via cookie read (middleware handles the server side)
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // If token cookie exists, user is already logged in → go to dashboard
    const hasToken = document.cookie.includes('tradefxbook_access_token')
    if (hasToken) {
      router.replace('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="relative w-16 h-16">
          <img src="/logo.png" alt="TradesBook" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
          TradesBook
        </h1>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
