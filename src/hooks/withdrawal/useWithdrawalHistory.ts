
import { useState, useEffect } from 'react';
import { WithdrawalRequest } from '@/types/withdrawal';

export const useWithdrawalHistory = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('quiz_app_withdrawals');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('quiz_app_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  return {
    withdrawals,
    setWithdrawals,
  };
};
