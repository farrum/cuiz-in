
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  UserPlus, 
  Download, 
  Filter, 
  AlertTriangle,
  UserCheck,
  Users,
  Link as LinkIcon
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { generateExcelFile } from '@/utils/excelUtils';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  phone: string;
  points: number;
  suspended: boolean;
  created_at?: string;
  password_hash?: string;
  referrer?: {
    id: string;
    name: string;
  } | null;
}

interface UserReferral {
  referred_id: string;
  referrer_id: string;
  referrer_name: string;
}

const AdminUserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [referrals, setReferrals] = useState<UserReferral[]>([]);
  
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // First, get all users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (usersError) {
          throw usersError;
        }
        
        // Then get referral information
        const { data: referralsData, error: referralsError } = await supabase
          .from('user_referrals')
          .select('referred_id, referrer_id, referrer_name');
          
        if (referralsError) {
          console.error('Error fetching referrals:', referralsError);
        }
        
        // Map referrals to users
        const usersList = usersData || [];
        const referralsList = referralsData || [];
        
        setReferrals(referralsList);
        
        // Combine user data with referrer info
        const usersWithReferrers = usersList.map(user => {
          const referralInfo = referralsList.find(r => r.referred_id === user.id);
          
          return {
            ...user,
            referrer: referralInfo ? {
              id: referralInfo.referrer_id,
              name: referralInfo.referrer_name
            } : null
          };
        });
        
        setUsers(usersWithReferrers);
        
        // Save to localStorage for backup
        localStorage.setItem('admin_users', JSON.stringify(usersWithReferrers));
        
      } catch (error) {
        console.error('Error fetching users:', error);
        
        // Try to load from localStorage
        const savedUsers = localStorage.getItem('admin_users');
        if (savedUsers) {
          setUsers(JSON.parse(savedUsers));
        }
        
        toast({
          title: "Error fetching users",
          description: "Failed to load users from the database. Using cached data if available.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [toast]);
  
  const handleSuspendToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ suspended: !currentStatus })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, suspended: !currentStatus } : user
      ));
      
      // Update localStorage
      localStorage.setItem('admin_users', JSON.stringify(
        users.map(user => 
          user.id === userId ? { ...user, suspended: !currentStatus } : user
        )
      ));
      
      toast({
        title: `User ${!currentStatus ? 'suspended' : 'unsuspended'}`,
        description: `The user was ${!currentStatus ? 'suspended' : 'unsuspended'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling user suspension:', error);
      toast({
        title: "Operation failed",
        description: "Could not update user suspension status.",
        variant: "destructive"
      });
    }
  };
  
  const handleExportUsers = () => {
    try {
      const exportData = users.map(user => ({
        Username: user.username,
        Phone: user.phone,
        'Referrer Name': user.referrer?.name || 'None',
        Points: user.points,
        Status: user.suspended ? 'Suspended' : 'Active',
        'Created At': user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'
      }));
      
      generateExcelFile(exportData, 'user-report');
      
      toast({
        title: "Export successful",
        description: "User data has been exported to Excel.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export user data.",
        variant: "destructive"
      });
    }
  };
  
  const handleCreateUser = async () => {
    // Placeholder for creating a new user - would typically open a modal
    toast({
      title: "Not implemented",
      description: "User creation form not implemented yet.",
    });
  };
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.referrer?.name && user.referrer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <h2 className="text-2xl font-semibold">User Management</h2>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button variant="outline" size="icon" onClick={handleExportUsers} title="Export to Excel">
            <Download className="h-4 w-4" />
          </Button>
          
          <Button onClick={handleCreateUser}>
            <UserPlus className="h-4 w-4 mr-2" />
            <span>New User</span>
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Referrer</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    {user.referrer ? (
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <span>{user.referrer.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No referrer</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{user.points}</TableCell>
                  <TableCell>
                    {user.suspended ? (
                      <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Suspended</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                        <Users className="h-4 w-4" />
                        <span>Active</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`suspend-${user.id}`}
                          checked={!user.suspended}
                          onCheckedChange={() => handleSuspendToggle(user.id, user.suspended)}
                        />
                        <label htmlFor={`suspend-${user.id}`} className="text-sm cursor-pointer">
                          {user.suspended ? 'Activate' : 'Suspend'}
                        </label>
                      </div>
                    </div>
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

export default AdminUserManagement;
