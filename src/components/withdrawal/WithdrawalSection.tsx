
import React from 'react';
import { IndianRupee } from 'lucide-react';
import { useWithdrawalSection } from '@/hooks/useWithdrawalSection';
import { useCurrencyDisplay } from '@/hooks/useCurrencyDisplay';
import WithdrawalForm from './WithdrawalForm';
import WithdrawalHistory from './WithdrawalHistory';
import AchievementsList from './AchievementsList';

const WithdrawalSection: React.FC = () => {
  const {
    cashAvailable,
    withdrawalAmount,
    setWithdrawalAmount,
    paymentMethod,
    setPaymentMethod,
    withdrawals,
    achievements,
    handleWithdrawalRequest,
    handleClaimAchievement
  } = useWithdrawalSection();
  
  const currencyDisplay = useCurrencyDisplay();

  return (
    <div className="quiz-card">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-full">
          <IndianRupee className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-medium">Cash Withdrawal</h3>
          <p className="text-sm text-muted-foreground">Convert your points to cash</p>
        </div>
      </div>
      
      <AchievementsList 
        achievements={achievements}
        onClaimAchievement={handleClaimAchievement}
      />
      
      <div className="bg-secondary p-4 rounded-xl mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Available for withdrawal</span>
          <span className="text-2xl font-bold">
            {currencyDisplay.symbol}{(cashAvailable * currencyDisplay.exchangeRate).toFixed(2)} {currencyDisplay.code}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          2 points = {currencyDisplay.symbol}{currencyDisplay.exchangeRate.toFixed(2)} {currencyDisplay.code}
        </div>
      </div>
      
      <WithdrawalForm
        cashAvailable={cashAvailable}
        withdrawalAmount={withdrawalAmount}
        paymentMethod={paymentMethod}
        currencyDisplay={currencyDisplay}
        onAmountChange={setWithdrawalAmount}
        onPaymentMethodChange={setPaymentMethod}
        onSubmit={handleWithdrawalRequest}
      />
      
      <WithdrawalHistory withdrawals={withdrawals} />
    </div>
  );
};

export default WithdrawalSection;
