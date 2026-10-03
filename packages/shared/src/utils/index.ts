// Prices are stored in the base currency. Customers can pay in any supported
// currency; amounts are converted from the base at the rate saved on the order.
export const BASE_CURRENCY = 'GBP';
export const SUPPORTED_CURRENCIES = ['GBP', 'EUR', 'USD'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Units of each currency per one unit of the base currency
export type ExchangeRates = Partial<Record<SupportedCurrency, number>>;

export const TAX_RATE = 0.08;
export const SHIPPING_FEE = 9.99; // in the base currency
export const FREE_SHIPPING_THRESHOLD = 50; // in the base currency

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$'
};

const CURRENCY_LOCALES: Record<SupportedCurrency, string> = {
  GBP: 'en-GB',
  EUR: 'en-IE',
  USD: 'en-US'
};

export const isSupportedCurrency = (value: unknown): value is SupportedCurrency =>
  SUPPORTED_CURRENCIES.includes(value as SupportedCurrency);

export const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export const formatPrice = (price: number, currency: SupportedCurrency = BASE_CURRENCY): string => {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: 'currency',
    currency,
  }).format(price)
}

// Convert an amount in the base currency at the given rate
export const convertFromBase = (amount: number, rate: number = 1): number => roundMoney(amount * rate);

export interface OrderTotalsLine {
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderTotals {
  lines: OrderTotalsLine[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  // Base-currency amount still needed to qualify for free shipping, converted
  amountToFreeShipping: number;
}

// The single source of truth for order maths, used by the API when it creates
// an order and by the storefront when it previews one. `price` is in the base
// currency; every returned amount is in the currency the rate converts to.
export const calculateOrderTotals = (
  items: Array<{ price: number; quantity: number }>,
  rate: number = 1
): OrderTotals => {
  const lines = items.map(item => {
    const unitPrice = convertFromBase(item.price, rate);
    return { unitPrice, quantity: item.quantity, lineTotal: roundMoney(unitPrice * item.quantity) };
  });

  const baseSubtotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const tax = roundMoney(subtotal * TAX_RATE);
  const qualifiesForFreeShipping = baseSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = qualifiesForFreeShipping ? 0 : convertFromBase(SHIPPING_FEE, rate);

  return {
    lines,
    subtotal,
    tax,
    shipping,
    total: roundMoney(subtotal + tax + shipping),
    amountToFreeShipping: qualifiesForFreeShipping ? 0 : convertFromBase(FREE_SHIPPING_THRESHOLD - baseSubtotal, rate)
  };
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
} 