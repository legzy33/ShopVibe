import { useState } from 'react';
import { Product } from '../types/product';
import { formatPrice } from '@shopvibe/shared';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: Product;
  isZoomed: boolean;
  onClick: () => void;
  onRequireAuth?: () => void;
}

export function ProductCard({ product, isZoomed, onClick, onRequireAuth }: ProductCardProps) {
  const { addToCart } = useCart()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the zoom effect
    setFeedback(null)

    try {
      await addToCart({
        productId: product.id,
        quantity: 1,
      })
      setFeedback({ type: 'success', message: 'Added to cart.' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add item to cart.'

      if (message === 'Authentication required') {
        setFeedback({ type: 'error', message: 'Sign in to add items to your cart.' })
        onRequireAuth?.()
        return
      }

      setFeedback({ type: 'error', message })
    }
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden max-w-sm mx-auto w-full hover:shadow-lg transition-all duration-300 cursor-pointer ${isZoomed ? 'transform scale-110 z-10 relative' : ''}`}
      onClick={onClick}
    >
      <div className="aspect-square w-full bg-gray-200 relative">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTUwSDIyNUMyMzAuNTIzIDE1MCAyMzUgMTU0LjQ3NyAyMzUgMTYwVjI0MEMyMzUgMjQ1LjUyMyAyMzAuNTIzIDI1MCAyMjUgMjUwSDE3NUMxNjkuNDc3IDI1MCAxNjUgMjQ1LjUyMyAxNjUgMjQwVjE2MEMxNjUgMTU0LjQ3NyAxNjkuNDc3IDE1MCAxNzUgMTUwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
          }}
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          
          {product.rating && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
              </svg>
              <span className="text-sm text-gray-600">{product.rating}</span>
              {product.reviewCount > 0 && (
                <span className="text-sm text-gray-500">({product.reviewCount})</span>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            product.inStock
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>

        {feedback && (
          <p
            className={`mt-2 text-sm ${
              feedback.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </div>
  );
}
