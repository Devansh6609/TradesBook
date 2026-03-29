// hooks/useAuth.ts
// Replaces next-auth's useSession — reads user from localStorage/Worker
'use client'
import { useState, useEffect } from 'react'
import { api, type UserProfile } from '@/lib/apiClient'
import { signOut as authSignOut } from '@/lib/auth'

interface AuthState {
  user: UserProfile | null
  isLoading: boolean
}

export function useAuth(): AuthState & { signOut: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true })

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('tradefxbook_access_token')
      : null

    if (!token) {
      setState({ user: null, isLoading: false })
      return
    }

    api.auth.me()
      .then((res) => setState({ user: res.user, isLoading: false }))
      .catch(() => setState({ user: null, isLoading: false }))
  }, [])

  return { ...state, signOut: authSignOut }
}
