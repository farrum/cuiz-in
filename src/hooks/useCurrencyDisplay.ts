
import { useState, useEffect } from 'react';

export type CurrencyDisplay = {
  symbol: string;
  code: string;
  exchangeRate: number; // Rate to convert from INR
  isIndian: boolean;
};

export const useCurrencyDisplay = () => {
  // Default to USD for international users
  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>({
    symbol: '$',
    code: 'USD',
    exchangeRate: 0.012, // INR to USD rate
    isIndian: false
  });
  
  useEffect(() => {
    const checkLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        // Only switch to INR for Indian users
        if (data.country === 'IN') {
          setCurrencyDisplay({
            symbol: '₹',
            code: 'INR',
            exchangeRate: 1,
            isIndian: true
          });
        }
      } catch (error) {
        // Keep USD as default on error
        console.error('Error fetching location:', error);
      }
    };
    
    checkLocation();
  }, []);
  
  return currencyDisplay;
};
