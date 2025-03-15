
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, UserX, UserPlus, Search, Check, X, Mail, KeyRound, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// User interface for our local storage
interface UserData {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  points: number;
  referredBy?: string;
  suspended: boolean;
  joinDate: string;
  role?: string;
}

const AdminUserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const form = useForm<Omit<UserData, 'id' | 'joinDate'>>();
  const editForm = useForm<UserData>();
  
  // Load users from localStorage and Supabase
  useEffect(() => {
    const loadUsers = async () => {
      // Get registered users
      const registeredUsers: UserData[] = [];
      
      // Get all users from localStorage who have registered from the frontend
      const storedUserName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      const userEmail = localStorage.getItem('quiz_app_user_email');
      const userPhone = localStorage.getItem('quiz_app_user_phone');
      const userPoints = localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0';
      
      // If we have a registered user not already in admin_users, add them
      if (storedUserName && userEmail) {
        registeredUsers.push({
          id: Date.now().toString(),
          name: storedUserName,
          email: userEmail,
          mobile: userPhone || undefined,
          points: parseInt(userPoints, 10),
          suspended: false,
          joinDate: new Date().toISOString().split('T')[0],
          role: 'player'
        });
      }
      
      // This is a mock implementation - in a real app, you'd fetch from a database
      const mockUsers: UserData[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          mobile: '9876543210',
          points: 450,
          suspended: false,
          joinDate: '2023-01-15',
          role: 'admin'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          mobile: '8765432109',
          points: 1200,
          referredBy: '1',
          suspended: false,
          joinDate: '2023-02-10',
          role: 'team_leader'
        },
        {
          id: '3',
          name: 'Mike Johnson',
          email: 'mike@example.com',
          mobile: '7654321098',
          points: 50,
          suspended: true,
          joinDate: '2023-03-05',
          role: 'player'
        }
      ];
      
      // Try to get users from Supabase first
      try {
        // Get profiles from Supabase
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }
        
        // Get user roles from Supabase
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*');
          
        if (rolesError) {
          console.error('Error fetching user roles:', rolesError);
          throw rolesError;
        }
        
        // Map roles to profiles
        const userRolesMap = new Map();
        if (rolesData) {
          rolesData.forEach((roleEntry) => {
            userRolesMap.set(roleEntry.user_id, roleEntry.role);
          });
        }
        
        // Convert Supabase profiles to our UserData format
        if (profilesData && profilesData.length > 0) {
          const supabaseUsers = profilesData.map(profile => ({
            id: profile.id,
            name: profile.username,
            email: `${profile.username}@quizpoints.app`, // Placeholder email since we don't store it
            mobile: profile.phone,
            points: profile.points || 0,
            suspended: profile.suspended || false,
            joinDate: profile.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            role: userRolesMap.get(profile.id) || 'player'
          }));
          
          setUsers(supabaseUsers);
          localStorage.setItem('admin_users', JSON.stringify(supabaseUsers));
          return;
        }
      } catch (error) {
        console.error('Error fetching users from Supabase:', error);
        // Fall back to localStorage if Supabase fetch fails
      }
      
      // If no data from Supabase, use localStorage
      const usersFromStorage = localStorage.getItem('admin_users');
      if (usersFromStorage) {
        const storedUsers = JSON.parse(usersFromStorage);
        
        // Add the currently logged in user if not already in the list
        let combinedUsers = [...storedUsers];
        
        if (storedUserName && userEmail) {
          const userExists = storedUsers.some((u: UserData) => 
            u.email.toLowerCase() === userEmail.toLowerCase() || 
            u.name.toLowerCase() === storedUserName.toLowerCase()
          );
          
          if (!userExists) {
            const newUser = {
              id: Date.now().toString(),
              name: storedUserName,
              email: userEmail,
              mobile: userPhone || undefined,
              points: parseInt(userPoints, 10),
              suspended: false,
              joinDate: new Date().toISOString().split('T')[0],
              role: 'player'
            };
            combinedUsers.push(newUser);
          }
        }
        
        // Check for any newly registered users that aren't in admin_users yet
        const registrations = JSON.parse(localStorage.getItem('quiz_app_registrations') || '[]');
        
        registrations.forEach((reg: any) => {
          const userExists = combinedUsers.some((u: UserData) => 
            u.email.toLowerCase() === reg.email.toLowerCase() || 
            u.name.toLowerCase() === reg.fullName.toLowerCase()
          );
          
          if (!userExists) {
            combinedUsers.push({
              id: Date.now().toString() + Math.random().toString().slice(2, 8),
              name: reg.fullName,
              email: reg.email,
              mobile: reg.phone,
              points: 10, // Default starting points
              suspended: false,
              joinDate: new Date().toISOString().split('T')[0],
              role: 'player'
            });
          }
        });
        
        setUsers(combinedUsers);
        localStorage.setItem('admin_users', JSON.stringify(combinedUsers));
      } else {
        // First time loading - initialize with mock data and any registered user
        const initialUsers = [...mockUsers, ...registeredUsers];
        setUsers(initialUsers);
        localStorage.setItem('admin_users', JSON.stringify(initialUsers));
      }
    };
    
    loadUsers();
  }, []);
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Create new user
  const handleCreateUser = async (data: Omit<UserData, 'id' | 'joinDate'>) => {
    try {
      // Try to create user in Supabase first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: 'temporary123', // Temporary password that will need to be reset
        options: {
          data: {
            username: data.name,
            phone: data.mobile
          }
        }
      });
      
      if (authError) throw authError;
      
      const userId = authData.user?.id;
      
      if (!userId) {
        throw new Error('Failed to create user account');
      }
      
      // Create profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: data.name,
          phone: data.mobile,
          points: data.points || 0,
          suspended: data.suspended || false
        });
        
      if (profileError) throw profileError;
      
      // Set user role in Supabase
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: data.role || 'player'
        });
        
      if (roleError) throw roleError;
      
      const newUser: UserData = {
        ...data,
        id: userId,
        joinDate: new Date().toISOString().split('T')[0]
      };
      
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('admin_users', JSON.stringify(updatedUsers));
      
      // Send email notification (simulated)
      sendEmailNotification(newUser);
      
      toast({
        title: "Success",
        description: `User ${newUser.name} has been created. Login details sent.`,
      });
      
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  
  // Simulate sending email notification
  const sendEmailNotification = (user: UserData) => {
    console.log(`Email sent to ${user.email} with login credentials`);
    // In a real implementation, you would call an API to send an email
    toast({
      title: "Email Sent",
      description: `Login details sent to ${user.email}`,
    });
  };
  
  // Edit existing user
  const handleEditUser = async (data: UserData) => {
    try {
      // Update user in Supabase if possible
      if (data.id) {
        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            username: data.name,
            phone: data.mobile,
            points: data.points,
            suspended: data.suspended
          })
          .eq('id', data.id);
          
        if (profileError) throw profileError;
        
        // Update or insert role
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: data.id,
            role: data.role || 'player'
          }, { onConflict: 'user_id' });
          
        if (roleError) throw roleError;
      }
      
      const updatedUsers = users.map(user => 
        user.id === data.id ? { ...data } : user
      );
      
      setUsers(updatedUsers);
      localStorage.setItem('admin_users', JSON.stringify(updatedUsers));
      
      toast({
        title: "Success",
        description: `User ${data.name} has been updated.`,
      });
      
      setIsEditDialogOpen(false);
      editForm.reset();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  
  // Reset password for a user
  const handleResetPassword = () => {
    if (!currentUser) return;
    
    // In a real app, you would generate a reset token and send an email
    // For this demo, we'll just simulate a successful reset
    console.log(`Password reset for ${currentUser.email}`);
    
    toast({
      title: "Password Reset",
      description: `Password reset link has been sent to ${currentUser.email}`,
    });
    
    setIsResetPasswordDialogOpen(false);
  };
  
  // Toggle user suspension status
  const toggleUserSuspension = async (userId: string) => {
    try {
      const userToUpdate = users.find(user => user.id === userId);
      if (!userToUpdate) return;
      
      const newStatus = !userToUpdate.suspended;
      
      // Update in Supabase if possible
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ suspended: newStatus })
        .eq('id', userId);
        
      if (updateError) throw updateError;
      
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
      localStorage.setItem('admin_users', JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error toggling user suspension:', error);
      toast({
        title: "Error",
        description: `Failed to update user status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  
  // Open edit dialog with user data
  const openEditDialog = (user: UserData) => {
    setCurrentUser(user);
    editForm.reset(user);
    setIsEditDialogOpen(true);
  };

  // Open reset password dialog
  const openResetPasswordDialog = (user: UserData) => {
    setCurrentUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  // Send login details to user
  const sendLoginDetails = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      sendEmailNotification(user);
    }
  };

  // Get role badge component based on user role
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </span>
        );
      case 'team_leader':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Shield className="w-3 h-3 mr-1" />
            Team Leader
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            <Shield className="w-3 h-3 mr-1" />
            Player
          </span>
        );
    }
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
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Referred By</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                  <TableCell>{user.mobile || 'N/A'}</TableCell>
                  <TableCell>{user.points}</TableCell>
                  <TableCell>{getRoleBadge(user.role || 'player')}</TableCell>
                  <TableCell>
                    {user.referredBy ? 
                      users.find(u => u.id === user.referredBy)?.name || 'Unknown' 
                      : 'None'}
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
                  <TableCell className="text-right space-x-2">
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will be able to participate in quizzes and earn points.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Points</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "player"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
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
              
              <FormField
                control={form.control}
                name="referredBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referred By (User ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
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
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
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
              <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "player"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
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
                
                <FormField
                  control={editForm.control}
                  name="referredBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred By (User ID)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
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
      
      {/* Reset Password Dialog */}
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
              <p><strong>Role:</strong> {currentUser?.role || 'Player'}</p>
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
    </div>
  );
};

export default AdminUserManagement;
