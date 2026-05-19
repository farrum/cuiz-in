
import React from 'react';
import { useCurrencyDisplay } from '@/hooks/useCurrencyDisplay';

interface AvailableBalanceProps {
  cashAvailable: number;
}

const AvailableBalance: React.FC<AvailableBalanceProps> = ({ cashAvailable }) => {
  const currencyDisplay = useCurrencyDisplay();
  
  return (
    <div className="bg-secondary p-4 rounded-xl mb-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Available for withdrawal</span>
        <span className="text-2xl font-bold">
          {currencyDisplay.symbol}{(cashAvailable * currencyDisplay.exchangeRate).toFixed(2)} {currencyDisplay.code}
        </span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        2 gems = {currencyDisplay.symbol}{currencyDisplay.exchangeRate.toFixed(2)} {currencyDisplay.code}
      </div>
    </div>
  );
};

export default AvailableBalance;
