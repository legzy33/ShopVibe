import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middleware/auth';
import { clearPurchasedCartItems, initializePayment, verifyPayment, refundPayment } from '../services/paymentService';
import { prisma } from '../config/database';

const router = Router();

// Validation schemas
const createPaymentIntentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentMethod: z.enum(['STRIPE', 'PAYPAL'])
});

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  paymentMethod: z.enum(['STRIPE', 'PAYPAL'])
});

const refundPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().positive('Amount must be positive').optional(),
  reason: z.string().optional()
});

// POST /api/payments/create-intent - Create payment intent for Stripe or PayPal
router.post('/create-intent', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { orderId, paymentMethod } = createPaymentIntentSchema.parse(req.body);

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentMethod !== paymentMethod) {
      return res.status(400).json({
        error: 'Payment method mismatch',
        message: `Order was created with ${order.paymentMethod}.`
      });
    }

    // Check if order is in correct state for payment
    if (order.status !== 'PENDING') {
      return res.status(400).json({ 
        error: 'Order cannot be paid',
        message: `Order status is ${order.status}. Only pending orders can be paid.`
      });
    }

    // Initialize payment
    const paymentResult = await initializePayment({
      orderId: order.id,
      amount: order.total,
      currency: 'USD',
      paymentMethod,
      customerId: user.id
    });

    res.json({
      success: true,
      paymentId: paymentResult.paymentId,
      clientSecret: paymentResult.clientSecret,
      approvalUrl: paymentResult.approvalUrl,
      message: paymentMethod === 'STRIPE' 
        ? 'Stripe payment intent created' 
        : 'PayPal order created'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }
    next(error);
  }
});

// POST /api/payments/verify - Verify and capture payment
router.post('/verify', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { orderId, paymentId, paymentMethod } = verifyPaymentSchema.parse(req.body);

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentMethod !== paymentMethod) {
      return res.status(400).json({
        error: 'Payment method mismatch',
        message: `Order was created with ${order.paymentMethod}.`
      });
    }

    if (order.paymentStatus !== 'PENDING') {
      return res.status(400).json({
        error: 'Order is not awaiting payment',
        message: `Payment status is ${order.paymentStatus}.`
      });
    }

    if (!order.paymentIntentId) {
      return res.status(400).json({
        error: 'Payment has not been initialized for this order'
      });
    }

    if (order.paymentIntentId !== paymentId) {
      return res.status(400).json({
        error: 'Invalid payment reference for this order'
      });
    }

    // Verify payment
    const verificationResult = await verifyPayment({
      orderId,
      paymentId,
      paymentMethod,
      expectedAmount: order.total,
      expectedCurrency: 'USD'
    });

    if (verificationResult.success) {
      await clearPurchasedCartItems(orderId);

      res.json({
        success: true,
        transactionId: verificationResult.transactionId,
        amount: verificationResult.amount,
        message: 'Payment verified and order confirmed'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        message: 'Payment could not be verified. Please contact support.'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }
    next(error);
  }
});

// POST /api/payments/refund - Refund a payment (admin only)
router.post('/refund', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { orderId, amount, reason } = refundPaymentSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order can be refunded
    if (order.paymentStatus !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Order cannot be refunded',
        message: 'Only completed payments can be refunded'
      });
    }

    // Process refund
    const refundAmount = amount || order.total;

    if (refundAmount > order.total) {
      return res.status(400).json({
        error: 'Refund amount exceeds order total'
      });
    }
    const refundResult = await refundPayment(orderId, refundAmount, reason);

    res.json({
      success: true,
      refundId: refundResult.refundId,
      amount: refundAmount,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }
    next(error);
  }
});

export { router as paymentRoutes };


















