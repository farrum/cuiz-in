
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { adminNotificationsApi } from '@/utils/supabaseUtils';

export interface PaymentData {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: 'quiz' | 'referral';
  status: 'paid' | 'pending' | 'approved';
  date: string;
  method?: string;
  transactionId?: string;
}

export const usePaymentManagement = () => {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const { data: supabasePayments, error } = await supabase
        .from('payments')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        toast({
          title: "Error",
          description: "Failed to load payments from database",
          variant: "destructive"
        });
        
        const paymentsFromStorage = localStorage.getItem('admin_payments');
        if (paymentsFromStorage) {
          setPayments(JSON.parse(paymentsFromStorage));
        }
      } else if (supabasePayments) {
        const transformedPayments: PaymentData[] = supabasePayments.map(payment => ({
          id: payment.id,
          userId: payment.user_id,
          userName: payment.username,
          amount: Number(payment.amount),
          type: payment.type as 'quiz' | 'referral',
          status: payment.status as 'paid' | 'pending' | 'approved',
          date: payment.date,
          method: payment.method,
          transactionId: payment.transaction_id
        }));
        
        setPayments(transformedPayments);
        localStorage.setItem('admin_payments', JSON.stringify(transformedPayments));
      }
    } catch (err) {
      console.error('Failed to fetch payments data:', err);
      toast({
        title: "Error",
        description: "An error occurred while loading payments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const transactionId = `TXN-${Date.now()}`;
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          transaction_id: transactionId 
        })
        .eq('id', paymentId);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Payment request approved',
      });
      
      await adminNotificationsApi.create({
        type: 'payment_approved',
        message: 'Payment request has been approved',
        read: false,
        data: { paymentId, transactionId }
      });
      
      await loadPayments();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve payment request',
        variant: 'destructive',
      });
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Payment request rejected',
      });
      await loadPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payment request',
        variant: 'destructive',
      });
    }
  };

  return {
    payments,
    isLoading,
    loadPayments,
    handleApprovePayment,
    handleRejectPayment
  };
};
