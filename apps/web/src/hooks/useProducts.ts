'use client'

import { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { mapApiProduct } from '../services/productTransforms';
import { Product } from '../types/product';

interface UseProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  refetch: () => void;
}

export function useProducts(options: UseProductsOptions = {}, initialProducts: Product[] = []): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseProductsReturn['pagination']>(null);

  const latestRequest = useRef(0);

  const fetchProducts = async () => {
    const requestId = ++latestRequest.current;

    try {
      setLoading(products.length === 0);
      setError(null);
      
      const response = await apiService.getProducts(options);

      // A newer search or page change has superseded this request
      if (requestId !== latestRequest.current) return;
      
      const transformedProducts: Product[] = response.data.map(mapApiProduct);
      
      setProducts(transformedProducts);
      setPagination(response.pagination);
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      console.error('Failed to fetch products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      if (requestId === latestRequest.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    options.page,
    options.limit,
    options.search,
    options.category,
    options.minPrice,
    options.maxPrice,
    options.inStock,
    options.sortBy,
    options.sortOrder,
  ]);

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts,
  };
}

export function useFeaturedProducts(limit = 8) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getFeaturedProducts(limit);
        
        // Transform backend data to frontend format
        const transformedProducts: Product[] = response.data.map(mapApiProduct);
        
        setProducts(transformedProducts);
      } catch (err) {
        console.error('Failed to fetch featured products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch featured products');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, [limit]);

  return { products, loading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getCategories();
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}





