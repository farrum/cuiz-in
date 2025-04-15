
import { CurrencyDisplay } from '@/hooks/useCurrencyDisplay';

export const convertToDisplayCurrency = (
  amountInINR: number, 
  currencyDisplay: CurrencyDisplay
): number => {
  return amountInINR * currencyDisplay.exchangeRate;
};

export const formatCurrencyAmount = (
  amount: number, 
  currencyDisplay: CurrencyDisplay
): string => {
  return `${currencyDisplay.symbol}${amount.toFixed(2)} ${currencyDisplay.code}`;
};
