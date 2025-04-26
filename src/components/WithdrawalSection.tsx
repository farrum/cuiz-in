
import React from 'react';
import { useWithdrawalSection } from '@/hooks/useWithdrawalSection';
import WithdrawalHeader from './withdrawal/WithdrawalHeader';
import AvailableBalance from './withdrawal/AvailableBalance';
import WithdrawalForm from './withdrawal/WithdrawalForm';
import WithdrawalHistory from './withdrawal/WithdrawalHistory';
import AchievementsList from './withdrawal/AchievementsList';
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
