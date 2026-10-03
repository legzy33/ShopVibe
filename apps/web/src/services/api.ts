// API service for connecting frontend to backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new ApiError(errorData.error || `HTTP error! status: ${response.status}`, response.status);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Product API methods
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: 'name' | 'price' | 'rating' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        description: string;
        price: number;
        imageUrl: string;
        category: string;
        inStock: boolean;
        rating: number;
        reviewCount: number;
        createdAt: string;
        updatedAt: string;
        _count: { reviews: number };
      }>;
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
      filters: any;
    }>(endpoint);
  }

  async getProduct(id: string) {
    return this.request<{
      success: boolean;
      data: {
        id: string;
        name: string;
        description: string;
        price: number;
        imageUrl: string;
        category: string;
        inStock: boolean;
        rating: number;
        reviewCount: number;
        createdAt: string;
        updatedAt: string;
        reviews: Array<{
          id: string;
          rating: number;
          comment: string;
          createdAt: string;
          user: {
            id: string;
            name: string;
            avatar: string;
          };
        }>;
        _count: { reviews: number };
      };
    }>(`/api/products/${id}`);
  }

  async getCategories() {
    return this.request<{
      success: boolean;
      data: string[];
    }>('/api/products/categories');
  }

  async getFeaturedProducts(limit = 8) {
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        name: string;
        description: string;
        price: number;
        imageUrl: string;
        category: string;
        inStock: boolean;
        rating: number;
        reviewCount: number;
        createdAt: string;
        updatedAt: string;
        _count: { reviews: number };
      }>;
    }>(`/api/products/featured?limit=${limit}`);
  }

  // Authentication API methods
  async register(userData: {
    name: string;
    email: string;
    password: string;
  }) {
    return this.request<{
      message: string;
      user: {
        id: string;
        name: string;
        email: string;
        avatar: string;
        createdAt: string;
      };
      token: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }) {
    return this.request<{
      message: string;
      user: {
        id: string;
        name: string;
        email: string;
        avatar: string;
        createdAt: string;
      };
      token: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // User profile methods
  async getCurrentUser() {
    return this.request<{
      success: boolean;
      user: {
        id: string;
        name: string;
        email: string;
        avatar: string;
        createdAt: string;
      };
    }>('/api/users/me');
  }

  // Cart API methods
  async getCart() {
    return this.request<{
      success: boolean;
      cart: {
        items: Array<{
          id: string;
          productId: string;
          product: {
            id: string;
            name: string;
            description: string;
            price: number;
            imageUrl: string;
            category: string;
            inStock: boolean;
            rating: number;
            reviewCount: number;
          };
          quantity: number;
          variant: any;
          subtotal: number;
          createdAt: string;
          updatedAt: string;
        }>;
        summary: {
          itemCount: number;
          subtotal: number;
          tax: number;
          shipping: number;
          total: number;
        };
      };
    }>('/api/cart');
  }

  async addToCart(productId: string, quantity: number, variant?: any) {
    return this.request<{
      success: boolean;
      message: string;
      cartItem: {
        id: string;
        productId: string;
        product: any;
        quantity: number;
        variant: any;
        subtotal: number;
      };
    }>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, variant }),
    });
  }

  async updateCartItem(itemId: string, quantity: number) {
    return this.request<{
      success: boolean;
      message: string;
      cartItem: {
        id: string;
        productId: string;
        product: any;
        quantity: number;
        variant: any;
        subtotal: number;
      };
    }>(`/api/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(itemId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request<{
      success: boolean;
      message: string;
      deletedCount: number;
    }>('/api/cart', {
      method: 'DELETE',
    });
  }

  async getCartCount() {
    return this.request<{
      success: boolean;
      count: number;
    }>('/api/cart/count');
  }

  // Orders API methods
  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/orders${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        userId: string;
        email: string;
        status: string;
        paymentStatus: string;
        paymentMethod: string;
        paymentIntentId: string | null;
        currency: string;
        exchangeRate: number;
        subtotal: number;
        tax: number;
        shipping: number;
        total: number;
        shippingAddress: any;
        billingAddress: any;
        trackingNumber: string | null;
        estimatedDelivery: string | null;
        notes: string | null;
        createdAt: string;
        updatedAt: string;
        shippedAt: string | null;
        deliveredAt: string | null;
        items: Array<{
          id: string;
          orderId: string;
          productId: string;
          productName: string;
          productImage: string;
          quantity: number;
          price: number;
          variant: any;
          product: {
            id: string;
            name: string;
            imageUrl: string;
            inStock: boolean;
          };
        }>;
      }>;
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  async getOrder(orderId: string) {
    return this.request<{
      success: boolean;
      order: {
        id: string;
        userId: string;
        email: string;
        status: string;
        paymentStatus: string;
        paymentMethod: string;
        paymentIntentId: string | null;
        currency: string;
        exchangeRate: number;
        subtotal: number;
        tax: number;
        shipping: number;
        total: number;
        shippingAddress: any;
        billingAddress: any;
        trackingNumber: string | null;
        estimatedDelivery: string | null;
        notes: string | null;
        createdAt: string;
        updatedAt: string;
        shippedAt: string | null;
        deliveredAt: string | null;
        items: Array<{
          id: string;
          orderId: string;
          productId: string;
          productName: string;
          productImage: string;
          quantity: number;
          price: number;
          variant: any;
          product: {
            id: string;
            name: string;
            imageUrl: string;
            category: string;
            inStock: boolean;
          };
        }>;
      };
    }>(`/api/orders/${orderId}`);
  }

  async createOrder(orderData: {
    shippingAddress: any;
    billingAddress: any;
    paymentMethod: string;
    currency?: string;
    notes?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      order: {
        id: string;
        userId: string;
        email: string;
        status: string;
        paymentStatus: string;
        paymentMethod: string;
        currency: string;
        exchangeRate: number;
        subtotal: number;
        tax: number;
        shipping: number;
        total: number;
        shippingAddress: any;
        billingAddress: any;
        notes: string | null;
        createdAt: string;
        updatedAt: string;
        items: any[];
      };
    }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string, estimatedDelivery?: string) {
    return this.request<{
      success: boolean;
      message: string;
      order: any;
    }>(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, trackingNumber, estimatedDelivery }),
    });
  }

  async cancelOrder(orderId: string) {
    return this.request<{
      success: boolean;
      message: string;
      order: any;
    }>(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
    });
  }

  // Reviews API methods
  async getProductReviews(productId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
  }) {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/reviews/product/${productId}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        userId: string;
        productId: string;
        rating: number;
        comment: string | null;
        verified: boolean;
        createdAt: string;
        updatedAt: string;
        user: {
          id: string;
          name: string;
          avatar: string;
        };
      }>;
      statistics: {
        averageRating: number;
        totalReviews: number;
        verifiedPurchases: number;
        ratingDistribution: {
          1: number;
          2: number;
          3: number;
          4: number;
          5: number;
        };
      };
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  async submitReview(productId: string, rating: number, comment?: string) {
    return this.request<{
      success: boolean;
      message: string;
      review: {
        id: string;
        userId: string;
        productId: string;
        rating: number;
        comment: string | null;
        verified: boolean;
        createdAt: string;
        updatedAt: string;
        user: {
          id: string;
          name: string;
          avatar: string;
        };
        product: {
          id: string;
          name: string;
          imageUrl: string;
        };
      };
    }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ productId, rating, comment }),
    });
  }

  async updateReview(reviewId: string, rating?: number, comment?: string) {
    return this.request<{
      success: boolean;
      message: string;
      review: any;
    }>(`/api/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify({ rating, comment }),
    });
  }

  async deleteReview(reviewId: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  async getUserReviews(params?: {
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/reviews/user/me${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      success: boolean;
      data: Array<{
        id: string;
        userId: string;
        productId: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        updatedAt: string;
        product: {
          id: string;
          name: string;
          imageUrl: string;
          category: string;
          price: number;
          inStock: boolean;
        };
      }>;
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  // Payment API methods
  async createPaymentIntent(orderId: string, paymentMethod: string) {
    return this.request<{
      success: boolean;
      paymentId: string;
      clientSecret?: string;
      approvalUrl?: string;
      message: string;
    }>('/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentMethod: paymentMethod.toUpperCase() }),
    });
  }

  async verifyPayment(orderId: string, paymentId: string, paymentMethod: string) {
    return this.request<{
      success: boolean;
      transactionId: string;
      amount: number;
      message: string;
    }>('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentId, paymentMethod: paymentMethod.toUpperCase() }),
    });
  }

  async refundPayment(orderId: string, amount?: number, reason?: string) {
    return this.request<{
      success: boolean;
      refundId: string;
      amount: number;
      message: string;
    }>('/api/payments/refund', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount, reason }),
    });
  }

  // Currency API methods
  async getExchangeRates() {
    return this.request<{
      success: boolean;
      base: string;
      rates: { GBP?: number; EUR?: number; USD?: number };
      fetchedAt: string | null;
    }>('/api/currency/rates');
  }

  // Health check
  async healthCheck() {
    return this.request<{
      status: string;
      timestamp: string;
    }>('/health');
  }
}

export const apiService = new ApiService();
