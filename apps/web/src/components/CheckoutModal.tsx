'use client';

import React, { useState } from 'react';
import { useOrder } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatPriceWithConversion } from '@shopvibe/shared';
import { CheckoutFormData } from '../types/order';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { createOrder, processPayment, verifyPaymentCompletion, calculateOrderSummary, isCheckingOut } = useOrder();
  const { user } = useAuth();
  const { cart } = useCart();
  const { currency } = useCurrency();
  
  const [step, setStep] = useState<'form' | 'processing' | 'payment-initiated' | 'success'>('form');
  const [paymentData, setPaymentData] = useState<{ orderId?: string; paymentId?: string; clientSecret?: string; approvalUrl?: string } | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: user?.email || '',
    shippingAddress: {
      fullName: user?.name || '',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'US',
      phone: '+1 (555) 123-4567'
    },
    billingAddress: {
      fullName: user?.name || '',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'US',
      phone: '+1 (555) 123-4567'
    },
    sameAsShipping: true,
    paymentMethod: 'stripe',
    saveInfo: false
  });

  const orderSummary = calculateOrderSummary();

  const handleSubmitOrder = async () => {
    try {
      setStep('processing');
      
      // Create the order
      const order = await createOrder(formData);
      
      // Initialize payment
      const paymentResult = await processPayment(order.id, formData.paymentMethod as 'stripe' | 'paypal');
      
      if (paymentResult.success) {
        setPaymentData({
          orderId: order.id,
          paymentId: paymentResult.paymentId,
          clientSecret: paymentResult.clientSecret,
          approvalUrl: paymentResult.approvalUrl
        });
        setStep('payment-initiated');
      } else {
        setStep('form');
        alert('Failed to initialize payment. Please try again.');
      }
    } catch (error) {
      console.error('Order submission failed:', error);
      setStep('form');
      alert('Failed to create order. Please try again.');
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentData?.paymentId || !paymentData?.orderId) return;

    try {
      setStep('processing');
      
      // For demo purposes, we simulate payment completion here
      // In production, this would happen after user completes Stripe/PayPal flow
      // The user would be redirected back or use Stripe Elements to complete payment
      
      // Verify payment completion with backend
      const verified = await verifyPaymentCompletion(
        paymentData.orderId,
        paymentData.paymentId,
        formData.paymentMethod as 'stripe' | 'paypal'
      );
      
      if (verified) {
        setStep('success');
      } else {
        setStep('form');
        alert('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      setStep('form');
      alert('Payment verification failed. Please try again.');
    }
  };

  const handleClose = () => {
    setStep('form');
    setPaymentData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
        
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 'success' ? 'Order Confirmed!' : 'Checkout'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {step === 'form' && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={formData.shippingAddress.fullName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shippingAddress: { ...prev.shippingAddress, fullName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="stripe"
                        checked={formData.paymentMethod === 'stripe'}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'stripe' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">Credit Card (Stripe)</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={formData.paymentMethod === 'paypal'}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'paypal' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">PayPal</span>
                    </label>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {cart.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <p className="text-sm font-medium">{item.product.name}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="text-sm font-medium">{formatPriceWithConversion(item.product.price * item.quantity, 'USD', currency)}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatPriceWithConversion(orderSummary.subtotal, 'USD', currency)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>{formatPriceWithConversion(orderSummary.tax, 'USD', currency)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>{orderSummary.shipping === 0 ? 'Free' : formatPriceWithConversion(orderSummary.shipping, 'USD', currency)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                        <span>Total</span>
                        <span>{formatPriceWithConversion(orderSummary.total, 'USD', currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Processing Your Order</h3>
                <p className="text-gray-600">Please wait while we process your payment...</p>
              </div>
            )}

            {step === 'payment-initiated' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Initiated</h3>
                <p className="text-gray-600 mb-6">
                  {formData.paymentMethod === 'stripe' 
                    ? 'Your Stripe payment has been initiated. In a production environment, you would complete payment using Stripe Elements.'
                    : 'Your PayPal payment has been initiated. In a production environment, you would be redirected to PayPal to complete payment.'}
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Payment Details:</p>
                  <div className="space-y-1 text-left">
                    <p className="text-sm"><span className="font-medium">Payment ID:</span> {paymentData?.paymentId}</p>
                    {paymentData?.clientSecret && (
                      <p className="text-sm"><span className="font-medium">Client Secret:</span> {paymentData.clientSecret.substring(0, 20)}...</p>
                    )}
                    {paymentData?.approvalUrl && (
                      <p className="text-sm"><span className="font-medium">Approval URL:</span> <a href={paymentData.approvalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open PayPal</a></p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  For this demo, click &quot;Confirm Payment&quot; to simulate successful payment completion.
                </p>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h3>
                <p className="text-gray-600 mb-6">
                  Thank you for your purchase. You will receive an email confirmation shortly.
                </p>
                <button
                  onClick={handleClose}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {step === 'form' && (
            <div className="flex justify-between items-center p-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSubmitOrder}
                disabled={isCheckingOut || cart.items.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? 'Processing...' : `Place Order - ${formatPriceWithConversion(orderSummary.total, 'USD', currency)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal; 