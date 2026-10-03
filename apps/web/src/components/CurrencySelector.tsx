'use client';

import React, { useState } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { CURRENCY_SYMBOLS, SupportedCurrency } from '@shopvibe/shared';

const CurrencySelector: React.FC = () => {
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const currencyNames = {
    USD: 'US Dollar',
    GBP: 'British Pound',
    EUR: 'Euro'
  };

  const handleCurrencyChange = (newCurrency: SupportedCurrency) => {
    setCurrency(newCurrency);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Select currency"
      >
        <span className="text-lg">{CURRENCY_SYMBOLS[currency]}</span>
        <span className="hidden sm:inline">{currency}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {availableCurrencies.map((curr) => (
                <button
                  key={curr}
                  onClick={() => handleCurrencyChange(curr)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                    currency === curr ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{CURRENCY_SYMBOLS[curr]}</span>
                    <div>
                      <div className="font-medium">{curr}</div>
                      <div className="text-xs text-gray-500">{currencyNames[curr]}</div>
                    </div>
                  </div>
                  {currency === curr && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-200 px-4 py-2">
              <div className="text-xs text-gray-500">
                Exchange rates updated daily
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySelector; 