'use client'

import { useState, useEffect } from 'react'
import { apiService, ApiError } from '../services/api'
import { AuthUser, LoginCredentials, RegisterCredentials } from '../types/user'

interface UseAuthReturn {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  error: string | null
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!user

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const token = localStorage.getItem('authToken')
        if (!token) {
          setIsLoading(false)
          return
        }

        // Verify token with backend
        const response = await apiService.getCurrentUser()
        
        const authUser: AuthUser = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          avatar: response.user.avatar,
        }
        
        setUser(authUser)
      } catch (err) {
        console.error('Session check failed:', err)
        // Only clear the token when the server rejects it; keep it if the API is just unreachable
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem('authToken')
        }
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiService.login({
        email: credentials.email,
        password: credentials.password,
      })
      
      // Store token
      localStorage.setItem('authToken', response.token)
      
      // Set user data
      const authUser: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        avatar: response.user.avatar,
      }
      
      setUser(authUser)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Client-side validation
      if (credentials.password !== credentials.confirmPassword) {
        throw new Error('Passwords do not match')
      }
      
      if (credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      
      const response = await apiService.register({
        name: credentials.name,
        email: credentials.email,
        password: credentials.password,
      })
      
      // Store token
      localStorage.setItem('authToken', response.token)
      
      // Set user data
      const authUser: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        avatar: response.user.avatar,
      }
      
      setUser(authUser)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      
      // Clear token and user data
      localStorage.removeItem('authToken')
      setUser(null)
      setError(null)
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    error,
  }
}





























