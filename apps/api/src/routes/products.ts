import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  price: z.number().positive('Price must be positive').max(999999.99, 'Price too high'),
  imageUrl: z.string().url('Invalid image URL'),
  category: z.string().min(1, 'Category is required').max(50, 'Category name too long'),
  inStock: z.boolean().optional().default(true)
});

const updateProductSchema = createProductSchema.partial();

const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 12),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  inStock: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  sortBy: z.enum(['name', 'price', 'rating', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// Helper function to build where clause for filtering
const buildWhereClause = (filters: any) => {
  const where: any = {};

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    where.OR = [
      { name: { contains: searchLower } },
      { description: { contains: searchLower } },
      { category: { contains: searchLower } }
    ];
  }

  if (filters.category) {
    where.category = { equals: filters.category };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }

  if (filters.inStock !== undefined) {
    where.inStock = filters.inStock;
  }

  return where;
};

// GET /api/products - Get all products with filtering, search, and pagination
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const query = querySchema.parse(req.query);
    const { page, limit, sortBy, sortOrder, ...filters } = query;

    // Validate pagination
    if (!(page >= 1)) {
      return res.status(400).json({ error: 'Page must be greater than 0' });
    }
    if (!(limit >= 1 && limit <= 100)) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    const skip = (page - 1) * limit;
    const where = buildWhereClause(filters);

    // Get products with pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { reviews: true }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search: filters.search,
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock,
        sortBy,
        sortOrder
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

// GET /api/products/categories - Get all unique categories
router.get('/categories', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });

    res.json({
      success: true,
      data: categories.map(c => c.category)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/featured - Get featured products (highest rated)
router.get('/featured', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const limit = parseInt(req.query.limit as string) || 8;
    
    if (!(limit >= 1 && limit <= 50)) {
      return res.status(400).json({ error: 'Limit must be between 1 and 50' });
    }

    const products = await prisma.product.findMany({
      where: { inStock: true },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      include: {
        _count: {
          select: { reviews: true }
        }
      }
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { reviews: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/products - Create new product (admin only)
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const productData = createProductSchema.parse(req.body);

    // Check if product with same name already exists
    const existingProduct = await prisma.product.findFirst({
      where: { 
        name: { equals: productData.name }
      }
    });

    if (existingProduct) {
      return res.status(409).json({ error: 'Product with this name already exists' });
    }

    const product = await prisma.product.create({
      data: productData,
      include: {
        _count: {
          select: { reviews: true }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid product data',
        details: error.errors
      });
    }
    return next(error);
  }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const updateData = updateProductSchema.parse(req.body);

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If updating name, check for duplicates
    if (updateData.name && updateData.name !== existingProduct.name) {
      const duplicateProduct = await prisma.product.findFirst({
        where: { 
          name: { equals: updateData.name },
          id: { not: id }
        }
      });

      if (duplicateProduct) {
        return res.status(409).json({ error: 'Product with this name already exists' });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { reviews: true }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid update data',
        details: error.errors
      });
    }
    return next(error);
  }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            reviews: true,
            orderItems: true,
            cartItems: true
          }
        }
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product has orders (prevent deletion if it does)
    if (existingProduct._count.orderItems > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete product that has been ordered. Consider marking it as out of stock instead.' 
      });
    }

    // Delete related data first (reviews and cart items)
    await prisma.$transaction([
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } })
    ]);

    return res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/products/:id/stock - Toggle product stock status (admin only)
router.patch('/:id/stock', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const { inStock } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (typeof inStock !== 'boolean') {
      return res.status(400).json({ error: 'inStock must be a boolean value' });
    }

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { inStock },
      include: {
        _count: {
          select: { reviews: true }
        }
      }
    });

    return res.json({
      success: true,
      message: `Product marked as ${inStock ? 'in stock' : 'out of stock'}`,
      data: updatedProduct
    });
  } catch (error) {
    return next(error);
  }
});

export { router as productRoutes }; 