'use client'

import { CURRENCY_SYMBOLS } from '@shopvibe/shared'
import { useCurrency } from '../contexts/CurrencyContext'
import { useState, useEffect, useMemo } from 'react'
import { useCategories } from '../hooks/useProducts'

interface ProductSearchProps {
  onFiltersChanged: (filters: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: 'name' | 'price' | 'rating' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) => void
}

interface SearchFilters {
  query: string
  category: string
  minPrice: number
  maxPrice: number
  inStockOnly: boolean
  sortBy: 'name' | 'price' | 'rating' | 'createdAt'
  sortOrder: 'asc' | 'desc'
}

export function ProductSearch({ onFiltersChanged }: ProductSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    minPrice: 0,
    maxPrice: 1000,
    inStockOnly: false,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const [showFilters, setShowFilters] = useState(false)
  const { currency } = useCurrency()
  const { categories, loading: categoriesLoading } = useCategories()

  // Convert internal filters to API format and notify parent
  const apiFilters = useMemo(() => {
    const result: Record<string, string | number | boolean> = {}
    
    if (filters.query) result.search = filters.query
    if (filters.category) result.category = filters.category
    if (filters.minPrice > 0) result.minPrice = filters.minPrice
    if (filters.maxPrice < 1000) result.maxPrice = filters.maxPrice
    if (filters.inStockOnly) result.inStock = true
    result.sortBy = filters.sortBy
    result.sortOrder = filters.sortOrder

    return result
  }, [filters])

  // Notify parent when filters change
  useEffect(() => {
    onFiltersChanged(apiFilters)
  }, [apiFilters, onFiltersChanged])

  const handleFilterChange = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      minPrice: 0,
      maxPrice: 1000,
      inStockOnly: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  }

  const hasActiveFilters = filters.query || filters.category || 
    filters.minPrice > 0 || filters.maxPrice < 1000 || filters.inStockOnly

  return (
    <div className="mb-10 max-w-4xl mx-auto">
      {/* Search Bar Container */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex gap-4 bg-white p-2 rounded-xl shadow-lg">
          <div className="flex-1 relative flex items-center">
            <svg className="absolute left-4 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for products, brands and more..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-500 text-lg"
            />
          </div>

          <div className="border-l border-gray-200 my-2"></div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all font-medium ${
              showFilters || hasActiveFilters 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="ml-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Filter Products</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={categoriesLoading}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{CURRENCY_SYMBOLS[currency]}</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleFilterChange('minPrice', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg pl-6 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <span className="text-gray-400">-</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{CURRENCY_SYMBOLS[currency]}</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice === 1000 ? '' : filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value) || 1000)}
                    className="w-full border border-gray-300 rounded-lg pl-6 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-')
                  handleFilterChange('sortBy', sortBy as SearchFilters['sortBy'])
                  handleFilterChange('sortOrder', sortOrder as SearchFilters['sortOrder'])
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="rating-desc">Rating (High to Low)</option>
                <option value="rating-asc">Rating (Low to High)</option>
              </select>
            </div>

            {/* Stock Filter */}
            <div className="flex items-center h-full pt-6">
              <label className="relative flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={filters.inStockOnly}
                  onChange={(e) => handleFilterChange('inStockOnly', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">In stock only</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
