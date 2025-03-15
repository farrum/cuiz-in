
import { useState, useEffect } from 'react';
import { STORAGE_KEYS, calculateCashAmount } from '@/utils/quizData';
import { useToast } from "@/hooks/use-toast";
import { WithdrawalRequest, Achievement } from '@/types/withdrawal';

export function useWithdrawal() {
  const [cashAvailable, setCashAvailable] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('quiz_app_withdrawals');
    return saved ? JSON.parse(saved) : [];
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const savedPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setCashAvailable(calculateCashAmount(savedPoints));
    
    // Load achievements
    const savedAchievements = JSON.parse(localStorage.getItem('quiz_app_achievements') || '[]');
    setAchievements(savedAchievements);
    
    // Get UPI ID from localStorage for payment method
    const upiId = localStorage.getItem('quiz_app_user_upi');
    if (upiId) {
      setPaymentMethod(upiId);
    }
  }, []);
  
  const handleWithdrawalRequest = (e: React.FormEvent) => {
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
    
    // Create withdrawal request
    const newWithdrawal: WithdrawalRequest = {
      id: Date.now().toString(),
      amount,
      date: new Date().toISOString(),
      status: 'pending',
      type: 'regular'
    };
    
    const updatedWithdrawals = [...withdrawals, newWithdrawal];
    setWithdrawals(updatedWithdrawals);
    localStorage.setItem('quiz_app_withdrawals', JSON.stringify(updatedWithdrawals));
    
    // Subtract points (only when withdrawal is confirmed in a real app)
    const pointsToDeduct = amount * 100;
    const currentPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    const newPoints = currentPoints - pointsToDeduct;
    localStorage.setItem(STORAGE_KEYS.USER_POINTS, newPoints.toString());
    
    // Update available cash
    setCashAvailable(calculateCashAmount(newPoints));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('pointsUpdated'));
    
    // Reset form
    setWithdrawalAmount('');
    
    toast({
      title: "Withdrawal Requested",
      description: `Your withdrawal request for ₹${amount.toFixed(2)} has been submitted`,
    });
    
    // Simulate processing in a real app
    setTimeout(() => {
      simulateWithdrawalProcessing(newWithdrawal.id);
    }, 5000);
  };
  
  const handleClaimAchievement = (achievement: Achievement) => {
    // Create a withdrawal request for the achievement reward
    const newWithdrawal: WithdrawalRequest = {
      id: Date.now().toString(),
      amount: achievement.reward,
      date: new Date().toISOString(),
      status: 'pending',
      type: 'achievement'
    };
    
    const updatedWithdrawals = [...withdrawals, newWithdrawal];
    setWithdrawals(updatedWithdrawals);
    localStorage.setItem('quiz_app_withdrawals', JSON.stringify(updatedWithdrawals));
    
    // Mark achievement as claimed
    const updatedAchievements = achievements.map(a => 
      a.id === achievement.id ? { ...a, claimed: true } : a
    );
    setAchievements(updatedAchievements);
    localStorage.setItem('quiz_app_achievements', JSON.stringify(updatedAchievements));
    
    toast({
      title: "Reward Claimed",
      description: `Your reward of ₹${achievement.reward.toFixed(2)} has been requested for withdrawal`,
    });
    
    // Simulate processing
    setTimeout(() => {
      simulateWithdrawalProcessing(newWithdrawal.id);
    }, 5000);
  };
  
  const simulateWithdrawalProcessing = (id: string) => {
    const updated = withdrawals.map(w => 
      w.id === id ? { ...w, status: 'completed' as const } : w
    );
    setWithdrawals(updated);
    localStorage.setItem('quiz_app_withdrawals', JSON.stringify(updated));
    
    toast({
      title: "Withdrawal Completed",
      description: "Your withdrawal has been processed successfully",
    });
  };
  
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };
  
  return {
    cashAvailable,
    withdrawalAmount,
    setWithdrawalAmount,
    paymentMethod,
    setPaymentMethod,
    withdrawals,
    achievements: achievements.filter(a => !a.claimed),
    handleWithdrawalRequest,
    handleClaimAchievement,
    formatMonth
  };
}
