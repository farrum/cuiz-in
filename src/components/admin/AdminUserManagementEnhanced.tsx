
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AdminUserManagementEnhanced = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, filter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*, user_roles(role)', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      if (filter === 'suspended') {
        query = query.eq('suspended', true);
      } else if (filter === 'admin') {
        query = query.eq('is_admin', true);
      } else if (filter === 'teamleader') {
        query = query.eq('user_roles.role', 'teamleader');
      }

      const { data, error, count } = await query
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuspension = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ suspended: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === id ? { ...user, suspended: newStatus } : user
      ));
      
      toast({
        title: `User ${newStatus ? 'suspended' : 'unsuspended'}`,
        description: `User has been successfully ${newStatus ? 'suspended' : 'unsuspended'}`,
      });
    } catch (err) {
      console.error('Failed to update user suspension status:', err);
      toast({
        title: "Action failed",
        description: "Failed to update user suspension status",
        variant: "destructive"
      });
    }
  };
  
  const updateUserRole = async (id, newRole) => {
    try {
      // First check if role exists
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error code
        console.error('Error checking role:', checkError);
        throw checkError;
      }
      
      // If role exists, update it, otherwise insert
      let roleUpdateError;
      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', id);
        roleUpdateError = error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: id, role: newRole });
        roleUpdateError = error;
      }
      
      if (roleUpdateError) throw roleUpdateError;
      
      // Also update the is_admin status in profiles table if relevant
      if (newRole === 'admin') {
        await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', id);
      } else if (existingRole?.role === 'admin') {
        await supabase
          .from('profiles')
          .update({ is_admin: false })
          .eq('id', id);
      }
      
      // Refresh the users list
      fetchUsers();
      
      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}`,
      });
    } catch (err) {
      console.error('Failed to update user role:', err);
      toast({
        title: "Action failed",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const getUserInitials = (user) => {
    const displayName = user.display_name || user.username || '';
    const parts = displayName.split(' ');
    
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    return displayName.substring(0, 2).toUpperCase();
  };
  
  const getUserRole = (user) => {
    if (user.is_admin) return 'admin';
    if (user.user_roles && user.user_roles.role) return user.user_roles.role;
    return 'player';
  };
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'teamleader':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400';
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage === i}
              onClick={() => handlePageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (
        (i === currentPage - 2 && currentPage > 3) ||
        (i === currentPage + 2 && currentPage < totalPages - 2)
      ) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="w-full md:w-auto">
          <Input
            placeholder="Search by username, display name, or phone..."
            value={searchTerm}
            onChange={handleSearch}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={filter === 'all' ? "default" : "outline"} 
            size="sm"
            onClick={() => handleFilterChange('all')}
          >
            All Users
          </Button>
          <Button 
            variant={filter === 'suspended' ? "default" : "outline"} 
            size="sm"
            onClick={() => handleFilterChange('suspended')}
          >
            Suspended
          </Button>
          <Button 
            variant={filter === 'admin' ? "default" : "outline"} 
            size="sm"
            onClick={() => handleFilterChange('admin')}
          >
            Admins
          </Button>
          <Button 
            variant={filter === 'teamleader' ? "default" : "outline"} 
            size="sm"
            onClick={() => handleFilterChange('teamleader')}
          >
            Team Leaders
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            {user.profile_picture && (
                              <AvatarImage src={user.profile_picture} />
                            )}
                            <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.display_name || user.username}</div>
                            <div className="text-xs text-muted-foreground">{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getRoleColor(getUserRole(user))} border-0`}>
                          {getUserRole(user)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.points || 0}</TableCell>
                      <TableCell>
                        <Badge variant={user.suspended ? "destructive" : "success"}>
                          {user.suspended ? 'Suspended' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => toggleSuspension(user.id, user.suspended)}
                            variant="outline"
                            size="sm"
                          >
                            {user.suspended ? 'Unsuspend' : 'Suspend'}
                          </Button>
                          
                          <select 
                            value={getUserRole(user)}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="player">Player</option>
                            <option value="teamleader">Team Leader</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationPrevious
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : undefined}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
              {renderPagination()}
              <PaginationNext
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                aria-disabled={currentPage === totalPages}
                tabIndex={currentPage === totalPages ? -1 : undefined}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationContent>
          </Pagination>
        </>
      )}
    </div>
  );
};

export default AdminUserManagementEnhanced;
