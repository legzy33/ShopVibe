'use client'

import { useCart } from '../contexts/CartContext'
import { TAX_LABEL, calculateOrderTotals, formatPrice } from '@shopvibe/shared'
import { useCurrency } from '../contexts/CurrencyContext'

interface CartSidebarProps {
  onCheckoutOpen?: () => void
}

export function CartSidebar({ onCheckoutOpen }: CartSidebarProps = {}) {
  const { cart, isOpen, closeCart, removeFromCart, updateCartItem, error, clearError } = useCart()
  const { currency, rate } = useCurrency()

  // Same calculation the API uses when the order is created, in the selected currency
  const totals = calculateOrderTotals(
    cart.items.map(item => ({ price: item.product.price, quantity: item.quantity })),
    rate
  )

  if (!isOpen) return null

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateCartItem({ itemId, quantity: newQuantity })
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Shopping Cart ({cart.totalItems})</h2>
          <button
            onClick={closeCart}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-start justify-between gap-3">
                <span>{error}</span>
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Dismiss cart error"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {cart.items.length === 0 ? (
            /* Empty Cart */
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13l-2.7-7M7 13h10M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6">Start shopping to fill it up!</p>
              <button
                onClick={closeCart}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            /* Cart Items */
            <div className="p-4 space-y-4">
              {cart.items.map((item, index) => (
                <div key={item.id} className="flex gap-4 border-b pb-4">
                  {/* Product Image */}
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {item.product.description}
                    </p>
                    
                    {/* Variant Info */}
                    {item.selectedVariant && (
                      <div className="mt-1 text-xs text-gray-500">
                        {item.selectedVariant.size && `Size: ${item.selectedVariant.size}`}
                        {item.selectedVariant.color && ` • Color: ${item.selectedVariant.color}`}
                      </div>
                    )}
                    
                    {/* Price and Quantity */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="font-medium min-w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium">{formatPrice(totals.lines[index].lineTotal, currency)}</div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-gray-500">{formatPrice(totals.lines[index].unitPrice, currency)} each</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary - only show if cart has items */}
        {cart.items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Shipping Notice */}
            {totals.amountToFreeShipping > 0 && (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                Add {formatPrice(totals.amountToFreeShipping, currency)} more for free shipping!
              </div>
            )}
            
            {/* Order Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(totals.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>{TAX_LABEL}</span>
                <span>{formatPrice(totals.tax, currency)}</span>
              </div>
              <div className="flex justify-between font-medium text-base border-t pt-2">
                <span>Total</span>
                <span>{formatPrice(totals.total, currency)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button 
              onClick={onCheckoutOpen}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
} 