
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Search, Download, Filter, UserCheck, X, Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LoginLog {
  id: string;
  username: string;
  date: string;
  successful: boolean;
  ip: string;
  userAgent: string;
}

const AdminLoginLogs: React.FC = () => {
  const { toast } = useToast();
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LoginLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load login logs from Supabase
    const fetchLoginLogs = async () => {
      setIsLoading(true);
      try {
        // Get login logs from Supabase
        const { data, error } = await supabase
          .from('login_logs')
          .select('*')
          .order('login_time', { ascending: false });
          
        if (error) {
          console.error('Error fetching login logs:', error);
          toast({
            title: "Error",
            description: "Failed to load login logs from database",
            variant: "destructive"
          });
          
          // Fall back to localStorage if Supabase fails
          const savedLogs = JSON.parse(localStorage.getItem('quiz_app_login_log') || '[]');
          setLoginLogs(savedLogs);
          setFilteredLogs(savedLogs);
        } else if (data) {
          // Transform Supabase data to match our interface
          const transformedLogs: LoginLog[] = data.map(log => ({
            id: log.id,
            username: log.username,
            date: log.login_time,
            successful: log.successful !== undefined ? log.successful : true,
            ip: log.ip_address || '',
            userAgent: log.device || ''
          }));
          
          setLoginLogs(transformedLogs);
          setFilteredLogs(transformedLogs);
          
          // Also sync with localStorage for backward compatibility
          localStorage.setItem('quiz_app_login_log', JSON.stringify(transformedLogs));
        }
      } catch (err) {
        console.error('Failed to fetch login logs:', err);
        
        // Fall back to localStorage if Supabase fails
        const savedLogs = JSON.parse(localStorage.getItem('quiz_app_login_log') || '[]');
        setLoginLogs(savedLogs);
        setFilteredLogs(savedLogs);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLoginLogs();
  }, [toast]);

  useEffect(() => {
    let filtered = loginLogs;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const isSuccessful = statusFilter === 'successful';
      filtered = filtered.filter(log => log.successful === isSuccessful);
    }
    
    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip.includes(searchTerm)
      );
    }
    
    setFilteredLogs(filtered);
  }, [loginLogs, searchTerm, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportCSV = () => {
    const headers = ['Username', 'Date', 'Status', 'IP Address', 'User Agent'];
    const csvData = filteredLogs.map(log => [
      log.username,
      formatDate(log.date),
      log.successful ? 'Successful' : 'Failed',
      log.ip,
      log.userAgent
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `login-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearLogs = async () => {
    if (confirm('Are you sure you want to clear all login logs? This action cannot be undone.')) {
      try {
        // Clear logs from Supabase
        const { error } = await supabase
          .from('login_logs')
          .delete()
          .not('id', 'is', null); // Delete all logs
          
        if (error) {
          console.error('Error clearing login logs:', error);
          toast({
            title: "Error",
            description: "Failed to clear login logs from database",
            variant: "destructive"
          });
        } else {
          // Clear local state and localStorage
          setLoginLogs([]);
          setFilteredLogs([]);
          localStorage.setItem('quiz_app_login_log', '[]');
          
          toast({
            title: "Success",
            description: "Login logs have been cleared",
          });
        }
      } catch (err) {
        console.error('Failed to clear login logs:', err);
        toast({
          title: "Error",
          description: "Failed to clear login logs",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Login Activity Logs</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="destructive" size="sm" onClick={clearLogs}>
            <X className="w-4 h-4 mr-2" />
            Clear Logs
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by username or IP..."
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Logins</SelectItem>
              <SelectItem value="successful">Successful</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="hidden md:table-cell">User Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Loader className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50 animate-spin" />
                  Loading login logs...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                  No login logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log, index) => (
                <TableRow key={log.id || index}>
                  <TableCell className="font-medium">{log.username}</TableCell>
                  <TableCell>{formatDate(log.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {log.successful ? (
                        <>
                          <UserCheck className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-green-600">Successful</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-red-500 mr-1" />
                          <span className="text-red-600">Failed</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell className="truncate hidden md:table-cell max-w-xs">
                    <div className="text-xs text-muted-foreground truncate">{log.userAgent}</div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Showing {filteredLogs.length} of {loginLogs.length} logs
      </div>
    </div>
  );
};

export default AdminLoginLogs;
