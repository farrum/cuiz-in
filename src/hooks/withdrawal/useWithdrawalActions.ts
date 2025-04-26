
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeSupabaseOperation } from '@/utils/supabaseUtils';
import { useToast } from '@/hooks/use-toast';
import { calculateCashAmount } from '@/utils/quizData';
import { Achievement } from '@/types/achievement';

export const useWithdrawalActions = (
  userId: string,
  userName: string,
  setWithdrawals: (updater: (prev: any[]) => any[]) => void
) => {
  const { toast } = useToast();

  const handleWithdrawalRequest = async (
    e: React.FormEvent,
    withdrawalAmount: string,
    paymentMethod: string
  ) => {
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

    const transactionId = Date.now().toString();
    const newWithdrawal = {
      id: transactionId,
      amount: amount,
      date: new Date().toISOString(),
      status: 'pending',
      type: 'regular',
      userId: userId
    };

    setWithdrawals(prev => [...prev, newWithdrawal]);

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
        read: false, // Add the required read property
        data: { 
          transaction_id: transactionId,
          amount: amount,
          method: paymentMethod
        }
      });

      const pointsToDeduct = amount * 2;
      const currentPoints = parseInt(localStorage.getItem('quiz_app_user_points') || '0');
      const newPoints = currentPoints - pointsToDeduct;
      localStorage.setItem('quiz_app_user_points', newPoints.toString());

      window.dispatchEvent(new Event('pointsUpdated'));

      toast({
        title: "Withdrawal Requested",
        description: `Your withdrawal request for ₹${amount.toFixed(2)} has been submitted for approval`,
      });

    } catch (err) {
      console.error('Error creating payment record:', err);
      toast({
        title: "Error",
        description: "An error occurred while processing your request.",
        variant: "destructive",
      });
    }
  };

  const handleClaimAchievement = async (achievement: Achievement) => {
    const transactionId = Date.now().toString();
    
    setWithdrawals(prev => [...prev, {
      id: transactionId,
      amount: achievement.reward,
      date: new Date().toISOString(),
      status: 'pending',
      type: 'achievement',
      userId: userId
    }]);

    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          username: userName,
          amount: achievement.reward,
          method: 'Monthly Reward',
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
        read: false, // Add the required read property
        data: { 
          transaction_id: transactionId,
          amount: achievement.reward,
          achievement_type: achievement.type,
          achievement_month: achievement.month
        }
      });

      toast({
        title: "Reward Claimed",
        description: `Your reward of ₹${achievement.reward.toFixed(2)} has been requested for withdrawal`,
      });

    } catch (err) {
      console.error('Error creating payment record:', err);
    }
  };

  return {
    handleWithdrawalRequest,
    handleClaimAchievement,
  };
};
