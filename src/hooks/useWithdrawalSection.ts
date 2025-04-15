
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS, calculateCashAmount } from '@/utils/quizData';
import { useToast } from "@/hooks/use-toast";
import { safeSupabaseOperation } from '@/utils/supabaseUtils';
import { WithdrawalRequest } from '@/types/withdrawal';
import { Achievement } from '@/types/achievement';

export const useWithdrawalSection = () => {
  const [cashAvailable, setCashAvailable] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('quiz_app_withdrawals');
    return saved ? JSON.parse(saved) : [];
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const savedPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setCashAvailable(calculateCashAmount(savedPoints));
    
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID) || '';
    const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
    setUserId(userId);
    setUserName(userName);
    
    const savedAchievements = JSON.parse(localStorage.getItem('quiz_app_achievements') || '[]');
    setAchievements(savedAchievements);
    
    const upiId = localStorage.getItem('quiz_app_user_upi');
    if (upiId) {
      setPaymentMethod(upiId);
    }
    
    if (userId) {
      fetchPaymentUpdates(userId);
    }
    
    const intervalId = setInterval(() => {
      if (userId) {
        fetchPaymentUpdates(userId);
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchPaymentUpdates = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching payment updates:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const localWithdrawals = JSON.parse(localStorage.getItem('quiz_app_withdrawals') || '[]');
        
        const updatedWithdrawals = localWithdrawals.map((withdrawal: WithdrawalRequest) => {
          const matchingPayment = data.find(p => p.transaction_id === withdrawal.id);
          if (matchingPayment) {
            return {
              ...withdrawal,
              status: matchingPayment.status as 'pending' | 'completed' | 'rejected'
            };
          }
          return withdrawal;
        });
        
        setWithdrawals(updatedWithdrawals);
        localStorage.setItem('quiz_app_withdrawals', JSON.stringify(updatedWithdrawals));
      }
    } catch (err) {
      console.error('Error checking payment updates:', err);
    }
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawalAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }
    
    if (amount > cashAvailable) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough funds for this withdrawal",
        variant: "destructive",
      });
      return;
    }
    
    if (!paymentMethod.trim()) {
      toast({
        title: "Missing Payment Details",
        description: "Please enter your payment details",
        variant: "destructive",
      });
      return;
    }
    
    const transactionId = Date.now().toString();
    
    const newWithdrawal: WithdrawalRequest = {
      id: transactionId,
      amount: amount,
      date: new Date().toISOString(),
      status: 'pending',
      type: 'regular'
    };
    
    const updatedWithdrawals = [...withdrawals, newWithdrawal];
    setWithdrawals(updatedWithdrawals);
    localStorage.setItem('quiz_app_withdrawals', JSON.stringify(updatedWithdrawals));
    
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          username: userName,
          amount: amount,
          method: paymentMethod,
          type: 'withdrawal',
          status: 'pending',
          transaction_id: transactionId,
          date: new Date().toISOString().split('T')[0]
        });
        
      if (error) {
        console.error('Error creating payment record:', error);
        toast({
          title: "Error",
          description: "Failed to submit withdrawal request. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      await safeSupabaseOperation.adminNotifications.insert({
        type: 'withdrawal_request',
        message: `New withdrawal request for ₹${amount.toFixed(2)}`,
        user_id: userId,
        read: false,
        data: { 
          transaction_id: transactionId,
          amount: amount,
          method: paymentMethod
        }
      });
        
    } catch (err) {
      console.error('Error creating payment record:', err);
    }
    
    const pointsToDeduct = amount * 2;
    const currentPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    const newPoints = currentPoints - pointsToDeduct;
    localStorage.setItem(STORAGE_KEYS.USER_POINTS, newPoints.toString());
    
    setCashAvailable(calculateCashAmount(newPoints));
    
    window.dispatchEvent(new Event('pointsUpdated'));
    
    setWithdrawalAmount('');
    
    toast({
      title: "Withdrawal Requested",
      description: `Your withdrawal request for ₹${amount.toFixed(2)} has been submitted for approval`,
    });
  };

  const handleClaimAchievement = async (achievement: Achievement) => {
    const transactionId = Date.now().toString();
    
    const newWithdrawal: WithdrawalRequest = {
      id: transactionId,
      amount: achievement.reward,
      date: new Date().toISOString(),
      status: 'pending',
      type: 'achievement'
    };
    
    const updatedWithdrawals = [...withdrawals, newWithdrawal];
    setWithdrawals(updatedWithdrawals);
    localStorage.setItem('quiz_app_withdrawals', JSON.stringify(updatedWithdrawals));
    
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          username: userName,
          amount: achievement.reward,
          method: paymentMethod || 'Monthly Reward',
          type: 'achievement',
          status: 'pending',
          transaction_id: transactionId,
          date: new Date().toISOString().split('T')[0]
        });
        
      if (error) {
        console.error('Error creating payment record:', error);
        return;
      }
      
      await safeSupabaseOperation.adminNotifications.insert({
        type: 'achievement_claim',
        message: `Achievement reward claim for ₹${achievement.reward.toFixed(2)}`,
        user_id: userId,
        read: false,
        data: { 
          transaction_id: transactionId,
          amount: achievement.reward,
          achievement_type: achievement.type,
          achievement_month: achievement.month
        }
      });
        
    } catch (err) {
      console.error('Error creating payment record:', err);
    }
    
    const updatedAchievements = achievements.map(a => 
      a.id === achievement.id ? { ...a, claimed: true } : a
    );
    setAchievements(updatedAchievements);
    localStorage.setItem('quiz_app_achievements', JSON.stringify(updatedAchievements));
    
    toast({
      title: "Reward Claimed",
      description: `Your reward of ₹${achievement.reward.toFixed(2)} has been requested for withdrawal`,
    });
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
    handleClaimAchievement
  };
};
