'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth as useAuthHook } from '../hooks/useAuth'
import { LoginCredentials, RegisterCredentials, AuthUser } from '../types/user'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  loginWithGoogle: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const authHook = useAuthHook()

  const loginWithGoogle = async () => {
    // For now, just throw an error since we don't have Google OAuth set up
    throw new Error('Google login not yet implemented')
  }

  const value: AuthContextType = {
    user: authHook.user,
    isLoading: authHook.isLoading,
    isAuthenticated: authHook.isAuthenticated,
    login: authHook.login,
    register: authHook.register,
    logout: authHook.logout,
    loginWithGoogle,
    error: authHook.error,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 