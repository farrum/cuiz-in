
import { useState, useEffect } from 'react';

export type CurrencyDisplay = {
  symbol: string;
  code: string;
  exchangeRate: number; // Rate to convert from INR
  isIndian: boolean;
};

export const useCurrencyDisplay = () => {
  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>({
    symbol: '₹',
    code: 'INR',
    exchangeRate: 1,
    isIndian: true
  });
  
  useEffect(() => {
    const checkLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        const isIndian = data.country === 'IN';
        
        if (!isIndian) {
          setCurrencyDisplay({
            symbol: '$',
            code: 'USD',
            exchangeRate: 0.012, // Approximate INR to USD rate
            isIndian: false
          });
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    };
    
    checkLocation();
  }, []);
  
  return currencyDisplay;
};
