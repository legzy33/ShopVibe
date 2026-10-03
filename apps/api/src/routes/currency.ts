import { Router, Request, Response, NextFunction } from 'express';
import { getExchangeRates } from '../services/exchangeRates';

const router = Router();

// GET /api/currency/rates - Current exchange rates from the base currency
router.get('/rates', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { base, rates, fetchedAt } = await getExchangeRates();

    res.json({
      success: true,
      base,
      rates,
      fetchedAt
    });
  } catch (error) {
    next(error);
  }
});

export { router as currencyRoutes };
