import { StripeAdapter } from '@shopvibe/payments';
import { PayPalAdapter } from '@shopvibe/payments';
import { STORE_CURRENCY } from '@shopvibe/shared';
import { prisma } from '../config/database';

// Initialize payment adapters
let stripeAdapter: StripeAdapter | null = null;
let paypalAdapter: PayPalAdapter | null = null;

// Initialize Stripe if credentials are provided
if (process.env.STRIPE_SECRET_KEY) {
  stripeAdapter = new StripeAdapter(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('STRIPE_SECRET_KEY not found. Stripe payments will not be available.');
}

// Initialize PayPal if credentials are provided
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  const isSandbox = process.env.PAYPAL_MODE !== 'live';
  paypalAdapter = new PayPalAdapter(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET,
    isSandbox
  );
} else {
  console.warn('PayPal credentials not found. PayPal payments will not be available.');
}

interface InitializePaymentParams {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'STRIPE' | 'PAYPAL';
  customerId?: string;
}

interface InitializePaymentResponse {
  success: boolean;
  paymentId: string;
  clientSecret?: string;
  approvalUrl?: string;
}

interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  paymentMethod: 'STRIPE' | 'PAYPAL';
  expectedAmount: number;
  expectedCurrency: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  pending?: boolean;
  transactionId: string;
  amount: number;
}

export const initializePayment = async (
  params: InitializePaymentParams
): Promise<InitializePaymentResponse> => {
  const { orderId, amount, currency, paymentMethod, customerId } = params;

  try {
    if (paymentMethod === 'STRIPE') {
      if (!stripeAdapter) {
        throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.');
      }

      const result = await stripeAdapter.createOrder({
        amount,
        currency,
        cartId: orderId,
        customerId
      });

      // Update order with payment intent ID
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentIntentId: result.id,
          paymentStatus: 'PENDING'
        }
      });

      return {
        success: true,
        paymentId: result.id,
        clientSecret: result.clientSecret
      };
    } else if (paymentMethod === 'PAYPAL') {
      if (!paypalAdapter) {
        throw new Error('PayPal is not configured. Please add PayPal credentials to environment variables.');
      }

      const result = await paypalAdapter.createOrder({
        amount,
        currency,
        cartId: orderId,
        customerId
      });

      // Update order with payment intent ID
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentIntentId: result.id,
          paymentStatus: 'PENDING'
        }
      });

      return {
        success: true,
        paymentId: result.id,
        approvalUrl: result.approvalUrl
      };
    } else {
      throw new Error('Invalid payment method');
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
};

export const verifyPayment = async (
  params: VerifyPaymentParams
): Promise<VerifyPaymentResponse> => {
  const { orderId, paymentId, paymentMethod, expectedAmount, expectedCurrency } = params;

  try {
    let captureResult;

    if (paymentMethod === 'STRIPE') {
      if (!stripeAdapter) {
        throw new Error('Stripe is not configured');
      }

      captureResult = await stripeAdapter.capturePayment({
        orderId,
        paymentId,
        expectedAmount,
        expectedCurrency
      });
    } else if (paymentMethod === 'PAYPAL') {
      if (!paypalAdapter) {
        throw new Error('PayPal is not configured');
      }

      captureResult = await paypalAdapter.capturePayment({
        orderId,
        paymentId,
        expectedAmount,
        expectedCurrency
      });
    } else {
      throw new Error('Invalid payment method');
    }

    // Update order status based on payment result
    if (captureResult.status === 'success') {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          paymentIntentId: captureResult.transactionId,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        transactionId: captureResult.transactionId,
        amount: captureResult.amount
      };
    } else if (captureResult.status === 'failed') {
      // The provider reported a definitive failure
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'FAILED',
          updatedAt: new Date()
        }
      });

      return {
        success: false,
        transactionId: captureResult.transactionId,
        amount: 0
      };
    } else {
      // Not paid yet or still processing: leave the order awaiting payment
      return {
        success: false,
        pending: true,
        transactionId: captureResult.transactionId,
        amount: 0
      };
    }
  } catch (error) {
    // An error here does not mean the payment failed (it may be a network
    // problem), so the order is left awaiting payment and can be retried.
    console.error('Payment verification error:', error);
    throw error;
  }
};

export const clearPurchasedCartItems = async (orderId: string): Promise<void> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      userId: true,
      items: {
        select: {
          productId: true
        }
      }
    }
  });

  if (!order?.userId || order.items.length === 0) {
    return;
  }

  await prisma.cartItem.deleteMany({
    where: {
      userId: order.userId,
      productId: {
        in: order.items.map(item => item.productId)
      }
    }
  });
};

export const refundPayment = async (
  orderId: string,
  amount: number,
  reason?: string
): Promise<{ success: boolean; refundId: string }> => {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.paymentIntentId) {
      throw new Error('No payment to refund');
    }

    let refundResult;

    if (order.paymentMethod === 'STRIPE') {
      if (!stripeAdapter) {
        throw new Error('Stripe is not configured');
      }

      refundResult = await stripeAdapter.refundPayment({
        transactionId: order.paymentIntentId,
        amount,
        reason
      });
    } else if (order.paymentMethod === 'PAYPAL') {
      if (!paypalAdapter) {
        throw new Error('PayPal is not configured');
      }

      refundResult = await paypalAdapter.refundPayment({
        transactionId: order.paymentIntentId,
        amount,
        currency: STORE_CURRENCY,
        reason
      });
    } else {
      throw new Error('Invalid payment method');
    }

    if (refundResult.status === 'success') {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'REFUNDED',
          paymentStatus: 'REFUNDED',
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        refundId: refundResult.refundId
      };
    } else {
      throw new Error('Refund failed');
    }
  } catch (error) {
    console.error('Refund error:', error);
    throw error;
  }
};


















