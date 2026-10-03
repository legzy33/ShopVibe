// The store sells in a single currency: prices are stored, shown and charged in it
export const STORE_CURRENCY = 'GBP';

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: STORE_CURRENCY,
  }).format(price)
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