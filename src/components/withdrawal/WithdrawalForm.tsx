
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpCircle } from 'lucide-react';
import { CurrencyDisplay } from '@/hooks/useCurrencyDisplay';

interface WithdrawalFormProps {
  cashAvailable: number;
  withdrawalAmount: string;
  paymentMethod: string;
  currencyDisplay: CurrencyDisplay;
  minimumAmount: number;
  onAmountChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const WithdrawalForm: React.FC<WithdrawalFormProps> = ({
  cashAvailable,
  withdrawalAmount,
  paymentMethod,
  currencyDisplay,
  minimumAmount,
  onAmountChange,
  onPaymentMethodChange,
  onSubmit
}) => {
  const isAmountValid = withdrawalAmount && 
    !isNaN(parseFloat(withdrawalAmount)) && 
    parseFloat(withdrawalAmount) >= minimumAmount;
  
  const isInsufficientFunds = withdrawalAmount && 
    !isNaN(parseFloat(withdrawalAmount)) && 
    parseFloat(withdrawalAmount) > cashAvailable;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="amount">
          Withdrawal Amount ({currencyDisplay.symbol})
        </label>
        <Input
          id="amount"
          type="number"
          min={minimumAmount.toString()}
          step="0.01"
          placeholder={`${minimumAmount.toFixed(2)} minimum`}
          value={withdrawalAmount}
          onChange={(e) => onAmountChange(e.target.value)}
        />
        
        {withdrawalAmount && !isNaN(parseFloat(withdrawalAmount)) && (
          <div className="text-xs text-muted-foreground mt-1">
            {parseFloat(withdrawalAmount) < minimumAmount ? (
              <span className="text-red-500">Minimum withdrawal amount is ₹{minimumAmount}</span>
            ) : (
              <span>{(parseFloat(withdrawalAmount) * 2).toFixed(0)} points will be deducted</span>
            )}
          </div>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="payment">
          Payment Details
        </label>
        <Input
          id="payment"
          placeholder="UPI ID or bank account"
          value={paymentMethod}
          onChange={(e) => onPaymentMethodChange(e.target.value)}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full btn-shine"
        disabled={!withdrawalAmount || !paymentMethod || isInsufficientFunds || !isAmountValid}
      >
        <ArrowUpCircle className="w-4 h-4 mr-2" />
        Request Withdrawal
      </Button>
    </form>
  );
};

export default WithdrawalForm;
