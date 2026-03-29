'use client'
// Auth layout: redirect authenticated users to dashboard
// Auth check is now client-side via cookie read (middleware handles the server side)
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

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
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center gap-4">
        <Link href="/" className="flex flex-col items-center gap-2">
          <div className="relative w-16 h-16">
            <Image
              src="/logo.png"
              alt="TradesBook Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            TradesBook
          </h1>
        </Link>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
