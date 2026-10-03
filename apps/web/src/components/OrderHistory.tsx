'use client';

import React from 'react';
import { useOrder } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '@shopvibe/shared';
import { OrderStatus } from '../types/order';

const OrderHistory: React.FC = () => {
  const { getUserOrders, trackOrder, cancelOrder, hasMoreOrders, loadMoreOrders, isLoading } = useOrder();
  const { user } = useAuth();

  const orders = getUserOrders(user?.id);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'confirmed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'shipped':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'delivered':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      await cancelOrder(orderId);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Order History</h3>
        <p className="text-gray-600">Please log in to view your order history.</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Order History</h3>
        <p className="text-gray-600">You haven&apos;t placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-6">Order History</h3>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="border border-gray-200 rounded-lg p-6">
            {/* Order Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold">Order {order.id}</h4>
                <p className="text-sm text-gray-600">
                  Placed on {order.createdAt.toLocaleDateString()} • Total: {formatPrice(order.total, order.currency)}
                </p>
              </div>
              
              <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="capitalize">{order.status}</span>
                </span>
                
                {(order.status === 'pending' || order.status === 'confirmed') && order.paymentStatus !== 'completed' && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium">{item.productName}</h5>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} • {formatPrice(item.price, order.currency)} each
                    </p>
                    {item.variant && (
                      <p className="text-sm text-gray-500">
                        {item.variant.color && `Color: ${item.variant.color}`}
                        {item.variant.size && ` • Size: ${item.variant.size}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(item.price * item.quantity, order.currency)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <h6 className="font-medium mb-2">Shipping Address</h6>
                <p className="text-sm text-gray-600">
                  {order.shippingAddress.fullName}<br />
                  {order.shippingAddress.street}<br />
                  {[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(', ')} {order.shippingAddress.zipCode}
                </p>
              </div>
              
              <div>
                <h6 className="font-medium mb-2">Order Summary</h6>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatPrice(order.tax, order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping, order.currency)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-gray-200 pt-1">
                    <span>Total:</span>
                    <span>{formatPrice(order.total, order.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Tracking Number</p>
                    <p className="text-sm text-blue-700">{order.trackingNumber}</p>
                  </div>
                  {order.estimatedDelivery && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-900">Estimated Delivery</p>
                      <p className="text-sm text-blue-700">{order.estimatedDelivery.toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => trackOrder(order.id)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Track Order
              </button>
              
              {order.status === 'delivered' && (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  Leave Review
                </button>
              )}
              
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMoreOrders && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMoreOrders}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Load older orders'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory; 