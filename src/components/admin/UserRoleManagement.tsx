
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, User, Users, Search, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Profile, UserRole } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';

interface UserWithRole extends Profile {
  role: string;
}

// Define the valid role types to match our UserRole type
type ValidRoleType = 'admin' | 'team_leader' | 'player';

const UserRoleManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<ValidRoleType | ''>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredUsers(
        users.filter(user => 
          user.username?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      
      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;
      
      // Combine data
      const usersWithRoles = profiles.map(profile => {
        const userRole = userRoles.find(role => role.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'player' // Default to player if no role assigned
        };
      });
      
      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedRole || selectedUsers.length === 0) {
      toast({
        title: "Invalid Selection",
        description: "Please select a role and at least one user",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      // Process each selected user
      for (const userId of selectedUsers) {
        // Check if user already has a role
        const { data: existingRole, error: checkError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        if (existingRole) {
          // Update existing role
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ role: selectedRole as ValidRoleType })
            .eq('user_id', userId);
          
          if (updateError) throw updateError;
        } else {
          // Insert new role
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({ 
              user_id: userId, 
              role: selectedRole as ValidRoleType 
            });
          
          if (insertError) throw insertError;
        }
      }
      
      toast({
        title: "Roles Updated",
        description: `Updated ${selectedUsers.length} user(s) to ${selectedRole} role`,
      });
      
      // Refresh users list
      loadUsers();
      
      // Clear selections
      setSelectedUsers([]);
      setSelectedRole('');
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: "Error",
        description: "Failed to update user roles. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prevSelected => 
      prevSelected.includes(userId)
        ? prevSelected.filter(id => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" /> User Role Management
        </CardTitle>
        <CardDescription>
          Assign roles to users to control their access levels in the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select 
                value={selectedRole} 
                onValueChange={(value: string) => setSelectedRole(value as ValidRoleType)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="team_leader">Team Leader</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleRoleChange} 
                disabled={isUpdating || selectedUsers.length === 0 || !selectedRole}
              >
                {isUpdating ? 'Updating...' : 'Update Roles'}
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} 
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all users"
                      />
                    </TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        {searchTerm ? 'No users match your search' : 'No users found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedUsers.includes(user.id)} 
                            onCheckedChange={() => toggleSelectUser(user.id)}
                            aria-label={`Select ${user.username}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          {user.username || 'Anonymous'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === 'admin' ? 'destructive' : 
                            user.role === 'team_leader' ? 'default' : 
                            'secondary'
                          }>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.suspended ? (
                            <div className="flex items-center text-destructive">
                              <XCircle className="h-4 w-4 mr-1" />
                              Suspended
                            </div>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Active
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{user.points || 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRoleManagement;
