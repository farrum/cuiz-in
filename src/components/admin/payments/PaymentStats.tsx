
import React from 'react';
import { Card } from "@/components/ui/card";
import { Wallet, Clock, PiggyBank, CreditCard } from 'lucide-react';
import { PaymentData } from '@/hooks/admin/usePaymentManagement';

interface PaymentStatsProps {
  payments: PaymentData[];
}

export const PaymentStats: React.FC<PaymentStatsProps> = ({ payments }) => {
  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const quizEarnings = payments
    .filter(p => p.type === 'quiz')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const referralEarnings = payments
    .filter(p => p.type === 'referral')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
            <h3 className="text-2xl font-bold">{totalPaid} pts</h3>
          </div>
          <Wallet className="h-10 w-10 text-primary opacity-75" />
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
            <h3 className="text-2xl font-bold">{totalPending} pts</h3>
          </div>
          <Clock className="h-10 w-10 text-amber-500 opacity-75" />
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Quiz Gems</p>
            <h3 className="text-2xl font-bold">{quizEarnings} pts</h3>
          </div>
          <PiggyBank className="h-10 w-10 text-green-500 opacity-75" />
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Referral Gems</p>
            <h3 className="text-2xl font-bold">{referralEarnings} pts</h3>
          </div>
          <CreditCard className="h-10 w-10 text-blue-500 opacity-75" />
        </div>
      </Card>
    </div>
  );
};
