
import React from 'react';

interface CashBalanceProps {
  cashAvailable: number;
}

const CashBalance: React.FC<CashBalanceProps> = ({ cashAvailable }) => {
  return (
    <div className="bg-secondary p-4 rounded-xl mb-6">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Available for withdrawal</span>
        <span className="text-2xl font-bold">₹{cashAvailable.toFixed(2)}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        100 points = ₹1.00
      </div>
    </div>
  );
};

export default CashBalance;
