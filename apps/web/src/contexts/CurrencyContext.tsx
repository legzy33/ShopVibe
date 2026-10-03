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
import { CURRENCY_COOKIE } from './currencyCookie';

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

const saveCurrency = (currency: SupportedCurrency) => {
  localStorage.setItem(STORAGE_KEY, currency);
  document.cookie = `${CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax`;
};

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
  // Read on the server from the visitor's cookie, with the rates current at render time
  initialCurrency?: SupportedCurrency | null;
  initialRates?: ExchangeRates | null;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children, initialCurrency, initialRates }) => {
  const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrency>(initialCurrency || BASE_CURRENCY);
  const [rates, setRates] = useState<ExchangeRates>({ ...initialRates, [BASE_CURRENCY]: 1 });

  const refreshRates = useCallback(async () => {
    try {
      const response = await apiService.getExchangeRates();
      setRates({ ...response.rates, [BASE_CURRENCY]: 1 });
    } catch (err) {
      // Without rates the store simply stays in the base currency
      console.error('Failed to load exchange rates:', err);
    }
  }, []);

  useEffect(() => {
    // A choice saved before the cookie existed lives only in localStorage; adopt it once
    if (!initialCurrency) {
      const savedCurrency = localStorage.getItem(STORAGE_KEY);
      if (isSupportedCurrency(savedCurrency)) {
        setPreferredCurrency(savedCurrency);
        saveCurrency(savedCurrency);
      }
    }

    if (!initialRates) {
      refreshRates();
    }
  }, [initialCurrency, initialRates, refreshRates]);

  const setCurrency = useCallback((newCurrency: SupportedCurrency) => {
    setPreferredCurrency(newCurrency);
    saveCurrency(newCurrency);
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
