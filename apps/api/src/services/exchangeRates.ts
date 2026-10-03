import { BASE_CURRENCY, ExchangeRates, SUPPORTED_CURRENCIES, SupportedCurrency } from '@shopvibe/shared';
import { prisma } from '../config/database';

// European Central Bank reference rates, published once per working day
const RATES_URL = `https://api.frankfurter.dev/v1/latest?base=${BASE_CURRENCY}&symbols=${
  SUPPORTED_CURRENCIES.filter(currency => currency !== BASE_CURRENCY).join(',')
}`;
const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000;
const RETRY_INTERVAL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;

export interface RatesSnapshot {
  base: string;
  rates: ExchangeRates;
  fetchedAt: Date | null;
}

let cache: RatesSnapshot | null = null;
let nextRefreshAt = 0;

const fetchLatestRates = async (): Promise<ExchangeRates> => {
  const response = await fetch(RATES_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

  if (!response.ok) {
    throw new Error(`Exchange rate service responded with ${response.status}`);
  }

  const body = await response.json() as { rates?: Record<string, number> };
  const rates: ExchangeRates = { [BASE_CURRENCY]: 1 };

  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === BASE_CURRENCY) continue;

    const rate = body.rates?.[currency];
    if (typeof rate !== 'number' || !(rate > 0)) {
      throw new Error(`Exchange rate service returned no usable rate for ${currency}`);
    }
    rates[currency] = rate;
  }

  return rates;
};

const saveRates = async (rates: ExchangeRates, fetchedAt: Date): Promise<void> => {
  await prisma.$transaction(
    Object.entries(rates).map(([currency, rate]) =>
      prisma.exchangeRate.upsert({
        where: { currency },
        update: { rate, fetchedAt },
        create: { currency, rate: rate as number, fetchedAt }
      })
    )
  );
};

// Last rates that were fetched successfully, so a restart or an outage of the
// rate service does not stop customers paying in other currencies
const loadSavedRates = async (): Promise<RatesSnapshot> => {
  const rows = await prisma.exchangeRate.findMany();
  const rates: ExchangeRates = { [BASE_CURRENCY]: 1 };
  let fetchedAt: Date | null = null;

  for (const row of rows) {
    if (row.currency === BASE_CURRENCY || !SUPPORTED_CURRENCIES.includes(row.currency as SupportedCurrency)) continue;
    rates[row.currency as SupportedCurrency] = row.rate;
    if (!fetchedAt || row.fetchedAt < fetchedAt) fetchedAt = row.fetchedAt;
  }

  return { base: BASE_CURRENCY, rates, fetchedAt };
};

export const getExchangeRates = async (): Promise<RatesSnapshot> => {
  if (cache && Date.now() < nextRefreshAt) {
    return cache;
  }

  try {
    const rates = await fetchLatestRates();
    const fetchedAt = new Date();
    await saveRates(rates, fetchedAt);
    cache = { base: BASE_CURRENCY, rates, fetchedAt };
    nextRefreshAt = Date.now() + REFRESH_INTERVAL_MS;
  } catch (error) {
    console.warn('Could not refresh exchange rates, using the last saved ones:', error);
    cache = await loadSavedRates();
    nextRefreshAt = Date.now() + RETRY_INTERVAL_MS;
  }

  return cache;
};

// Rate for one currency, or null when no rate has ever been fetched for it
export const getExchangeRate = async (currency: SupportedCurrency): Promise<number | null> => {
  if (currency === BASE_CURRENCY) return 1;

  const { rates } = await getExchangeRates();
  return rates[currency] ?? null;
};
