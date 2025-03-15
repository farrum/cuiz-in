
import React, { useState, useEffect } from 'react';
import { STORAGE_KEYS, calculateCashAmount } from '@/utils/quizData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, ArrowUpCircle, Award } from 'lucide-react';

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
  
  // Filter unclaimed achievements
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
      
      {/* Unclaimed Monthly Target Rewards */}
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
          100 points = ₹1.00
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
              {(parseFloat(withdrawalAmount) * 100).toFixed(0)} points will be deducted
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
                      Processing
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
