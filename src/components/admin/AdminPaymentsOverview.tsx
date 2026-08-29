
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Loader } from 'lucide-react';
import { PaymentStats } from './payments/PaymentStats';
import { PaymentsTable } from './payments/PaymentsTable';
import { usePaymentManagement } from '@/hooks/admin/usePaymentManagement';

const AdminPaymentsOverview: React.FC = () => {
  const { payments, isLoading, loadPayments, handleApprovePayment, handleRejectPayment } = usePaymentManagement();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter(payment => 
    payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.transactionId && payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportCSV = () => {
    const headers = ['User ID', 'Username', 'Amount', 'Type', 'Status', 'Date', 'Method', 'Transaction ID'];
    const csvData = filteredPayments.map(payment => [
      payment.userId,
      payment.userName,
      payment.amount.toString(),
      payment.type,
      payment.status,
      payment.date,
      payment.method || '',
      payment.transactionId || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payments-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Payments Overview</h2>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search payments..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <PaymentStats payments={filteredPayments} />
      
      <div className="rounded-md border overflow-hidden bg-card text-card-foreground shadow-sm">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-spin" />
            Loading payments...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payments found
          </div>
        ) : (
          <PaymentsTable 
            payments={filteredPayments}
            onApprove={handleApprovePayment}
            onReject={handleRejectPayment}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPaymentsOverview;
