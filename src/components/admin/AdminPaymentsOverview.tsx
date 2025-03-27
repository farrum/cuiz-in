import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Wallet, PiggyBank, CreditCard, Check, Clock, Download, Loader } from 'lucide-react';
import { STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentData {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: 'quiz' | 'referral';
  status: 'paid' | 'pending';
  date: string;
  method?: string;
  transactionId?: string;
}

interface User {
  id: string;
  name: string;
  points: number;
}

const AdminPaymentsOverview: React.FC = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Get users first
      const usersFromStorage = localStorage.getItem('admin_users');
      const loadedUsers = usersFromStorage ? JSON.parse(usersFromStorage) : [];
      setUsers(loadedUsers);
      
      // Fetch payments from Supabase
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
        
        // Fall back to localStorage
        const paymentsFromStorage = localStorage.getItem('admin_payments');
        if (paymentsFromStorage) {
          setPayments(JSON.parse(paymentsFromStorage));
        } else {
          // Generate and save mock data
          generateAndSaveMockPayments(loadedUsers);
        }
      } else if (supabasePayments && supabasePayments.length > 0) {
        // Transform Supabase data to match our interface
        const transformedPayments: PaymentData[] = supabasePayments.map(payment => ({
          id: payment.id,
          userId: payment.user_id,
          userName: payment.username,
          amount: Number(payment.amount),
          type: payment.type as 'quiz' | 'referral',
          status: payment.status as 'paid' | 'pending',
          date: payment.date,
          method: payment.method,
          transactionId: payment.transaction_id
        }));
        
        setPayments(transformedPayments);
        
        // Sync with localStorage for backward compatibility
        localStorage.setItem('admin_payments', JSON.stringify(transformedPayments));
        
        // Mark any related notifications as read
        const pendingPaymentIds = supabasePayments
          .filter(p => p.status === 'pending')
          .map(p => p.user_id);
          
        if (pendingPaymentIds.length > 0) {
          await supabase
            .from('admin_notifications')
            .update({ read: true })
            .in('type', ['withdrawal_request', 'achievement_claim'])
            .in('user_id', pendingPaymentIds);
        }
      } else {
        // No data in Supabase, check localStorage or generate mock data
        const paymentsFromStorage = localStorage.getItem('admin_payments');
        if (paymentsFromStorage) {
          const storedPayments = JSON.parse(paymentsFromStorage);
          setPayments(storedPayments);
          
          // Sync localStorage data to Supabase
          await syncPaymentsToSupabase(storedPayments);
        } else {
          // Generate mock data
          generateAndSaveMockPayments(loadedUsers);
        }
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
  
  const generateAndSaveMockPayments = async (loadedUsers: User[]) => {
    const mockPayments: PaymentData[] = [];
    
    loadedUsers.forEach((user: User) => {
      // Add quiz earnings
      if (user.points > 0) {
        const quizEarnings = Math.floor(user.points / 100);
        if (quizEarnings > 0) {
          mockPayments.push({
            id: `q-${user.id}-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            amount: quizEarnings,
            type: 'quiz',
            status: Math.random() > 0.3 ? 'paid' : 'pending',
            date: new Date().toISOString().slice(0, 10),
            method: Math.random() > 0.5 ? 'UPI' : 'Bank Transfer',
            transactionId: Math.random().toString(36).substring(7).toUpperCase()
          });
        }
      }
      
      // Add referral earnings (random for demo)
      if (Math.random() > 0.6) {
        mockPayments.push({
          id: `r-${user.id}-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          amount: Math.floor(Math.random() * 200) + 50,
          type: 'referral',
          status: Math.random() > 0.4 ? 'paid' : 'pending',
          date: new Date().toISOString().slice(0, 10),
          method: Math.random() > 0.5 ? 'UPI' : 'Bank Transfer',
          transactionId: Math.random().toString(36).substring(7).toUpperCase()
        });
      }
    });
    
    if (mockPayments.length > 0) {
      setPayments(mockPayments);
      localStorage.setItem('admin_payments', JSON.stringify(mockPayments));
      
      // Sync to Supabase
      await syncPaymentsToSupabase(mockPayments);
    }
  };
  
  const syncPaymentsToSupabase = async (payments: PaymentData[]) => {
    try {
      for (const payment of payments) {
        const { error } = await supabase
          .from('payments')
          .upsert({
            id: payment.id,
            user_id: payment.userId,
            username: payment.userName,
            amount: payment.amount,
            type: payment.type,
            status: payment.status,
            date: payment.date,
            method: payment.method,
            transaction_id: payment.transactionId
          }, { onConflict: 'id' });
          
        if (error) {
          console.error('Error syncing payment to Supabase:', error);
        }
      }
    } catch (err) {
      console.error('Failed to sync payments to Supabase:', err);
    }
  };
  
  const filteredPayments = payments.filter(payment => 
    payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.transactionId && payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
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
  
  const markAsPaid = async (paymentId: string) => {
    try {
      // Generate transaction ID
      const transactionId = Math.random().toString(36).substring(7).toUpperCase();
      
      // Update payment in Supabase
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          transaction_id: transactionId
        })
        .eq('id', paymentId);
        
      if (error) {
        console.error('Error updating payment status:', error);
        toast({
          title: "Error",
          description: "Failed to update payment status in database",
          variant: "destructive"
        });
        return;
      }
      
      // Update local state
      const updatedPayments = payments.map(payment => {
        if (payment.id === paymentId) {
          return {
            ...payment,
            status: 'paid' as const,
            transactionId
          };
        }
        return payment;
      });
      
      setPayments(updatedPayments);
      
      // Update localStorage for backward compatibility
      localStorage.setItem('admin_payments', JSON.stringify(updatedPayments));
      
      toast({
        title: "Success",
        description: "Payment marked as paid",
      });
    } catch (err) {
      console.error('Failed to mark payment as paid:', err);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

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
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
              <h3 className="text-2xl font-bold">₹{totalPaid}</h3>
            </div>
            <Wallet className="h-10 w-10 text-primary opacity-75" />
          </div>
        </div>
        
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
              <h3 className="text-2xl font-bold">₹{totalPending}</h3>
            </div>
            <Clock className="h-10 w-10 text-amber-500 opacity-75" />
          </div>
        </div>
        
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quiz Earnings</p>
              <h3 className="text-2xl font-bold">₹{quizEarnings}</h3>
            </div>
            <PiggyBank className="h-10 w-10 text-green-500 opacity-75" />
          </div>
        </div>
        
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Referral Earnings</p>
              <h3 className="text-2xl font-bold">₹{referralEarnings}</h3>
            </div>
            <CreditCard className="h-10 w-10 text-blue-500 opacity-75" />
          </div>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <Loader className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50 animate-spin" />
                  Loading payments...
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="font-medium">{payment.userName}</div>
                    <div className="text-xs text-muted-foreground">ID: {payment.userId}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${payment.type === 'quiz' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {payment.type === 'quiz' ? 'Quiz Reward' : 'Referral Bonus'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">₹{payment.amount}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${payment.status === 'paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      {payment.status === 'paid' ? (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          Paid
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {payment.transactionId || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status === 'pending' ? (
                      <Button
                        size="sm"
                        onClick={() => markAsPaid(payment.id)}
                      >
                        Mark as Paid
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        View Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminPaymentsOverview;
