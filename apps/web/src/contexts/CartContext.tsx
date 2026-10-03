'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Cart, AddToCartPayload, UpdateCartItemPayload } from '../types/cart'
import { apiService } from '../services/api'
import { useAuth } from './AuthContext'

interface CartContextType {
  cart: Cart
  addToCart: (payload: AddToCartPayload) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateCartItem: (payload: UpdateCartItemPayload) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
  clearError: () => void
  isOpen: boolean
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  isLoading: boolean
  error: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const createEmptyCart = (): Cart => ({
  id: 'cart-1',
  items: [],
  totalItems: 0,
  subtotal: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  updatedAt: new Date(),
})

const mapApiCart = (response: Awaited<ReturnType<typeof apiService.getCart>>): Cart => ({
  id: 'cart-1',
  items: response.cart.items.map(item => ({
    id: item.id,
    product: {
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      price: item.product.price,
      imageUrl: item.product.imageUrl,
      category: item.product.category,
      inStock: item.product.inStock,
      rating: item.product.rating,
      reviewCount: item.product.reviewCount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    },
    quantity: item.quantity,
    selectedVariant: item.variant,
    addedAt: new Date(item.createdAt),
  })),
  totalItems: response.cart.summary.itemCount,
  subtotal: response.cart.summary.subtotal,
  tax: response.cart.summary.tax,
  shipping: response.cart.summary.shipping,
  total: response.cart.summary.total,
  updatedAt: new Date(),
})

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [cart, setCart] = useState<Cart>(createEmptyCart())
  
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshCart = async () => {
    const response = await apiService.getCart()
    setCart(mapApiCart(response))
  }

  // Fetch cart from backend when user is authenticated
  useEffect(() => {
    const fetchCart = async () => {
      if (!isAuthenticated || authLoading) {
        // Reset cart when not authenticated
        setCart(createEmptyCart())
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        await refreshCart()
      } catch (err) {
        console.error('Failed to fetch cart:', err)
        setError(err instanceof Error ? err.message : 'Failed to load cart')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCart()
  }, [isAuthenticated, authLoading])

  const addToCart = async (payload: AddToCartPayload) => {
    if (!isAuthenticated) {
      setError('Please login to add items to cart')
      throw new Error('Authentication required')
    }

    try {
      setIsLoading(true)
      setError(null)
      
      await apiService.addToCart(payload.productId, payload.quantity, payload.variant)
      await refreshCart()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromCart = async (itemId: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required')
    }

    try {
      setIsLoading(true)
      setError(null)
      
      await apiService.removeCartItem(itemId)
      await refreshCart()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateCartItem = async (payload: UpdateCartItemPayload) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required')
    }

    if (payload.quantity <= 0) {
      await removeFromCart(payload.itemId)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      await apiService.updateCartItem(payload.itemId, payload.quantity)
      await refreshCart()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cart item'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async () => {
    if (!isAuthenticated) {
      throw new Error('Authentication required')
    }

    try {
      setIsLoading(true)
      setError(null)
      
      await apiService.clearCart()
      
      // Reset cart state
      setCart(createEmptyCart())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCart = () => setIsOpen(prev => !prev)
  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const clearError = () => setError(null)

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    refreshCart,
    clearError,
    isOpen,
    toggleCart,
    openCart,
    closeCart,
    isLoading,
    error,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
} 