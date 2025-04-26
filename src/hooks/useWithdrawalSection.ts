
import { useEffect } from 'react';
import { useWithdrawalState } from './withdrawal/useWithdrawalState';
import { useWithdrawalHistory } from './withdrawal/useWithdrawalHistory';
import { useAchievements } from './withdrawal/useAchievements';
import { useWithdrawalActions } from './withdrawal/useWithdrawalActions';
import { MINIMUM_WITHDRAWAL_AMOUNT } from './withdrawal/constants';
import { calculateCashAmount } from '@/utils/quizData';
import { STORAGE_KEYS } from '@/utils/constants';

export const useWithdrawalSection = () => {
  const {
    cashAvailable,
    setCashAvailable,
    withdrawalAmount,
    setWithdrawalAmount,
    paymentMethod,
    setPaymentMethod,
    userId,
    userName
  } = useWithdrawalState();

  const { withdrawals, setWithdrawals } = useWithdrawalHistory();
  const { achievements, setAchievements } = useAchievements();
  const { handleWithdrawalRequest: handleWithdrawal, handleClaimAchievement } = 
    useWithdrawalActions(userId, userName, setWithdrawals);

  useEffect(() => {
    const savedPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setCashAvailable(calculateCashAmount(savedPoints));
    
    const upiId = localStorage.getItem('quiz_app_user_upi');
    if (upiId) {
      setPaymentMethod(upiId);
    }
    
    const savedAchievements = JSON.parse(localStorage.getItem('quiz_app_achievements') || '[]');
    setAchievements(savedAchievements);
  }, []);

  const handleWithdrawalRequest = (e: React.FormEvent) => {
    handleWithdrawal(e, withdrawalAmount, paymentMethod);
    setWithdrawalAmount('');
  };

  return {
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
  };
};
