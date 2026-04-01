'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, TradingAccount } from '@/lib/apiClient'

interface AccountContextType {
  accounts: TradingAccount[]
  selectedAccount: TradingAccount | null
  setSelectedAccountId: (id: string) => void
  isLoading: boolean
  refreshAccounts: () => void
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

export function AccountProvider({ children }: { children: ReactNode }) {
  const [selectedAccountId, setSelectedAccountIdState] = useState<string | null>(null)

  const { data: accountsData, isLoading, refetch } = useQuery({
    queryKey: ['trading-accounts'],
    queryFn: () => api.accounts.list(),
    staleTime: 60000, // 1 minute
  })

  const accounts = accountsData?.accounts || []

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedAccountId')
    if (saved) {
      setSelectedAccountIdState(saved)
    }
  }, [])

  // If no selected account but accounts available, select the first one
  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      const firstId = accounts[0].id
      setSelectedAccountIdState(firstId)
      localStorage.setItem('selectedAccountId', firstId)
    }
  }, [accounts, selectedAccountId])

  const setSelectedAccountId = (id: string) => {
    setSelectedAccountIdState(id)
    localStorage.setItem('selectedAccountId', id)
  }

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0] || null

  return (
    <AccountContext.Provider 
      value={{ 
        accounts, 
        selectedAccount, 
        setSelectedAccountId, 
        isLoading,
        refreshAccounts: refetch
      }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider')
  }
  return context
}
