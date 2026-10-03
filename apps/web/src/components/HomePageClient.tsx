'use client'

import { useState } from 'react'
import { ProductCard } from './ProductCard'
import { Header } from './Header'
import { AuthModal } from './AuthModal'
import { CartSidebar } from './CartSidebar'
import { ProductSearch } from './ProductSearch'
import CheckoutModal from './CheckoutModal'
import ProductReviews from './ProductReviews'
import OrderHistory from './OrderHistory'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { CartProvider } from '../contexts/CartContext'
import { OrderProvider } from '../contexts/OrderContext'
import { ReviewProvider } from '../contexts/ReviewContext'
import { CurrencyProvider } from '../contexts/CurrencyContext'
import { useProducts } from '../hooks/useProducts'
import { Hero } from './Hero'
import { Footer } from './Footer'
import { Product } from '../types/product'

interface HomePageClientProps {
  initialProducts: Product[]
}

function HomeContent({ initialProducts }: HomePageClientProps) {
  const { isAuthenticated } = useAuth()
  const [zoomedProduct, setZoomedProduct] = useState<string | null>(null)
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login'
  })
  const [searchFilters, setSearchFilters] = useState<{
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: 'name' | 'price' | 'rating' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }>({})
  const { products, loading, error } = useProducts(searchFilters, initialProducts)
  const [checkoutModal, setCheckoutModal] = useState(false)
  const [selectedProductForReview, setSelectedProductForReview] = useState<string | null>(null)
  const [showOrderHistory, setShowOrderHistory] = useState(false)

  const handleProductClick = (productId: string) => {
    setZoomedProduct(productId)
    setSelectedProductForReview(productId)

    window.setTimeout(() => setZoomedProduct(null), 2000)
  }

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModal({ isOpen: true, mode })
  }

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, mode: 'login' })
  }

  const switchAuthMode = (mode: 'login' | 'register') => {
    setAuthModal({ isOpen: true, mode })
  }

  const handleRequireAuth = () => {
    setAuthModal({ isOpen: true, mode: 'login' })
  }

  const openOrderHistory = () => {
    if (!isAuthenticated) {
      handleRequireAuth()
      return
    }

    setShowOrderHistory(true)
    setSelectedProductForReview(null)
    window.setTimeout(() => {
      document.getElementById('order-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const handleOrderHistoryAction = () => {
    if (!isAuthenticated) {
      handleRequireAuth()
      return
    }

    setShowOrderHistory(prev => !prev)
  }

  return (
    <div id="top" className="min-h-screen bg-gray-50 flex flex-col">
      <Header onAuthModalOpen={openAuthModal} onOrderHistoryOpen={openOrderHistory} />

      <div className="flex-grow">
        <Hero />

        <main id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Collection</h2>
            <ProductSearch onFiltersChanged={setSearchFilters} />
          </div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-lg text-gray-600">Loading products...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-center">
              <p className="text-red-600 text-lg">Failed to load products: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-white border border-red-300 text-red-600 rounded hover:bg-red-50"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
                  Showing <span className="font-semibold">{products.length}</span> products
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isZoomed={zoomedProduct === product.id}
                    onClick={() => handleProductClick(product.id)}
                    onRequireAuth={handleRequireAuth}
                  />
                ))}
              </div>
            </>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 max-w-md mx-auto">We couldn&apos;t find any products matching your search. Try adjusting your filters or search terms.</p>
            </div>
          )}

          <div id="features" className="py-12 border-t border-gray-200 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">ShopVibe Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <button
                onClick={() => setCheckoutModal(true)}
                className="group bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-left hover:-translate-y-1"
              >
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <span className="text-2xl group-hover:text-white transition-colors">💳</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Checkout Process</h3>
                <p className="text-sm text-gray-600">Experience our streamlined and secure payment flow designed for speed and safety.</p>
              </button>

              <button
                onClick={() => {
                  if (products.length > 0) {
                    setSelectedProductForReview(products[0].id)
                  }
                }}
                className="group bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-left hover:-translate-y-1"
              >
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                  <span className="text-2xl group-hover:text-white transition-colors">⭐</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Product Reviews</h3>
                <p className="text-sm text-gray-600">Read verified reviews from other customers and share your own experiences.</p>
              </button>

              <button
                onClick={handleOrderHistoryAction}
                className="group bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 text-left hover:-translate-y-1"
              >
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                  <span className="text-2xl group-hover:text-white transition-colors">📦</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Order Management</h3>
                <p className="text-sm text-gray-600">
                  {isAuthenticated
                    ? 'View your order history and track recent purchases.'
                    : 'Sign in to track packages and review your order history.'}
                </p>
              </button>
            </div>
          </div>

          <section id="order-history" className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isAuthenticated
                    ? 'Review recent purchases and track delivery updates.'
                    : 'Sign in to see your past purchases and delivery progress.'}
                </p>
              </div>

              <button
                onClick={showOrderHistory ? () => setShowOrderHistory(false) : openOrderHistory}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {showOrderHistory ? 'Hide orders' : isAuthenticated ? 'View orders' : 'Sign in'}
              </button>
            </div>

            {showOrderHistory ? (
              <OrderHistory />
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                {isAuthenticated
                  ? 'Open your order history to review recent purchases, cancellations, and delivery details.'
                  : 'Use the sign-in button to access order tracking, past purchases, and delivery updates.'}
              </div>
            )}
          </section>

          {selectedProductForReview && (
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100 fixed inset-0 z-50 overflow-y-auto m-4 md:m-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">Product Reviews</h2>
                  <button
                    onClick={() => setSelectedProductForReview(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <ProductReviews productId={selectedProductForReview} />
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />

      <CartSidebar onCheckoutOpen={() => setCheckoutModal(true)} />

      <AuthModal
        isOpen={authModal.isOpen}
        mode={authModal.mode}
        onClose={closeAuthModal}
        onSwitchMode={switchAuthMode}
      />

      <CheckoutModal
        isOpen={checkoutModal}
        onClose={() => setCheckoutModal(false)}
      />
    </div>
  )
}

export default function HomePageClient({ initialProducts }: HomePageClientProps) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <OrderProvider>
            <ReviewProvider>
              <HomeContent initialProducts={initialProducts} />
            </ReviewProvider>
          </OrderProvider>
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  )
}
