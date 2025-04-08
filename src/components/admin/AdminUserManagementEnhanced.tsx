
import React, { useState, useEffect } from 'react';
import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, User, Check, X, Clock, Ban, CheckCircle, 
  XCircle, AlertCircle
} from 'lucide-react';

const AdminUserManagementEnhanced: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // Fetch user referrals data to calculate days active
          const { data: referrals, error: referralsError } = await supabase
            .from('user_referrals')
            .select('*');
            
          if (referralsError) {
            console.error('Error fetching referrals:', referralsError);
          }

          // Process users with calculated days active
          const processedUsers = data.map(user => {
            // Find user's referral data if exists
            const userReferral = referrals?.find(r => r.referred_id === user.id);
            
            // Calculate days active based on join date or last active date
            let daysActive = 0;
            if (userReferral) {
              const joinDate = new Date(userReferral.date);
              const lastActiveDate = userReferral.last_active_date ? new Date(userReferral.last_active_date) : null;
              
              // Use the later of the two dates
              const latestActivity = lastActiveDate && lastActiveDate > joinDate ? lastActiveDate : joinDate;
              
              // Calculate days active
              daysActive = Math.ceil((new Date().getTime() - latestActivity.getTime()) / (24 * 60 * 60 * 1000));
              daysActive = Math.max(1, daysActive); // Ensure at least 1 day active
            }
            
            return {
              ...user,
              daysActive // Add days active property
            };
          });
          
          setUsers(processedUsers);
          setFilteredUsers(processedUsers);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        toast({
          title: "Error",
          description: "Failed to load users data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [toast]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const results = users.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(results);
    }
  }, [searchTerm, users]);

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ suspended: !currentStatus })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          return { ...user, suspended: !currentStatus };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      
      // Update filtered list if it's being filtered
      if (searchTerm.trim() !== '') {
        setFilteredUsers(prev => 
          prev.map(user => {
            if (user.id === userId) {
              return { ...user, suspended: !currentStatus };
            }
            return user;
          })
        );
      }
      
      toast({
        title: !currentStatus ? "User Suspended" : "User Reactivated",
        description: !currentStatus 
          ? "User has been suspended successfully" 
          : "User has been reactivated successfully",
      });
    } catch (err) {
      console.error('Error toggling user suspension:', err);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };
  
  const grantAdminAccess = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !isCurrentlyAdmin })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          return { ...user, is_admin: !isCurrentlyAdmin };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      
      // Update filtered list if it's being filtered
      if (searchTerm.trim() !== '') {
        setFilteredUsers(prev => 
          prev.map(user => {
            if (user.id === userId) {
              return { ...user, is_admin: !isCurrentlyAdmin };
            }
            return user;
          })
        );
      }
      
      toast({
        title: !isCurrentlyAdmin ? "Admin Access Granted" : "Admin Access Revoked",
        description: !isCurrentlyAdmin 
          ? "User has been granted admin access" 
          : "User's admin access has been revoked",
      });
    } catch (err) {
      console.error('Error updating admin status:', err);
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive"
      });
    }
  };

  const columns = [
    {
      header: "User",
      accessorKey: "username",
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.username || "Anonymous"}</div>
          <div className="text-xs text-muted-foreground">{row.display_name}</div>
        </div>
      ),
    },
    {
      header: "ID",
      accessorKey: "id",
      cell: (row: any) => (
        <div className="text-sm font-mono text-muted-foreground">
          {row.id.substring(0, 8)}...
        </div>
      ),
    },
    {
      header: "Points",
      accessorKey: "points",
      cell: (row: any) => (
        <div className="font-medium">
          {row.points || 0}
        </div>
      ),
    },
    {
      header: "Days Active", // Changed from "Login Streak" to "Days Active"
      accessorKey: "daysActive", // Using the new daysActive property
      cell: (row: any) => (
        <div className="font-medium">
          {row.daysActive || 0} days
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "suspended",
      cell: (row: any) => (
        <div className="flex items-center space-x-2">
          {row.suspended ? (
            <span className="flex items-center text-red-600 dark:text-red-400">
              <Ban className="w-4 h-4 mr-1" />
              Suspended
            </span>
          ) : (
            <span className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 mr-1" />
              Active
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Admin",
      accessorKey: "is_admin",
      cell: (row: any) => (
        <div className="flex items-center justify-center">
          {row.is_admin ? (
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <X className="w-5 h-5 text-red-500 dark:text-red-400" />
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (row: any) => (
        <div className="flex items-center space-x-2">
          <Button 
            variant={row.suspended ? "outline" : "destructive"} 
            size="sm"
            onClick={() => toggleSuspension(row.id, row.suspended)}
          >
            {row.suspended ? "Reactivate" : "Suspend"}
          </Button>
          
          <Button 
            variant={row.is_admin ? "destructive" : "outline"} 
            size="sm"
            onClick={() => grantAdminAccess(row.id, row.is_admin)}
          >
            {row.is_admin ? "Revoke Admin" : "Make Admin"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">User Management</h2>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <PaginatedDataTable
          columns={columns}
          data={filteredUsers}
          isLoading={isLoading}
          pageSize={10}
        />
      </div>
    </div>
  );
};

export default AdminUserManagementEnhanced;
