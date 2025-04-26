
import { useState } from 'react';
import { STORAGE_KEYS } from '@/utils/constants';

export const useWithdrawalState = () => {
  const [cashAvailable, setCashAvailable] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID) || '';
  const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';

  return {
    cashAvailable,
    setCashAvailable,
    withdrawalAmount,
    setWithdrawalAmount,
    paymentMethod,
    setPaymentMethod,
    userId,
    userName,
  };
};
