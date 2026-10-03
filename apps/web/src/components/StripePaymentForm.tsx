'use client';

import React, { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// Loaded once for the whole app, and only when a publishable key is configured
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface StripePaymentFormProps {
  clientSecret: string;
  payLabel: string;
  // Called once Stripe reports the payment as paid or processing
  onPaid: () => void;
  onCancel: () => void;
}

const PaymentFields: React.FC<Omit<StripePaymentFormProps, 'clientSecret'>> = ({ payLabel, onPaid, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsPaying(true);
    setError(null);

    // Card checks such as 3D Secure open in place; the customer never leaves the page
    const result = await stripe.confirmPayment({ elements, redirect: 'if_required' });

    if (result.error) {
      setError(result.error.message || 'Your payment could not be completed. Please try again.');
      setIsPaying(false);
      return;
    }

    if (result.paymentIntent && ['succeeded', 'processing'].includes(result.paymentIntent.status)) {
      onPaid();
      return;
    }

    setError('Your payment was not completed. Please try again.');
    setIsPaying(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPaying}
          className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isPaying}
          className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPaying ? 'Paying...' : payLabel}
        </button>
      </div>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ clientSecret, ...fieldProps }) => {
  const options = useMemo(() => ({ clientSecret }), [clientSecret]);

  if (!stripePromise) {
    return (
      <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
        Card payments are not set up yet. Please choose another payment method.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFields {...fieldProps} />
    </Elements>
  );
};

export default StripePaymentForm;
