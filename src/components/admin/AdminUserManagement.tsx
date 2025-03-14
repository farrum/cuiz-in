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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { 
  Pencil, 
  UserX, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  Mail, 
  KeyRound,
  Shield 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  points: number;
  referredBy?: string;
  suspended: boolean;
  joinDate: string;
  role: 'admin' | 'team_leader' | 'player';
}

const AdminUserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<Omit<UserData, 'id' | 'joinDate' | 'role'>>();
  const editForm = useForm<UserData>();
  const roleForm = useForm<{ role: 'admin' | 'team_leader' | 'player' }>();
  
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      
      try {
        console.log('Fetching user profiles from Supabase');
        // Get all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }
        
        console.log(`Found ${profiles.length} profiles`);
        
        // Get all roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*');
          
        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          throw rolesError;
        }
        
        console.log(`Found ${roles.length} role assignments`);
        
        // Map profiles to our UserData format
        const mappedUsers: UserData[] = profiles.map(profile => {
          // Find user's role
          const userRole = roles.find(r => r.user_id === profile.id);
          
          return {
            id: profile.id,
            name: profile.username,
            email: profile.username, // Using username as fallback since email isn't in profiles
            points: profile.points || 0,
            suspended: profile.suspended || false,
            joinDate: new Date(profile.created_at).toISOString().split('T')[0],
            role: (userRole?.role as 'admin' | 'team_leader' | 'player') || 'player'
          };
        });
        
        console.log('Mapped user data:', mappedUsers);
        setUsers(mappedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [toast]);
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const toggleUserSuspension = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    const newStatus = !userToUpdate.suspended;
    
    try {
      // Update in database
      const { error } = await supabase
        .from('profiles')
        .update({ suspended: newStatus })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          toast({
            title: newStatus ? "User Suspended" : "User Activated",
            description: `${user.name} has been ${newStatus ? "suspended" : "activated"}.`,
            variant: newStatus ? "destructive" : "default"
          });
          return { ...user, suspended: newStatus };
        }
        return user;
      });
      
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error toggling user suspension:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };
  
  const openEditDialog = (user: UserData) => {
    setCurrentUser(user);
    editForm.reset(user);
    setIsEditDialogOpen(true);
  };

  const openResetPasswordDialog = (user: UserData) => {
    setCurrentUser(user);
    setIsResetPasswordDialogOpen(true);
  };
  
  const openRoleDialog = (user: UserData) => {
    setCurrentUser(user);
    roleForm.reset({ role: user.role });
    setIsRoleDialogOpen(true);
  };

  const handleRoleChange = async (data: { role: 'admin' | 'team_leader' | 'player' }) => {
    if (!currentUser) return;
    
    try {
      // First, check if user already has a role entry
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('role', currentUser.role);
        
      if (checkError) throw checkError;
      
      // If role exists and is different, update it
      if (existingRole && existingRole.length > 0) {
        // Delete the old role
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('role', currentUser.role);
          
        if (deleteError) throw deleteError;
      }
      
      // Add the new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: currentUser.id,
          role: data.role
        });
        
      if (insertError) throw insertError;
      
      // Update local state
      const updatedUsers = users.map(user => {
        if (user.id === currentUser.id) {
          return { ...user, role: data.role };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      
      toast({
        title: "Role Updated",
        description: `${currentUser.name}'s role has been changed to ${data.role}.`,
      });
      
      setIsRoleDialogOpen(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const sendLoginDetails = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      // Simulate sending email
      toast({
        title: "Email Sent",
        description: `Login details sent to ${user.email}`,
      });
    }
  };

  const handleResetPassword = () => {
    if (!currentUser) return;
    
    // In a real app, you would generate a reset token and send an email
    toast({
      title: "Password Reset",
      description: `Password reset link has been sent to ${currentUser.email}`,
    });
    
    setIsResetPasswordDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">User Management</h2>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className={user.suspended ? "bg-muted/50" : ""}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>{user.points}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                          : user.role === 'team_leader'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>{user.joinDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.suspended ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <X className="w-3 h-3 mr-1" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <Check className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        title="Edit User"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={user.suspended ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => toggleUserSuspension(user.id)}
                        title={user.suspended ? "Activate User" : "Suspend User"}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => sendLoginDetails(user.id)}
                        title="Send Login Details"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => openResetPasswordDialog(user)}
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => openRoleDialog(user)}
                        title="Change Role"
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          
          {currentUser && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(async (data) => {
                try {
                  // Update profile in database
                  const { error } = await supabase
                    .from('profiles')
                    .update({
                      username: data.name,
                      points: data.points,
                      suspended: data.suspended
                    })
                    .eq('id', data.id);
                    
                  if (error) throw error;
                  
                  // Update local state
                  const updatedUsers = users.map(user => 
                    user.id === data.id ? { ...data } : user
                  );
                  
                  setUsers(updatedUsers);
                  
                  toast({
                    title: "Success",
                    description: `User ${data.name} has been updated.`,
                  });
                  
                  setIsEditDialogOpen(false);
                } catch (error) {
                  console.error('Error updating user:', error);
                  toast({
                    title: "Error",
                    description: "Failed to update user",
                    variant: "destructive"
                  });
                }
              })} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="suspended"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant={!field.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => field.onChange(false)}
                          >
                            Active
                          </Button>
                          <Button
                            type="button"
                            variant={field.value ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => field.onChange(true)}
                          >
                            Suspended
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <input type="hidden" {...editForm.register('id')} />
                <input type="hidden" {...editForm.register('joinDate')} />
                <input type="hidden" {...editForm.register('role')} />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Send a password reset link to {currentUser?.name}. The user will receive an email with instructions to set a new password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm mb-2">User Details:</p>
            <div className="bg-secondary/30 p-3 rounded-lg">
              <p><strong>Name:</strong> {currentUser?.name}</p>
              <p><strong>Email:</strong> {currentUser?.email}</p>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsResetPasswordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleResetPassword}
            >
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {currentUser?.name}.
            </DialogDescription>
          </DialogHeader>
          
          {currentUser && (
            <Form {...roleForm}>
              <form onSubmit={roleForm.handleSubmit(handleRoleChange)} className="space-y-4">
                <FormField
                  control={roleForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="team_leader">Team Leader</SelectItem>
                          <SelectItem value="player">Player</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsRoleDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Update Role</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
