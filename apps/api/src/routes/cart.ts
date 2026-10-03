import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validation schemas
const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer').max(100, 'Quantity cannot exceed 100'),
  variant: z.string().optional()
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be a positive integer').max(100, 'Quantity cannot exceed 100')
});

// GET /api/cart - Get user's cart with all items
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            category: true,
            inStock: true,
            rating: true,
            reviewCount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate cart totals
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      cart: {
        items: cartItems.map(item => ({
          id: item.id,
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          variant: item.variant ? JSON.parse(item.variant) : null,
          subtotal: item.product.price * item.quantity,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        })),
        summary: {
          itemCount,
          subtotal,
          tax: subtotal * 0.08, // 8% tax
          shipping: subtotal >= 50 ? 0 : 9.99, // Free shipping from $50
          total: subtotal + (subtotal * 0.08) + (subtotal >= 50 ? 0 : 9.99)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/items - Add item to cart
router.post('/items', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { productId, quantity, variant } = addToCartSchema.parse(req.body);

    // Check if product exists and is in stock
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.inStock) {
      return res.status(400).json({ error: 'Product is out of stock' });
    }

    // Check if item already exists in cart (same product, same variant)
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        userId: user.id,
        productId: productId
      }
    });

    let cartItem;

    if (existingCartItem) {
      // Update existing cart item quantity
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (newQuantity > 100) {
        return res.status(400).json({ error: 'Cannot add more than 100 items of the same product' });
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { 
          quantity: newQuantity,
          variant: variant ? JSON.stringify(variant) : existingCartItem.variant
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
              category: true,
              inStock: true
            }
          }
        }
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId,
          quantity,
          variant: variant ? JSON.stringify(variant) : null
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
              category: true,
              inStock: true
            }
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: existingCartItem ? 'Cart item updated' : 'Item added to cart',
      cartItem: {
        id: cartItem.id,
        productId: cartItem.productId,
        product: cartItem.product,
        quantity: cartItem.quantity,
        variant: cartItem.variant ? JSON.parse(cartItem.variant) : null,
        subtotal: cartItem.product.price * cartItem.quantity
      }
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

// PUT /api/cart/items/:id - Update cart item quantity
router.put('/items/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { quantity } = updateCartItemSchema.parse(req.body);

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Update cart item
    const updatedCartItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            category: true,
            inStock: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Cart item updated',
      cartItem: {
        id: updatedCartItem.id,
        productId: updatedCartItem.productId,
        product: updatedCartItem.product,
        quantity: updatedCartItem.quantity,
        variant: updatedCartItem.variant ? JSON.parse(updatedCartItem.variant) : null,
        subtotal: updatedCartItem.product.price * updatedCartItem.quantity
      }
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

// DELETE /api/cart/items/:id - Remove item from cart
router.delete('/items/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Check if cart item exists and belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart - Clear entire cart
router.delete('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;

    // Delete all cart items for user
    const result = await prisma.cartItem.deleteMany({
      where: { userId: user.id }
    });

    res.json({
      success: true,
      message: 'Cart cleared',
      deletedCount: result.count
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cart/count - Get cart item count (lightweight endpoint)
router.get('/count', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;

    const itemCount = await prisma.cartItem.aggregate({
      where: { userId: user.id },
      _sum: { quantity: true }
    });

    res.json({
      success: true,
      count: itemCount._sum.quantity || 0
    });
  } catch (error) {
    next(error);
  }
});

export { router as cartRoutes }; 