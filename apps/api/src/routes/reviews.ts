import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation schemas
const createReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(2000, 'Comment must be less than 2000 characters').optional()
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  comment: z.string().max(2000, 'Comment must be less than 2000 characters').optional()
});

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  sortBy: z.enum(['newest', 'oldest', 'highest', 'lowest']).optional().default('newest')
});

// Helper function to update product rating
async function updateProductRating(productId: string) {
  const aggregation = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true }
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: aggregation._avg.rating || 0,
      reviewCount: aggregation._count.rating
    }
  });
}

// Users who have paid for an order containing the product
async function getVerifiedBuyerIds(productId: string): Promise<Set<string>> {
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: 'COMPLETED',
      userId: { not: null },
      items: { some: { productId } }
    },
    select: { userId: true },
    distinct: ['userId']
  });

  return new Set(orders.map(order => order.userId as string));
}

// GET /api/reviews/product/:productId - Get all reviews for a product
router.get('/product/:productId', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { productId } = req.params;
    const { page, limit, sortBy } = querySchema.parse(req.query);

    // Validate pagination
    if (!(page >= 1)) {
      return res.status(400).json({ error: 'Page must be greater than 0' });
    }
    if (!(limit >= 1 && limit <= 50)) {
      return res.status(400).json({ error: 'Limit must be between 1 and 50' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const skip = (page - 1) * limit;

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' }; // newest (default)
    if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sortBy === 'highest') {
      orderBy = { rating: 'desc' };
    } else if (sortBy === 'lowest') {
      orderBy = { rating: 'asc' };
    }

    // Get reviews with pagination
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }),
      prisma.review.count({ where: { productId } })
    ]);

    // Calculate rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true }
    });

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    ratingDistribution.forEach(item => {
      distribution[item.rating as keyof typeof distribution] = item._count.rating;
    });

    const totalPages = Math.ceil(totalCount / limit);

    // A review is verified only when its author has bought the product
    const verifiedBuyerIds = await getVerifiedBuyerIds(productId);
    const verifiedPurchases = verifiedBuyerIds.size === 0 ? 0 : await prisma.review.count({
      where: { productId, userId: { in: [...verifiedBuyerIds] } }
    });

    res.json({
      success: true,
      data: reviews.map(review => ({ ...review, verified: verifiedBuyerIds.has(review.userId) })),
      statistics: {
        averageRating: product.rating || 0,
        totalReviews: totalCount,
        verifiedPurchases,
        ratingDistribution: distribution
      },
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

// POST /api/reviews - Submit a review
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { productId, rating, comment } = createReviewSchema.parse(req.body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId
        }
      }
    });

    if (existingReview) {
      return res.status(409).json({ 
        error: 'You have already reviewed this product',
        message: 'Use PUT /api/reviews/:id to update your existing review'
      });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId,
        rating,
        comment: comment || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      }
    });

    // Update product rating
    await updateProductRating(productId);

    const verifiedBuyerIds = await getVerifiedBuyerIds(productId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: { ...review, verified: verifiedBuyerIds.has(user.id) }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid review data',
        details: error.errors
      });
    }
    next(error);
  }
});

// PUT /api/reviews/:id - Update a review
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const updateData = updateReviewSchema.parse(req.body);

    // Check if review exists and belongs to user
    const review = await prisma.review.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found or you do not have permission to update it' });
    }

    // Check if there's anything to update
    if (!updateData.rating && !updateData.comment && updateData.comment !== '') {
      return res.status(400).json({ error: 'No update data provided' });
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        ...(updateData.rating !== undefined && { rating: updateData.rating }),
        ...(updateData.comment !== undefined && { comment: updateData.comment || null })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      }
    });

    // Update product rating
    await updateProductRating(review.productId);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid update data',
        details: error.errors
      });
    }
    next(error);
  }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Check if review exists and belongs to user
    const review = await prisma.review.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found or you do not have permission to delete it' });
    }

    const productId = review.productId;

    // Delete review
    await prisma.review.delete({
      where: { id }
    });

    // Update product rating
    await updateProductRating(productId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reviews/user/me - Get current user's reviews
router.get('/user/me', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user;
    const { page, limit } = querySchema.parse(req.query);

    // Validate pagination
    if (!(page >= 1)) {
      return res.status(400).json({ error: 'Page must be greater than 0' });
    }
    if (!(limit >= 1 && limit <= 50)) {
      return res.status(400).json({ error: 'Limit must be between 1 and 50' });
    }

    const skip = (page - 1) * limit;

    // Get user's reviews with pagination
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              category: true,
              price: true,
              inStock: true
            }
          }
        }
      }),
      prisma.review.count({ where: { userId: user.id } })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: reviews,
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

export { router as reviewRoutes }; 