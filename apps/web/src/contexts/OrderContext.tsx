'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, OrderStatus, CheckoutFormData, OrderSummary } from '../types/order';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  isCheckingOut: boolean;
  isLoading: boolean;
  checkoutError: string | null;
  // Checkout functions
  createOrder: (formData: CheckoutFormData) => Promise<Order>;
  processPayment: (orderId: string, paymentMethod: 'stripe' | 'paypal') => Promise<{ success: boolean; paymentId?: string; clientSecret?: string; approvalUrl?: string }>;
  verifyPaymentCompletion: (orderId: string, paymentId: string, paymentMethod: 'stripe' | 'paypal') => Promise<boolean>;
  calculateOrderSummary: () => OrderSummary;
  // Order management
  getOrderById: (orderId: string) => Order | undefined;
  getUserOrders: (userId?: string) => Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  trackOrder: (orderId: string) => Order | undefined;
  cancelOrder: (orderId: string) => Promise<boolean>;
  // Utility functions
  clearCheckoutError: () => void;
  resetCurrentOrder: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
  const { cart, refreshCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Fetch orders from backend when user is authenticated
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !user) {
        setOrders([]);
        return;
      }

      try {
        setIsLoading(true);
        const response = await apiService.getOrders();
        
        // Transform API response to Order type
        const transformedOrders: Order[] = response.data.map(order => ({
          id: order.id,
          userId: order.userId,
          items: order.items.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            quantity: item.quantity,
            price: item.price,
            variant: item.variant
          })),
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          total: order.total,
          status: order.status.toLowerCase() as OrderStatus,
          paymentStatus: order.paymentStatus.toLowerCase() as 'pending' | 'completed' | 'failed' | 'refunded',
          paymentMethod: order.paymentMethod.toLowerCase() as 'stripe' | 'paypal' | 'apple_pay' | 'google_pay',
          paymentIntentId: order.paymentIntentId || undefined,
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          trackingNumber: order.trackingNumber || undefined,
          estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          shippedAt: order.shippedAt ? new Date(order.shippedAt) : undefined,
          deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
        }));
        
        setOrders(transformedOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [isAuthenticated, user]);

  const calculateOrderSummary = (): OrderSummary => {
    const subtotal = cart.items.reduce((sum: number, item) => sum + (item.product.price * item.quantity), 0);
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal >= 50 ? 0 : 9.99; // Free shipping over $50
    const total = subtotal + tax + shipping;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  };

  const createOrder = async (formData: CheckoutFormData): Promise<Order> => {
    if (!isAuthenticated) {
      throw new Error('Please login to create an order');
    }

    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const response = await apiService.createOrder({
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.sameAsShipping ? formData.shippingAddress : formData.billingAddress,
        paymentMethod: formData.paymentMethod.toUpperCase(),
        notes: undefined
      });

      // Transform API response to Order type
      const newOrder: Order = {
        id: response.order.id,
        userId: response.order.userId,
        items: response.order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant
        })),
        subtotal: response.order.subtotal,
        tax: response.order.tax,
        shipping: response.order.shipping,
        total: response.order.total,
        status: response.order.status.toLowerCase() as OrderStatus,
        paymentStatus: response.order.paymentStatus.toLowerCase() as 'pending' | 'completed' | 'failed' | 'refunded',
        paymentMethod: response.order.paymentMethod.toLowerCase() as 'stripe' | 'paypal' | 'apple_pay' | 'google_pay',
        shippingAddress: response.order.shippingAddress,
        billingAddress: response.order.billingAddress,
        createdAt: new Date(response.order.createdAt),
        updatedAt: new Date(response.order.updatedAt),
      };

      setOrders(prev => [newOrder, ...prev]);
      setCurrentOrder(newOrder);
      
      return newOrder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      setCheckoutError(errorMessage);
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  };

  const processPayment = async (orderId: string, paymentMethod: 'stripe' | 'paypal'): Promise<{ success: boolean; paymentId?: string; clientSecret?: string; approvalUrl?: string }> => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      // Step 1: Create payment intent/order with payment processor
      const paymentIntent = await apiService.createPaymentIntent(orderId, paymentMethod);

      if (!paymentIntent.success) {
        throw new Error('Failed to initialize payment');
      }

      // Return payment credentials to frontend for user action
      return {
        success: true,
        paymentId: paymentIntent.paymentId,
        clientSecret: paymentIntent.clientSecret,
        approvalUrl: paymentIntent.approvalUrl
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
      setCheckoutError(errorMessage);
      return { success: false };
    } finally {
      setIsCheckingOut(false);
    }
  };

  const verifyPaymentCompletion = async (orderId: string, paymentId: string, paymentMethod: 'stripe' | 'paypal'): Promise<boolean> => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      // Verify payment with backend
      const verification = await apiService.verifyPayment(orderId, paymentId, paymentMethod);

      if (verification.success) {
        await refreshCart();

        // Refresh orders to get updated status
        const response = await apiService.getOrders();
        const transformedOrders: Order[] = response.data.map(order => ({
          id: order.id,
          userId: order.userId,
          items: order.items.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            quantity: item.quantity,
            price: item.price,
            variant: item.variant
          })),
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          total: order.total,
          status: order.status.toLowerCase() as OrderStatus,
          paymentStatus: order.paymentStatus.toLowerCase() as 'pending' | 'completed' | 'failed' | 'refunded',
          paymentMethod: order.paymentMethod.toLowerCase() as 'stripe' | 'paypal' | 'apple_pay' | 'google_pay',
          paymentIntentId: order.paymentIntentId || undefined,
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          trackingNumber: order.trackingNumber || undefined,
          estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          shippedAt: order.shippedAt ? new Date(order.shippedAt) : undefined,
          deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
        }));
        
        setOrders(transformedOrders);
        return true;
      }

      throw new Error('Payment verification failed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
      setCheckoutError(errorMessage);
      return false;
    } finally {
      setIsCheckingOut(false);
    }
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId);
  };

  const getUserOrders = (userId?: string): Order[] => {
    if (!userId) return orders;
    return orders.filter(order => order.userId === userId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      await apiService.updateOrderStatus(orderId, status.toUpperCase());
      
      // Refresh orders from backend
      const response = await apiService.getOrders();
      const transformedOrders: Order[] = response.data.map(order => ({
        id: order.id,
        userId: order.userId,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        status: order.status.toLowerCase() as OrderStatus,
        paymentStatus: order.paymentStatus.toLowerCase() as 'pending' | 'completed' | 'failed' | 'refunded',
        paymentMethod: order.paymentMethod.toLowerCase() as 'stripe' | 'paypal' | 'apple_pay' | 'google_pay',
        paymentIntentId: order.paymentIntentId || undefined,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        trackingNumber: order.trackingNumber || undefined,
        estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
        shippedAt: order.shippedAt ? new Date(order.shippedAt) : undefined,
        deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  };

  const trackOrder = (orderId: string): Order | undefined => {
    return getOrderById(orderId);
  };

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    const order = getOrderById(orderId);
    if (!order) {
      setCheckoutError('Order not found');
      return false;
    }

    // Only allow cancellation for pending/confirmed orders
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      setCheckoutError('Order cannot be cancelled at this stage');
      return false;
    }

    try {
      await apiService.cancelOrder(orderId);
      
      // Refresh orders from backend
      const response = await apiService.getOrders();
      const transformedOrders: Order[] = response.data.map(order => ({
        id: order.id,
        userId: order.userId,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        status: order.status.toLowerCase() as OrderStatus,
        paymentStatus: order.paymentStatus.toLowerCase() as 'pending' | 'completed' | 'failed' | 'refunded',
        paymentMethod: order.paymentMethod.toLowerCase() as 'stripe' | 'paypal' | 'apple_pay' | 'google_pay',
        paymentIntentId: order.paymentIntentId || undefined,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        trackingNumber: order.trackingNumber || undefined,
        estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
        shippedAt: order.shippedAt ? new Date(order.shippedAt) : undefined,
        deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
      }));
      
      setOrders(transformedOrders);
      return true;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Failed to cancel order');
      return false;
    }
  };

  const clearCheckoutError = (): void => {
    setCheckoutError(null);
  };

  const resetCurrentOrder = (): void => {
    setCurrentOrder(null);
  };

  const value: OrderContextType = {
    orders,
    currentOrder,
    isCheckingOut,
    isLoading,
    checkoutError,
    createOrder,
    processPayment,
    verifyPaymentCompletion,
    calculateOrderSummary,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    trackOrder,
    cancelOrder,
    clearCheckoutError,
    resetCurrentOrder
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};