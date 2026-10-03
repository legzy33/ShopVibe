'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedCurrency } from '@shopvibe/shared';

interface CurrencyContextType {
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
  availableCurrencies: SupportedCurrency[];
}

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
  const [currency, setCurrencyState] = useState<SupportedCurrency>('USD');

  const availableCurrencies: SupportedCurrency[] = ['USD', 'GBP', 'EUR'];

  // Load currency preference from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('shopvibe_currency') as SupportedCurrency;
    if (savedCurrency && availableCurrencies.includes(savedCurrency)) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setCurrency = (newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('shopvibe_currency', newCurrency);
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    availableCurrencies
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}; 