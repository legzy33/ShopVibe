import './config/loadEnv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { cartRoutes } from './routes/cart';
import { orderRoutes } from './routes/orders';
import { reviewRoutes } from './routes/reviews';
import { userRoutes } from './routes/users';
import { paymentRoutes } from './routes/payments';
import { currencyRoutes } from './routes/currency';
import { handleStripeWebhook } from './services/paymentService';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', limiter);

// Stricter limit on login/register to slow down password guessing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// Stripe webhook: needs the raw body to check the signature, so it sits before the JSON parser
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  try {
    const handled = await handleStripeWebhook(req.body, signature);

    if (!handled) {
      return res.status(503).json({ error: 'Stripe webhooks are not configured' });
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return res.status(400).json({ error: 'Invalid webhook' });
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/currency', currencyRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export { app };
