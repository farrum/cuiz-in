
import React from 'react';
import { format } from 'date-fns';
import { Check, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PaymentData } from '@/hooks/admin/usePaymentManagement';
import { useToast } from '@/hooks/use-toast';

interface PaymentsTableProps {
  payments: PaymentData[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const PaymentsTable: React.FC<PaymentsTableProps> = ({
  payments,
  onApprove,
  onReject
}) => {
  const { toast } = useToast();

  const viewPaymentDetails = (payment: PaymentData) => {
    toast({
      title: "Payment Details",
      description: `Transaction ID: ${payment.transactionId || 'N/A'}
                   Amount: ₹${payment.amount}
                   Status: ${payment.status}
                   Method: ${payment.method || 'N/A'}
                   User: ${payment.userName}
                   Type: ${payment.type}`,
      duration: 5000,
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Transaction ID</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>
              <div className="font-medium">{payment.userName}</div>
              <div className="text-xs text-muted-foreground">ID: {payment.userId}</div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">
                {payment.type === 'quiz' ? 'Quiz Reward' : 'Referral Bonus'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>{format(new Date(payment.date), 'MMM d, yyyy')}</div>
              </div>
            </TableCell>
            <TableCell className="font-medium">₹{payment.amount}</TableCell>
            <TableCell>
              <Badge variant="outline" className={payment.status === 'paid' || payment.status === 'approved' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-amber-100 text-amber-800'}>
                {payment.status === 'paid' || payment.status === 'approved' ? (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    Paid
                  </>
                ) : (
                  'Pending'
                )}
              </Badge>
            </TableCell>
            <TableCell>
              {payment.transactionId || '-'}
            </TableCell>
            <TableCell className="text-right">
              {payment.status === 'pending' ? (
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    onClick={() => onApprove(payment.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(payment.id)}
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewPaymentDetails(payment)}
                >
                  View Details
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
