import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { CalendarDays, UserCheck, UserX, AlertCircle, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { approveReactivationRequest, denyReactivationRequest, reactivateUserAccount } from '@/utils/accountSuspension';
import { format, formatDistanceToNow } from 'date-fns';
import { AdminNotification } from '@/types/adminNotification';
import { adminNotificationsApi } from '@/utils/supabaseUtils';

interface ReactivationRequest {
  id: string;
  username: string;
  display_name: string | null;
  reactivation_requested_at: string;
  reactivation_approved: boolean;
}

const ReactivationRequestsPanel: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<ReactivationRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<ReactivationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const loadReactivationRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, reactivation_requested_at, reactivation_approved')
        .eq('reactivation_requested', true)
        .order('reactivation_requested_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        const pending = data.filter(req => !req.reactivation_approved);
        const approved = data.filter(req => req.reactivation_approved);
        
        setPendingRequests(pending);
        setApprovedRequests(approved);
        
        if (pending.length > 0) {
          const userIds = pending.map(request => request.id);
          await adminNotificationsApi.markAllAsRead();
        }
      }
    } catch (error) {
      console.error('Error loading reactivation requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reactivation requests',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadReactivationRequests();
  }, []);
  
  const handleApprove = async (userId: string) => {
    try {
      const result = await approveReactivationRequest(userId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Reactivation request approved',
        });
        loadReactivationRequests();
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
  
  const handleDeny = async (userId: string) => {
    try {
      const result = await denyReactivationRequest(userId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Reactivation request denied',
        });
        loadReactivationRequests();
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
  
  const handleReactivate = async (userId: string) => {
    try {
      const result = await reactivateUserAccount(userId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'User account fully reactivated',
        });
        loadReactivationRequests();
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
  
  const pendingColumns = [
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
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <div>
            <div>{format(new Date(row.reactivation_requested_at), 'PPP')}</div>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(row.reactivation_requested_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: () => (
        <Badge variant="outline" className="bg-orange-100 text-orange-800">
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
            onClick={() => handleApprove(row.id)}
          >
            <UserCheck className="h-4 w-4 mr-1" /> Approve
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => handleDeny(row.id)}
          >
            <UserX className="h-4 w-4 mr-1" /> Deny
          </Button>
        </div>
      )
    }
  ];
  
  const approvedColumns = [
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
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <div>
            <div>{format(new Date(row.reactivation_requested_at), 'PPP')}</div>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(row.reactivation_requested_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: () => (
        <Badge variant="outline" className="bg-green-100 text-green-700">
          <CheckSquare className="h-3 w-3 mr-1" /> Approved
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: any) => (
        <Button 
          variant="outline" 
          size="sm" 
          className="border-green-200 text-green-600 hover:bg-green-50"
          onClick={() => handleReactivate(row.id)}
        >
          <UserCheck className="h-4 w-4 mr-1" /> Reactivate Now
        </Button>
      )
    }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" /> Account Reactivation Requests
        </CardTitle>
        <CardDescription>
          Manage user account reactivation requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="flex items-center gap-1">
              Pending
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              {approvedRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {approvedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <DataTable 
              columns={pendingColumns} 
              data={pendingRequests} 
              isLoading={isLoading} 
            />
            
            {!isLoading && pendingRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-2" />
                <h3 className="font-medium">No pending requests</h3>
                <p>There are no pending reactivation requests at this time.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="approved">
            <DataTable 
              columns={approvedColumns} 
              data={approvedRequests} 
              isLoading={isLoading} 
            />
            
            {!isLoading && approvedRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-2" />
                <h3 className="font-medium">No approved requests</h3>
                <p>There are no approved reactivation requests at this time.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {pendingRequests.length} pending and {approvedRequests.length} approved requests
        </p>
        <Button variant="outline" size="sm" onClick={loadReactivationRequests}>
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReactivationRequestsPanel;
