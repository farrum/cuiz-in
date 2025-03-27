
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  UserCheck, 
  CreditCard, 
  RefreshCw, 
  Calendar 
} from 'lucide-react';
import { 
  approveReactivationRequest, 
  denyReactivationRequest, 
  reactivateUserAccount 
} from '@/utils/accountSuspension';
import { adminNotificationsApi } from '@/utils/supabaseUtils';

interface ReactivationRequest {
  id: string;
  username: string;
  display_name: string | null;
  reactivation_requested_at: string;
  reactivation_approved: boolean;
}

interface PaymentRequest {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  transaction_id: string | null;
  method: string | null;
}

const RequestsManagementPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reactivation');
  const [isLoading, setIsLoading] = useState(true);
  const [reactivationRequests, setReactivationRequests] = useState<ReactivationRequest[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentRequest[]>([]);
  const { toast } = useToast();
  
  // Load all requests
  const loadAllRequests = async () => {
    setIsLoading(true);
    
    try {
      // Fetch reactivation requests
      const { data: reactivationData, error: reactivationError } = await supabase
        .from('profiles')
        .select('id, username, display_name, reactivation_requested_at, reactivation_approved')
        .eq('reactivation_requested', true)
        .order('reactivation_requested_at', { ascending: false });
        
      if (reactivationError) throw reactivationError;
      
      // Fetch pending payment requests
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (paymentError) throw paymentError;
      
      setReactivationRequests(reactivationData || []);
      setPendingPayments(paymentData || []);
      
      // Mark related notifications as read
      await adminNotificationsApi.markAllAsRead();
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadAllRequests();
  }, []);
  
  // Handle reactivation requests
  const handleApproveReactivation = async (userId: string) => {
    try {
      const result = await approveReactivationRequest(userId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Reactivation request approved',
        });
        
        // Create admin notification for approval
        await adminNotificationsApi.create({
          type: 'system',
          message: 'Reactivation request has been approved',
          read: false,
          data: { userId }
        });
        
        loadAllRequests();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to approve reactivation request',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error approving reactivation:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  const handleDenyReactivation = async (userId: string) => {
    try {
      const result = await denyReactivationRequest(userId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Reactivation request denied',
        });
        loadAllRequests();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to deny reactivation request',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error denying reactivation:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  const handleReactivateAccount = async (userId: string) => {
    try {
      const result = await reactivateUserAccount(userId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'User account fully reactivated',
        });
        loadAllRequests();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reactivate user account',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error reactivating account:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // Handle payment requests
  const handleApprovePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'approved',
          transaction_id: `TXN-${Date.now()}`
        })
        .eq('id', paymentId);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Payment request approved',
      });
      
      // Create admin notification for payment approval
      await adminNotificationsApi.create({
        type: 'system',
        message: 'Payment request has been approved',
        read: false,
        data: { paymentId }
      });
      
      loadAllRequests();
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
      loadAllRequests();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject payment request',
        variant: 'destructive',
      });
    }
  };
  
  // Reactivation request columns
  const reactivationColumns = [
    {
      header: 'User',
      accessorKey: 'username',
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.display_name || row.username}</div>
          <div className="text-sm text-muted-foreground">@{row.username}</div>
        </div>
      )
    },
    {
      header: 'Requested',
      accessorKey: 'reactivation_requested_at',
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div>{format(new Date(row.reactivation_requested_at), 'MMM d, yyyy')}</div>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(row.reactivation_requested_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'reactivation_approved',
      cell: (row: any) => (
        row.reactivation_approved ? (
          <Badge variant="outline" className="bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-orange-100 text-orange-700 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Pending
          </Badge>
        )
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: any) => (
        row.reactivation_approved ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="border-green-200 text-green-600 hover:bg-green-50"
            onClick={() => handleReactivateAccount(row.id)}
          >
            <UserCheck className="h-4 w-4 mr-1" /> Reactivate
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-green-200 text-green-600 hover:bg-green-50"
              onClick={() => handleApproveReactivation(row.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Approve
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleDenyReactivation(row.id)}
            >
              <XCircle className="h-4 w-4 mr-1" /> Deny
            </Button>
          </div>
        )
      )
    }
  ];
  
  // Payment request columns
  const paymentColumns = [
    {
      header: 'User',
      accessorKey: 'username',
      cell: (row: any) => (
        <div className="font-medium">{row.username}</div>
      )
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: (row: any) => (
        <div className="font-medium text-right">₹{row.amount.toFixed(2)}</div>
      )
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (row: any) => (
        <Badge variant={row.type === 'withdrawal' ? 'default' : 'secondary'}>
          {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
        </Badge>
      )
    },
    {
      header: 'Requested',
      accessorKey: 'created_at',
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div>{format(new Date(row.created_at), 'MMM d, yyyy')}</div>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: any) => (
        <Badge variant="outline" className="bg-amber-100 text-amber-700 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Pending
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: any) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-green-200 text-green-600 hover:bg-green-50"
            onClick={() => handleApprovePayment(row.id)}
          >
            <CreditCard className="h-4 w-4 mr-1" /> Process
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => handleRejectPayment(row.id)}
          >
            <XCircle className="h-4 w-4 mr-1" /> Reject
          </Button>
        </div>
      )
    }
  ];
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" /> Pending Requests
        </CardTitle>
        <CardDescription>
          Manage account reactivation and payment requests
        </CardDescription>
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAllRequests}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="reactivation" className="flex items-center gap-1">
              <UserCheck className="h-4 w-4" /> Reactivation
              {reactivationRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {reactivationRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" /> Payments
              {pendingPayments.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingPayments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reactivation">
            <PaginatedDataTable 
              columns={reactivationColumns} 
              data={reactivationRequests} 
              isLoading={isLoading} 
              pageSize={5}
              searchPlaceholder="Search users..."
            />
            
            {!isLoading && reactivationRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <UserCheck className="h-12 w-12 mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-lg">No reactivation requests</h3>
                <p>There are no pending reactivation requests at this time.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="payment">
            <PaginatedDataTable 
              columns={paymentColumns} 
              data={pendingPayments} 
              isLoading={isLoading} 
              pageSize={5}
              searchPlaceholder="Search payments..."
            />
            
            {!isLoading && pendingPayments.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <CreditCard className="h-12 w-12 mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-lg">No payment requests</h3>
                <p>There are no pending payment requests at this time.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RequestsManagementPanel;
