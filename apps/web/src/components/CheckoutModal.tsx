'use client';

import React, { useEffect, useState } from 'react';
import { useOrder } from '../contexts/OrderContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { SupportedCurrency, TAX_LABEL, convertFromBase, formatPrice, roundMoney } from '@shopvibe/shared';
import { useCurrency } from '../contexts/CurrencyContext';
import { CheckoutFormData, ShippingAddress } from '../types/order';
import StripePaymentForm from './StripePaymentForm';

type AddressKind = 'shippingAddress' | 'billingAddress';

const emptyAddress = (): ShippingAddress => ({
  fullName: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'GB',
  phone: ''
});

const ADDRESS_FIELDS: Array<{ key: keyof ShippingAddress; label: string; type: string; autoComplete: string; wide?: boolean; optional?: boolean }> = [
  { key: 'fullName', label: 'Full Name', type: 'text', autoComplete: 'name', wide: true },
  { key: 'street', label: 'Street Address', type: 'text', autoComplete: 'street-address', wide: true },
  { key: 'city', label: 'Town / City', type: 'text', autoComplete: 'address-level2' },
  { key: 'state', label: 'County', type: 'text', autoComplete: 'address-level1', optional: true },
  { key: 'zipCode', label: 'Postcode', type: 'text', autoComplete: 'postal-code' },
  { key: 'country', label: 'Country', type: 'text', autoComplete: 'country' },
  { key: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', wide: true }
];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { createOrder, processPayment, verifyPaymentCompletion, calculateOrderSummary, isCheckingOut } = useOrder();
  const { user } = useAuth();
  const { cart } = useCart();
  
  const [step, setStep] = useState<'form' | 'processing' | 'payment-initiated' | 'success'>('form');
  const [paymentData, setPaymentData] = useState<{ orderId?: string; paymentId?: string; clientSecret?: string; approvalUrl?: string; total?: number; currency?: SupportedCurrency } | null>(null);
  const { currency, rate, refreshRates } = useCurrency();

  // Use the latest rates whenever checkout opens, so the preview matches what the order will be priced at
  useEffect(() => {
    if (isOpen) {
      refreshRates();
    }
  }, [isOpen, refreshRates]);
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: user?.email || '',
    shippingAddress: { ...emptyAddress(), fullName: user?.name || '' },
    billingAddress: { ...emptyAddress(), fullName: user?.name || '' },
    sameAsShipping: true,
    paymentMethod: 'stripe',
    saveInfo: false
  });
  const [formError, setFormError] = useState<string | null>(null);

  // The modal mounts before the session loads, so fill in the account details once they arrive
  useEffect(() => {
    if (!user) return;

    setFormData(prev => ({
      ...prev,
      email: user.email,
      shippingAddress: { ...prev.shippingAddress, fullName: prev.shippingAddress.fullName || user.name },
      billingAddress: { ...prev.billingAddress, fullName: prev.billingAddress.fullName || user.name }
    }));
  }, [user]);

  const updateAddress = (kind: AddressKind, key: keyof ShippingAddress, value: string) => {
    setFormData(prev => ({ ...prev, [kind]: { ...prev[kind], [key]: value } }));
  };

  const findMissingField = (kind: AddressKind): string | null => {
    const missing = ADDRESS_FIELDS.find(field => !field.optional && !formData[kind][field.key]?.trim());
    return missing ? missing.label : null;
  };

  const validateForm = (): string | null => {
    const missingShipping = findMissingField('shippingAddress');
    if (missingShipping) return `Please enter your shipping ${missingShipping.toLowerCase()}.`;

    if (!formData.sameAsShipping) {
      const missingBilling = findMissingField('billingAddress');
      if (missingBilling) return `Please enter your billing ${missingBilling.toLowerCase()}.`;
    }

    return null;
  };

  const renderAddressFields = (kind: AddressKind) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {ADDRESS_FIELDS.map(field => (
        <div key={field.key} className={field.wide ? 'sm:col-span-2' : undefined}>
          <label htmlFor={`${kind}-${field.key}`} className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}{field.optional && <span className="font-normal text-gray-500"> (optional)</span>}
          </label>
          <input
            id={`${kind}-${field.key}`}
            type={field.type}
            autoComplete={`${kind === 'shippingAddress' ? 'shipping' : 'billing'} ${field.autoComplete}`}
            value={formData[kind][field.key] || ''}
            onChange={(e) => updateAddress(kind, field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={!field.optional}
          />
        </div>
      ))}
    </div>
  );

  const orderSummary = calculateOrderSummary();

  const handleSubmitOrder = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setFormError(null);
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
          approvalUrl: paymentResult.approvalUrl,
          // The amount and currency the server priced the order at
          total: order.total,
          currency: order.currency
        });
        setStep('payment-initiated');
      } else {
        setStep('form');
        setFormError('Failed to initialize payment. Please try again.');
      }
    } catch (error) {
      console.error('Order submission failed:', error);
      setStep('form');
      setFormError(error instanceof Error ? error.message : 'Failed to create order. Please try again.');
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentData?.paymentId || !paymentData?.orderId) return;

    try {
      setFormError(null);
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
        // Stay on the payment step so the same order can be retried
        setStep('payment-initiated');
        setFormError('Payment has not been completed yet, so the order could not be confirmed.');
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      setStep('payment-initiated');
      setFormError('Payment verification failed. Please try again.');
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormError(null);
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
                {formError && (
                  <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                    {formError}
                  </div>
                )}
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                  <div>
                    <label htmlFor="checkout-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">Order updates are sent to your account email.</p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
                  {renderAddressFields('shippingAddress')}
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sameAsShipping}
                      onChange={(e) => setFormData(prev => ({ ...prev, sameAsShipping: e.target.checked }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Same as shipping address</span>
                  </label>
                  {!formData.sameAsShipping && (
                    <div className="mt-4">{renderAddressFields('billingAddress')}</div>
                  )}
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
                          <p className="text-sm font-medium">{formatPrice(roundMoney(convertFromBase(item.product.price, rate) * item.quantity), currency)}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatPrice(orderSummary.subtotal, currency)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{TAX_LABEL}</span>
                        <span>{formatPrice(orderSummary.tax, currency)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>{orderSummary.shipping === 0 ? 'Free' : formatPrice(orderSummary.shipping, currency)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                        <span>Total</span>
                        <span>{formatPrice(orderSummary.total, currency)}</span>
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

            {step === 'payment-initiated' && formData.paymentMethod === 'stripe' && paymentData?.clientSecret && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Pay by card</h3>
                  {paymentData.total !== undefined && paymentData.currency && (
                    <p className="text-lg font-semibold">{formatPrice(paymentData.total, paymentData.currency)}</p>
                  )}
                </div>

                {formError && (
                  <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                    {formError}
                  </div>
                )}

                <StripePaymentForm
                  clientSecret={paymentData.clientSecret}
                  payLabel={
                    paymentData.total !== undefined && paymentData.currency
                      ? `Pay ${formatPrice(paymentData.total, paymentData.currency)}`
                      : 'Pay now'
                  }
                  onPaid={handleConfirmPayment}
                  onCancel={() => { setFormError(null); setStep('form'); }}
                />
              </div>
            )}

            {step === 'payment-initiated' && !(formData.paymentMethod === 'stripe' && paymentData?.clientSecret) && (
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
                    {paymentData?.total !== undefined && paymentData.currency && (
                      <p className="text-sm"><span className="font-medium">Amount to pay:</span> {formatPrice(paymentData.total, paymentData.currency)}</p>
                    )}
                    <p className="text-sm"><span className="font-medium">Payment ID:</span> {paymentData?.paymentId}</p>
                    {paymentData?.clientSecret && (
                      <p className="text-sm"><span className="font-medium">Client Secret:</span> {paymentData.clientSecret.substring(0, 20)}...</p>
                    )}
                    {paymentData?.approvalUrl && (
                      <p className="text-sm"><span className="font-medium">Approval URL:</span> <a href={paymentData.approvalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open PayPal</a></p>
                    )}
                  </div>
                </div>

                {formError && (
                  <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-6">
                    {formError}
                  </div>
                )}

                <p className="text-sm text-gray-500 mb-6">
                  For this demo, click &quot;Confirm Payment&quot; to simulate successful payment completion.
                </p>

                <div className="flex space-x-4">
                  <button
                    onClick={() => { setFormError(null); setStep('form'); }}
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
                {isCheckingOut ? 'Processing...' : `Place Order - ${formatPrice(orderSummary.total, currency)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal; 