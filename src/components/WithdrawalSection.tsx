import React, { useState, useEffect } from 'react';
import { STORAGE_KEYS, calculateCashAmount } from '../utils/quizData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, ArrowUpCircle, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { safeSupabaseOperation } from '@/utils/supabaseUtils';
import { AdminNotification } from '@/types/adminNotification';

interface WithdrawalRequest {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'rejected';
  type?: 'regular' | 'achievement';
}

interface Achievement {
  id: string;
  type: string;
  month: string;
  reward: number;
  date: string;
  claimed: boolean;
}

const WithdrawalSection: React.FC = () => {
  const [cashAvailable, setCashAvailable] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('quiz_app_withdrawals');
    return saved ? JSON.parse(saved) : [];
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { toast } = useToast();
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  
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
      amount,
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
    
    const pointsToDeduct = amount * 1.5;
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
  
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };
  
  const unclaimedAchievements = achievements.filter(a => !a.claimed);

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
      
      {unclaimedAchievements.length > 0 && (
        <div className="mb-8">
          <h4 className="font-medium mb-3 flex items-center">
            <Award className="w-5 h-5 mr-2 text-primary" />
            Available Rewards
          </h4>
          
          <div className="space-y-4">
            {unclaimedAchievements.map((achievement) => (
              <div key={achievement.id} className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Monthly Target Completed</h5>
                    <p className="text-sm text-muted-foreground">
                      {formatMonth(achievement.month)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold mb-2">₹{achievement.reward.toFixed(2)}</div>
                    <Button 
                      size="sm" 
                      onClick={() => handleClaimAchievement(achievement)}
                      className="btn-shine"
                    >
                      Claim Reward
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-secondary p-4 rounded-xl mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Available for withdrawal</span>
          <span className="text-2xl font-bold">₹{cashAvailable.toFixed(2)}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          1.5 points = ₹1.00
        </div>
      </div>
      
      <form onSubmit={handleWithdrawalRequest} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="amount">
            Withdrawal Amount (₹)
          </label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={withdrawalAmount}
            onChange={(e) => setWithdrawalAmount(e.target.value)}
          />
          {withdrawalAmount && !isNaN(parseFloat(withdrawalAmount)) && (
            <div className="text-xs text-muted-foreground mt-1">
              {(parseFloat(withdrawalAmount) * 1.5).toFixed(0)} points will be deducted
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
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full btn-shine"
          disabled={!withdrawalAmount || !paymentMethod || cashAvailable <= 0}
        >
          <ArrowUpCircle className="w-4 h-4 mr-2" />
          Request Withdrawal
        </Button>
      </form>
      
      {withdrawals.length > 0 && (
        <div className="mt-8">
          <h4 className="font-medium mb-3">Recent Withdrawals</h4>
          
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div 
                key={withdrawal.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-secondary"
              >
                <div>
                  <div className="font-medium">₹{withdrawal.amount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(withdrawal.date).toLocaleDateString()}
                    {withdrawal.type === 'achievement' && (
                      <span className="ml-2 px-1 bg-primary/10 text-primary rounded text-xs">
                        Reward
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {withdrawal.status === 'completed' ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Completed
                    </span>
                  ) : withdrawal.status === 'rejected' ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                      Rejected
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                      Awaiting Approval
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalSection;
