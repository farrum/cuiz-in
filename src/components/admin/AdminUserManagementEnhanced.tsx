
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaginatedDataTable } from '@/components/ui/paginated-data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Ban, Key, Search, UserCheck, User } from 'lucide-react';

interface AdminUserManagementEnhancedProps {
  onResetPassword: (userId: string) => void;
  onUserSelect: (userId: string) => void;
}

const AdminUserManagementEnhanced: React.FC<AdminUserManagementEnhancedProps> = ({
  onResetPassword,
  onUserSelect
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ suspended: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${currentStatus ? 'unsuspended' : 'suspended'} successfully`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error toggling user suspension:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const columns = [
    {
      header: 'User',
      accessorKey: 'username',
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.row.original.profile_picture} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.row.original.display_name || row.row.original.username}</div>
            <div className="text-sm text-muted-foreground">@{row.row.original.username}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: (row: any) => row.getValue() || '-'
    },
    {
      header: 'Points',
      accessorKey: 'points',
      cell: (row: any) => (
        <Badge variant="secondary">{row.getValue()}</Badge>
      )
    },
    {
      header: 'Status',
      accessorKey: 'suspended',
      cell: (row: any) => (
        <Badge variant={row.getValue() ? 'destructive' : 'success'}>
          {row.getValue() ? 'Suspended' : 'Active'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (row: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUserSelect(row.getValue())}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleUserSuspension(row.getValue(), row.row.original.suspended)}
          >
            {row.row.original.suspended ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onResetPassword(row.getValue())}
          >
            <Key className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.phone && user.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center pb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-[300px]"
          />
        </div>
      </div>

      <PaginatedDataTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        pageSize={10}
        searchPlaceholder="Search users..."
      />
    </div>
  );
};

export default AdminUserManagementEnhanced;
