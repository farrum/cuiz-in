
import React, { useState, useEffect } from 'react';
import { STORAGE_KEYS, calculateCashAmount } from '../utils/quizData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "@/hooks/use-toast";
import { IndianRupee, ArrowUpCircle } from 'lucide-react';

interface WithdrawalRequest {
  id: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'rejected';
}

const WithdrawalSection: React.FC = () => {
  const [cashAvailable, setCashAvailable] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('quiz_app_withdrawals');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    const savedPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setCashAvailable(calculateCashAmount(savedPoints));
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
      status: 'pending'
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
    setPaymentMethod('');
    
    toast({
      title: "Withdrawal Requested",
      description: `Your withdrawal request for ₹${amount.toFixed(2)} has been submitted`,
    });
    
    // Simulate processing in a real app
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
