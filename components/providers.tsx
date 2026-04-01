'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AccountProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AccountProvider>
    </QueryClientProvider>
  )
}

import { AccountProvider } from '@/contexts/AccountContext'


