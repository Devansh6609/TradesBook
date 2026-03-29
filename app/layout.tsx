import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TradesBook - Trading Journal',
  description: 'Track, analyze, and improve your trading performance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#191e2b',
            color: '#f8fafc',
            border: '1px solid #2a3143',
          }
        }} />
      </body>
    </html>
  )
}
