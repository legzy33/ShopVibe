import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/users/me - Get current user profile
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user; // Set by authenticate middleware

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get full user data with avatar
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!fullUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: fullUser
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/profile - Legacy endpoint (keeping for backward compatibility)
router.get('/profile', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const user = (req as any).user; // Set by authenticate middleware

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get full user data with avatar
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!fullUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: fullUser
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes }; 