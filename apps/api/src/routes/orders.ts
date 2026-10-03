import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { calculateOrderTotals, SUPPORTED_CURRENCIES } from '@shopvibe/shared';
import { prisma } from '../config/database';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getExchangeRate } from '../services/exchangeRates';

const router = Router();

// Validation schemas
const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional().default(''), // County is optional for UK addresses
  zipCode: z.string().min(1, 'Postcode is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().min(1, 'Phone number is required')
});

const createOrderSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: z.enum(['STRIPE', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY']),
  currency: z.enum(SUPPORTED_CURRENCIES).optional().default('GBP'),
  notes: z.string().optional()
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().optional()
});

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  status: z.string().optional()
});

// GET /api/orders - Get user's order history
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { page, limit, status } = querySchema.parse(req.query);

    // Validate pagination
    if (!(page >= 1)) {
      return res.status(400).json({ error: 'Page must be greater than 0' });
    }
    if (!(limit >= 1 && limit <= 50)) {
      return res.status(400).json({ error: 'Limit must be between 1 and 50' });
    }

    const skip = (page - 1) * limit;
    const where: any = { userId: user.id };

    if (status) {
      where.status = status.toUpperCase();
    }

    // Get orders with pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  inStock: true
                }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Parse JSON fields
    const formattedOrders = orders.map(order => ({
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress),
      billingAddress: JSON.parse(order.billingAddress),
      items: order.items.map(item => ({
        ...item,
        variant: item.variant ? JSON.parse(item.variant) : null
      }))
    }));

    res.json({
      success: true,
      data: formattedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors
      });
    }
    next(error);
  }
});

// GET /api/orders/:id - Get single order details
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                category: true,
                inStock: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Parse JSON fields
    const formattedOrder = {
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress),
      billingAddress: JSON.parse(order.billingAddress),
      items: order.items.map(item => ({
        ...item,
        variant: item.variant ? JSON.parse(item.variant) : null
      }))
    };

    res.json({
      success: true,
      order: formattedOrder
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders - Create new order from cart
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { shippingAddress, billingAddress, paymentMethod, currency, notes } = createOrderSchema.parse(req.body);

    // Get user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: true
      }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Add items before creating an order.' });
    }

    // Check if all products are in stock
    const outOfStockItems = cartItems.filter(item => !item.product.inStock);
    if (outOfStockItems.length > 0) {
      return res.status(400).json({
        error: 'Some items in your cart are out of stock',
        outOfStockItems: outOfStockItems.map(item => ({
          productId: item.productId,
          productName: item.product.name
        }))
      });
    }

    // Price the order in the customer's currency at the current rate. The rate
    // is saved on the order so the amount charged never moves afterwards.
    const exchangeRate = await getExchangeRate(currency);

    if (exchangeRate === null) {
      return res.status(503).json({
        error: 'Currency unavailable',
        message: `Payment in ${currency} is temporarily unavailable. Please pay in GBP or try again later.`
      });
    }

    const totals = calculateOrderTotals(
      cartItems.map(item => ({ price: item.product.price, quantity: item.quantity })),
      exchangeRate
    );

    const orderData = {
      status: 'PENDING', // Will be updated to CONFIRMED after payment verification
      paymentStatus: 'PENDING', // Will be updated after payment
      paymentMethod,
      currency,
      exchangeRate,
      subtotal: totals.subtotal,
      tax: totals.tax,
      shipping: totals.shipping,
      total: totals.total,
      shippingAddress: JSON.stringify(shippingAddress),
      billingAddress: JSON.stringify(billingAddress),
      notes: notes || null,
      items: {
        create: cartItems.map((item, index) => ({
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.imageUrl,
          quantity: item.quantity,
          price: totals.lines[index].unitPrice, // in the order's currency
          variant: item.variant
        }))
      }
    };

    const orderInclude = {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              category: true
            }
          }
        }
      }
    };

    // Reuse the user's unpaid order if there is one, so repeated checkout
    // attempts do not pile up duplicate pending orders
    const unpaidOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING',
        paymentStatus: { in: ['PENDING', 'FAILED'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    let order;

    if (unpaidOrder) {
      // The totals may have changed, so any earlier payment intent is dropped
      [, order] = await prisma.$transaction([
        prisma.orderItem.deleteMany({ where: { orderId: unpaidOrder.id } }),
        prisma.order.update({
          where: { id: unpaidOrder.id },
          data: { ...orderData, paymentIntentId: null },
          include: orderInclude
        })
      ]);
    } else {
      order = await prisma.order.create({
        data: { ...orderData, userId: user.id, email: user.email },
        include: orderInclude
      });
    }

    // Parse JSON fields for response
    const formattedOrder = {
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress),
      billingAddress: JSON.parse(order.billingAddress),
      items: order.items.map(item => ({
        ...item,
        variant: item.variant ? JSON.parse(item.variant) : null
      }))
    };

    res.status(unpaidOrder ? 200 : 201).json({
      success: true,
      message: unpaidOrder ? 'Existing unpaid order updated' : 'Order created successfully',
      order: formattedOrder
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid order data',
        details: error.errors
      });
    }
    next(error);
  }
});

// PUT /api/orders/:id/status - Update order status (admin only)
router.put('/:id/status', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, estimatedDelivery } = updateOrderStatusSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Prevent updating cancelled or refunded orders
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      return res.status(400).json({ error: `Cannot update ${order.status.toLowerCase()} order` });
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Update timestamps based on status
    if (status === 'SHIPPED' && !order.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (status === 'DELIVERED' && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    // Add tracking info if provided
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }
    if (estimatedDelivery) {
      updateData.estimatedDelivery = new Date(estimatedDelivery);
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true
      }
    });

    // Parse JSON fields
    const formattedOrder = {
      ...updatedOrder,
      shippingAddress: JSON.parse(updatedOrder.shippingAddress),
      billingAddress: JSON.parse(updatedOrder.billingAddress),
      items: updatedOrder.items.map(item => ({
        ...item,
        variant: item.variant ? JSON.parse(item.variant) : null
      }))
    };

    return res.json({
      success: true,
      message: 'Order status updated successfully',
      order: formattedOrder
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid status update data',
        details: error.errors
      });
    }
    return next(error);
  }
});

// POST /api/orders/:id/cancel - Cancel order
router.post('/:id/cancel', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Check if order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only allow canceling PENDING or CONFIRMED orders
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({
        error: `Cannot cancel order with status: ${order.status}`,
        message: 'Only pending or confirmed orders can be cancelled'
      });
    }

    // Cancelling does not refund, so paid orders must go through support
    if (order.paymentStatus === 'COMPLETED') {
      return res.status(400).json({
        error: 'Paid orders cannot be cancelled here',
        message: 'This order has been paid. Please contact support to cancel it and arrange a refund.'
      });
    }

    // Update order status to CANCELLED
    const cancelledOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      },
      include: {
        items: true
      }
    });

    // Parse JSON fields
    const formattedOrder = {
      ...cancelledOrder,
      shippingAddress: JSON.parse(cancelledOrder.shippingAddress),
      billingAddress: JSON.parse(cancelledOrder.billingAddress),
      items: cancelledOrder.items.map(item => ({
        ...item,
        variant: item.variant ? JSON.parse(item.variant) : null
      }))
    };

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: formattedOrder
    });
  } catch (error) {
    next(error);
  }
});

export { router as orderRoutes }; 