
import React from 'react';
import { useWithdrawalSection } from '@/hooks/useWithdrawalSection';
import WithdrawalHeader from './WithdrawalHeader';
import AvailableBalance from './AvailableBalance';
import WithdrawalForm from './WithdrawalForm';
import WithdrawalHistory from './WithdrawalHistory';
import AchievementsList from './AchievementsList';
import { useCurrencyDisplay } from '@/hooks/useCurrencyDisplay';

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
    handleClaimAchievement,
    userId,
    MINIMUM_WITHDRAWAL_AMOUNT
  } = useWithdrawalSection();
  
  const currencyDisplay = useCurrencyDisplay();

  return (
    <div className="quiz-card">
      <WithdrawalHeader />
      
      <AchievementsList 
        achievements={achievements}
        onClaimAchievement={handleClaimAchievement}
      />
      
      <AvailableBalance cashAvailable={cashAvailable} />
      
      <WithdrawalForm
        cashAvailable={cashAvailable}
        withdrawalAmount={withdrawalAmount}
        paymentMethod={paymentMethod}
        currencyDisplay={currencyDisplay}
        onAmountChange={setWithdrawalAmount}
        onPaymentMethodChange={setPaymentMethod}
        onSubmit={handleWithdrawalRequest}
        minimumAmount={MINIMUM_WITHDRAWAL_AMOUNT}
      />
      
      <WithdrawalHistory withdrawals={withdrawals} userId={userId} />
    </div>
  );
};

export default WithdrawalSection;
