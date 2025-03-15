
import React from 'react';
import { IndianRupee } from 'lucide-react';
import { useWithdrawal } from '@/hooks/useWithdrawal';
import AchievementRewardCard from './withdrawals/AchievementRewardCard';
import WithdrawalForm from './withdrawals/WithdrawalForm';
import WithdrawalHistory from './withdrawals/WithdrawalHistory';
import CashBalance from './withdrawals/CashBalance';

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
    formatMonth
  } = useWithdrawal();

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
      
      <AchievementRewardCard 
        achievements={achievements}
        formatMonth={formatMonth}
        onClaim={handleClaimAchievement}
      />
      
      <CashBalance cashAvailable={cashAvailable} />
      
      <WithdrawalForm
        cashAvailable={cashAvailable}
        withdrawalAmount={withdrawalAmount}
        paymentMethod={paymentMethod}
        onWithdrawalAmountChange={setWithdrawalAmount}
        onPaymentMethodChange={setPaymentMethod}
        onSubmit={handleWithdrawalRequest}
      />
      
      <WithdrawalHistory withdrawals={withdrawals} />
    </div>
  );
};

export default WithdrawalSection;
