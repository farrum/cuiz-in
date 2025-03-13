
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
import { Search, Wallet, PiggyBank, CreditCard, Check, Clock, Download } from 'lucide-react';
import { STORAGE_KEYS } from '@/utils/quizData';

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
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Load payments and users from localStorage
  useEffect(() => {
    // In a real app, you'd fetch from a database
    
    // Get users first
    const usersFromStorage = localStorage.getItem('admin_users');
    const loadedUsers = usersFromStorage ? JSON.parse(usersFromStorage) : [];
    setUsers(loadedUsers);
    
    // Generate mock payment data based on users
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
    
    const paymentsFromStorage = localStorage.getItem('admin_payments');
    if (paymentsFromStorage) {
      setPayments(JSON.parse(paymentsFromStorage));
    } else if (mockPayments.length > 0) {
      setPayments(mockPayments);
      localStorage.setItem('admin_payments', JSON.stringify(mockPayments));
    }
  }, []);
  
  // Filter payments based on search term
  const filteredPayments = payments.filter(payment => 
    payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.transactionId && payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Calculate stats
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
  
  // Mark payment as paid  
  const markAsPaid = (paymentId: string) => {
    const updatedPayments = payments.map(payment => {
      if (payment.id === paymentId) {
        return {
          ...payment,
          status: 'paid' as const,
          transactionId: Math.random().toString(36).substring(7).toUpperCase()
        };
      }
      return payment;
    });
    
    setPayments(updatedPayments);
    localStorage.setItem('admin_payments', JSON.stringify(updatedPayments));
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
          
          <Button variant="outline">
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
            {filteredPayments.length === 0 ? (
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
                  <TableCell>{payment.date}</TableCell>
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
