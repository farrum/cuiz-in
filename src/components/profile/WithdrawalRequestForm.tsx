
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { notifyWithdrawalRequest } from '@/utils/notificationUtils';

const WithdrawalRequestForm = () => {
  const [amount, setAmount] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const username = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      
      if (!userId || !username) {
        toast({
          title: "Error",
          description: "You need to be logged in to request a withdrawal",
          variant: "destructive"
        });
        return;
      }
      
      // Validate amount
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount greater than 0",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Validate UPI ID
      if (!upiId) {
        toast({
          title: "UPI ID Required",
          description: "Please enter your UPI ID",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Update UPI ID in profile if needed
      await supabase
        .from('profiles')
        .update({ upi_id: upiId })
        .eq('id', userId);

      // Create withdrawal request
      const { error } = await supabase
        .from('payments')
        .insert([{
          user_id: userId,
          username: username,
          amount: numAmount,
          type: 'withdrawal',
          status: 'pending',
          method: 'UPI',
          date: new Date().toISOString().split('T')[0]
        }]);

      if (error) {
        throw error;
      }
      
      // Create admin notification
      await notifyWithdrawalRequest(username, userId, numAmount);

      toast({
        title: "Request Submitted",
        description: `Your withdrawal request for ₹${amount} has been submitted and will be processed soon.`,
      });
      
      // Reset form
      setAmount('');
    } catch (error: any) {
      console.error('Error submitting withdrawal request:', error);
      toast({
        title: "Request Failed",
        description: error.message || "An error occurred while processing your request.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw Points</CardTitle>
        <CardDescription>Request to withdraw your earned points as money</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upi-id">UPI ID</Label>
            <Input
              id="upi-id"
              placeholder="yourname@bankname"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="1"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Request Withdrawal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default WithdrawalRequestForm;
