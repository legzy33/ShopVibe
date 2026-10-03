'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import CurrencySelector from './CurrencySelector'
import { useCart } from '../contexts/CartContext'

interface HeaderProps {
  onAuthModalOpen: (mode: 'login' | 'register') => void
  onOrderHistoryOpen?: () => void
}

export function Header({ onAuthModalOpen, onOrderHistoryOpen }: HeaderProps) {
  const { isAuthenticated, user, logout } = useAuth()
  const { cart, toggleCart } = useCart()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="#top" className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                ShopVibe
              </span>
            </a>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#products" className="text-gray-600 hover:text-gray-900 transition-colors">
              Products
            </a>
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#order-history" className="text-gray-600 hover:text-gray-900 transition-colors">
              Orders
            </a>
            <a href="#footer" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </a>
          </nav>

          {/* Right side - Currency, Auth & Cart */}
          <div className="flex items-center space-x-4">
            {/* Currency Selector */}
            <CurrencySelector />
            {isAuthenticated ? (
              /* User Menu */
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="hidden sm:inline">{user?.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-xs text-gray-500">
                      Signed in as
                      <div className="mt-1 truncate font-medium text-gray-700">{user?.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        onOrderHistoryOpen?.()
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Order history
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={async () => {
                        setShowUserMenu(false)
                        await logout()
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Auth Buttons */
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onAuthModalOpen('login')}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Sign in
                </button>
                <button
                  onClick={() => onAuthModalOpen('register')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Sign up
                </button>
              </div>
            )}

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13l-2.7-7M7 13h10M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              
              {cart.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
} 