'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  BASE_CURRENCY,
  ExchangeRates,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
  convertFromBase,
  formatPrice,
  isSupportedCurrency
} from '@shopvibe/shared';
import { apiService } from '../services/api';

interface CurrencyContextType {
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
  // Only currencies we currently have a rate for
  availableCurrencies: SupportedCurrency[];
  // Units of the selected currency per one unit of the base currency
  rate: number;
  // Format a base-currency amount (such as a product price) in the selected currency
  formatFromBase: (amountInBase: number) => string;
  refreshRates: () => Promise<void>;
}

const STORAGE_KEY = 'shopvibe_currency';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrency>(BASE_CURRENCY);
  const [rates, setRates] = useState<ExchangeRates>({ [BASE_CURRENCY]: 1 });

  const refreshRates = useCallback(async () => {
    try {
      const response = await apiService.getExchangeRates();
      setRates({ ...response.rates, [BASE_CURRENCY]: 1 });
    } catch (err) {
      // Without rates the store simply stays in the base currency
      console.error('Failed to load exchange rates:', err);
    }
  }, []);

  // Load the saved preference and the current rates on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem(STORAGE_KEY);
    if (isSupportedCurrency(savedCurrency)) {
      setPreferredCurrency(savedCurrency);
    }

    refreshRates();
  }, [refreshRates]);

  const setCurrency = useCallback((newCurrency: SupportedCurrency) => {
    setPreferredCurrency(newCurrency);
    localStorage.setItem(STORAGE_KEY, newCurrency);
  }, []);

  const value = useMemo<CurrencyContextType>(() => {
    const availableCurrencies = SUPPORTED_CURRENCIES.filter(code => typeof rates[code] === 'number');
    // Fall back to the base currency until a rate for the preferred one is known
    const currency = availableCurrencies.includes(preferredCurrency) ? preferredCurrency : BASE_CURRENCY;
    const rate = rates[currency] ?? 1;

    return {
      currency,
      setCurrency,
      availableCurrencies,
      rate,
      formatFromBase: (amountInBase: number) => formatPrice(convertFromBase(amountInBase, rate), currency),
      refreshRates
    };
  }, [preferredCurrency, rates, setCurrency, refreshRates]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};
