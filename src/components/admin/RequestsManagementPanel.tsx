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
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createSlug } from '@/utils/urlUtils';
import { getCategorySlug } from '@/utils/categoryMapping';
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

interface QuestionReport {
  id: string;
  question_id: string;
  question_text: string;
  current_answer: string;
  category: string;
  issue_type: string;
  details: string;
  source_url?: string;
  contact_email?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  editorial_notes?: string;
  created_at: string;
}

const RequestsManagementPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('question-reports');
  const [isLoading, setIsLoading] = useState(true);
  const [reactivationRequests, setReactivationRequests] = useState<ReactivationRequest[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentRequest[]>([]);
  const [questionReports, setQuestionReports] = useState<QuestionReport[]>([]);
  const [reportFilter, setReportFilter] = useState<string>('all');
  const { toast } = useToast();
  
  const loadAllRequests = async () => {
    setIsLoading(true);
    
    try {
      const { data: reactivationData, error: reactivationError } = await supabase
        .from('profiles')
        .select('id, username, display_name, reactivation_requested_at, reactivation_approved')
        .eq('reactivation_requested', true)
        .order('reactivation_requested_at', { ascending: false });
        
      if (reactivationError) throw reactivationError;
      
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (paymentError) throw paymentError;

      const { data: reportsData, error: reportsError } = await supabase
        .from('question_reports' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.warn('question_reports table query note:', reportsError);
      }
      
      setReactivationRequests(reactivationData || []);
      setPendingPayments(paymentData || []);
      setQuestionReports((reportsData as any) || []);
      
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
  
  const handleApproveReactivation = async (userId: string) => {
    try {
      const result = await approveReactivationRequest(userId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Reactivation request approved',
        });
        
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

  const handleUpdateReportStatus = async (reportId: string, status: 'under_review' | 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('question_reports' as any)
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Question error report marked as ${status.replace('_', ' ')}`,
      });
      loadAllRequests();
    } catch (err: any) {
      console.error('Error updating question report:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update report status',
        variant: 'destructive',
      });
    }
  };

  const filteredQuestionReports = questionReports.filter(r => {
    if (reportFilter === 'pending') return r.status === 'pending';
    if (reportFilter === 'under_review') return r.status === 'under_review';
    if (reportFilter === 'resolved') return r.status === 'resolved';
    if (reportFilter === 'dismissed') return r.status === 'dismissed';
    return true;
  });

  const questionReportColumns = [
    {
      header: 'Question & Category',
      accessorKey: 'question_text',
      cell: (row: QuestionReport) => {
        const catSlug = getCategorySlug(row.category || 'general');
        const qSlug = createSlug(row.question_text || 'question');
        return (
          <div className="max-w-[320px] space-y-1">
            <Link
              to={`/quiz/question/${row.question_id}/${catSlug}/${qSlug}`}
              target="_blank"
              className="font-semibold text-xs text-foreground hover:text-primary transition-colors flex items-start gap-1"
            >
              <span>{row.question_text}</span>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-60 mt-0.5" />
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="text-[10px] py-0">{row.category || 'General'}</Badge>
              {row.current_answer && (
                <span>Current Ans: <strong className="text-foreground">{row.current_answer}</strong></span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Issue & Details',
      accessorKey: 'issue_type',
      cell: (row: QuestionReport) => (
        <div className="max-w-[280px] space-y-1">
          <Badge 
            variant="outline" 
            className={
              row.issue_type === 'incorrect_answer' 
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300' 
                : row.issue_type === 'outdated_fact'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300'
                  : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }
          >
            {row.issue_type.replace('_', ' ').toUpperCase()}
          </Badge>
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
            {row.details}
          </p>
          {row.source_url && (
            <a 
              href={row.source_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[11px] text-primary hover:underline flex items-center gap-1 truncate block max-w-[240px]"
            >
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              {row.source_url}
            </a>
          )}
        </div>
      )
    },
    {
      header: 'Reported',
      accessorKey: 'created_at',
      cell: (row: QuestionReport) => (
        <div className="text-xs text-muted-foreground">
          <div>{format(new Date(row.created_at || Date.now()), 'MMM d, yyyy')}</div>
          <div className="text-[11px]">
            {formatDistanceToNow(new Date(row.created_at || Date.now()), { addSuffix: true })}
          </div>
          {row.contact_email && (
            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
              {row.contact_email}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: QuestionReport) => {
        const s = row.status || 'pending';
        return (
          <Badge
            variant="outline"
            className={
              s === 'resolved'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300'
                : s === 'under_review'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300'
                  : s === 'dismissed'
                    ? 'bg-slate-100 text-slate-500'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300'
            }
          >
            {s.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      }
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: QuestionReport) => (
        <div className="flex flex-wrap gap-1.5 min-w-[160px]">
          {row.status !== 'resolved' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => handleUpdateReportStatus(row.id, 'resolved')}
            >
              <CheckCircle className="w-3 h-3 mr-1" /> Resolve
            </Button>
          )}
          {row.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => handleUpdateReportStatus(row.id, 'under_review')}
            >
              Review
            </Button>
          )}
          {row.status !== 'dismissed' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => handleUpdateReportStatus(row.id, 'dismissed')}
            >
              Dismiss
            </Button>
          )}
        </div>
      )
    }
  ];
  
  return (
    <Card className="bg-card text-card-foreground shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" /> Support &amp; Community Reports
            </CardTitle>
            <CardDescription>
              Triage user-submitted fact checks, citation suggestions, account reactivation requests, and withdrawals.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAllRequests}
            className="flex items-center gap-1 self-start sm:self-auto"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex flex-wrap gap-1">
            <TabsTrigger value="question-reports" className="flex items-center gap-1 text-xs">
              <AlertCircle className="h-3.5 w-3.5" /> Question Fact Reports
              {questionReports.filter(r => r.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                  {questionReports.filter(r => r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reactivation" className="flex items-center gap-1 text-xs">
              <UserCheck className="h-3.5 w-3.5" /> Reactivations
              {reactivationRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                  {reactivationRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-1 text-xs">
              <CreditCard className="h-3.5 w-3.5" /> Payments
              {pendingPayments.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                  {pendingPayments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Question Reports Tab */}
          <TabsContent value="question-reports" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Filter by Status:</span>
                <div className="flex gap-1">
                  {['all', 'pending', 'under_review', 'resolved', 'dismissed'].map(st => (
                    <Button
                      key={st}
                      variant={reportFilter === st ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs capitalize"
                      onClick={() => setReportFilter(st)}
                    >
                      {st.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Showing {filteredQuestionReports.length} of {questionReports.length} tickets
              </div>
            </div>

            <PaginatedDataTable 
              columns={questionReportColumns} 
              data={filteredQuestionReports} 
              isLoading={isLoading} 
              pageSize={10}
              searchPlaceholder="Search reported questions or details..."
            />
            
            {!isLoading && filteredQuestionReports.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <CheckCircle className="h-10 w-10 mb-2 text-emerald-500" />
                <h3 className="font-medium text-base text-foreground">Inbox Zero! No question reports</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  No community error reports matching this filter.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reactivation">
            <PaginatedDataTable 
              columns={reactivationColumns} 
              data={reactivationRequests} 
              isLoading={isLoading} 
              pageSize={10}
              searchPlaceholder="Search users..."
            />
            
            {!isLoading && reactivationRequests.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <UserCheck className="h-10 w-10 mb-2 text-muted-foreground" />
                <h3 className="font-medium text-base text-foreground">No reactivation requests</h3>
                <p className="text-xs text-muted-foreground mt-1">There are no pending reactivation requests at this time.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="payment">
            <PaginatedDataTable 
              columns={paymentColumns} 
              data={pendingPayments} 
              isLoading={isLoading} 
              pageSize={10}
              searchPlaceholder="Search payments..."
            />
            
            {!isLoading && pendingPayments.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <CreditCard className="h-10 w-10 mb-2 text-muted-foreground" />
                <h3 className="font-medium text-base text-foreground">No payment requests</h3>
                <p className="text-xs text-muted-foreground mt-1">There are no pending payment requests at this time.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RequestsManagementPanel;
