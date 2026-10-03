export type SupportedCurrency = 'USD' | 'GBP' | 'EUR';

export const CURRENCY_SYMBOLS = {
  USD: '$',
  GBP: '£',
  EUR: '€'
} as const;

// Current exchange rates (would typically come from an API)
export const EXCHANGE_RATES = {
  USD: { USD: 1, GBP: 0.7393, EUR: 0.8576 },
  GBP: { USD: 1.3526, GBP: 1, EUR: 1.1598 },
  EUR: { USD: 1.1661, GBP: 0.8622, EUR: 1 }
} as const;

export const formatPrice = (price: number, currency: SupportedCurrency = 'USD'): string => {
  const locales = {
    USD: 'en-US',
    GBP: 'en-GB', 
    EUR: 'en-EU'
  };

  return new Intl.NumberFormat(locales[currency], {
    style: 'currency',
    currency: currency,
  }).format(price)
}

export const convertCurrency = (
  amount: number, 
  fromCurrency: SupportedCurrency, 
  toCurrency: SupportedCurrency
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  const rate = EXCHANGE_RATES[fromCurrency][toCurrency];
  return Number((amount * rate).toFixed(2));
}

export const formatPriceWithConversion = (
  price: number, 
  originalCurrency: SupportedCurrency = 'USD', 
  displayCurrency: SupportedCurrency = 'USD'
): string => {
  const convertedPrice = convertCurrency(price, originalCurrency, displayCurrency);
  return formatPrice(convertedPrice, displayCurrency);
}

export const calculateTax = (subtotal: number, taxRate: number = 0.08): number => {
  return subtotal * taxRate
}

export const calculateShipping = (subtotal: number): number => {
  return subtotal >= 50 ? 0 : 9.99
}

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
} 