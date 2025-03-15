import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { MoreHorizontal, Search, UserPlus, Calendar, Clock, Award, Key, Mail } from 'lucide-react';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import AdminTopPerformers from './AdminTopPerformers';
import MD5 from 'crypto-js/md5';

interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  points: number;
  suspended: boolean;
  created_at: string;
  role?: string;
  last_login?: string;
  login_count?: number;
  daily_logins?: number;
  monthly_logins?: number;
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Invalid date';
  }
};

const AdminUserManagementEnhanced: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', phone: '', password: '', points: 0 });
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('player');
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdateEmailDialogOpen, setIsUpdateEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const { isListening: isListeningProfiles } = useRealtimeUpdates('profiles');
  const { isListening: isListeningLoginLogs } = useRealtimeUpdates('login_logs');
  const { isListening: isListeningQuizAnswers } = useRealtimeUpdates('quiz_answers');
  const { isListening: isListeningUserRoles } = useRealtimeUpdates('user_roles');

  const hashPassword = (password: string): string => {
    return MD5(password).toString();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      
      const { data: loginLogs, error: loginLogsError } = await supabase
        .from('login_logs')
        .select('*')
        .order('login_time', { ascending: false });
      
      if (loginLogsError) throw loginLogsError;
      
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (userRolesError) throw userRolesError;
      
      const usersWithMetadata: User[] = profiles.map((profile: any) => {
        const userLogins = loginLogs.filter((log: any) => log.username === profile.username);
        const lastLogin = userLogins.length > 0 ? userLogins[0].login_time : null;
        const loginCount = userLogins.length;
        
        const dailyLogins = loginLogs.filter(
          (log: any) => log.username === profile.username && log.login_time >= startOfDay
        ).length;
        
        const monthlyLogins = loginLogs.filter(
          (log: any) => log.username === profile.username && log.login_time >= startOfMonth
        ).length;
        
        const userRole = userRoles.find((role: any) => role.user_id === profile.id);
        const role = userRole ? userRole.role : 'player';
        
        return {
          id: profile.id,
          username: profile.username,
          phone: profile.phone,
          points: profile.points || 0,
          suspended: profile.suspended || false,
          created_at: profile.created_at,
          last_login: lastLogin,
          login_count: loginCount,
          daily_logins: dailyLogins,
          monthly_logins: monthlyLogins,
          role
        };
      });
      
      setUsers(usersWithMetadata);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isListeningProfiles, isListeningLoginLogs, isListeningQuizAnswers, isListeningUserRoles]);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddUser = async () => {
    try {
      if (!newUser.username || !newUser.password) {
        toast({
          title: "Error",
          description: "Username and password are required",
          variant: "destructive"
        });
        return;
      }

      const email = `${newUser.username.toLowerCase().replace(/[^a-z0-9]/g, '')}@quizpoints.app";
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: {
          username: newUser.username,
          phone: newUser.phone
        }
      });
      
      if (error) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: newUser.password,
          options: {
            data: {
              username: newUser.username,
              phone: newUser.phone
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (!signUpData.user) {
          throw new Error("Failed to create user account");
        }
        
        data.user = signUpData.user;
      }
      
      if (data.user) {
        const userId = data.user.id;
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: newUser.username,
            phone: newUser.phone,
            points: newUser.points || 0
          })
          .select()
          .single();
          
        if (profileError) {
          console.error('Error creating profile:', profileError);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              username: newUser.username,
              phone: newUser.phone,
              points: newUser.points || 0
            })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error updating profile:', updateError);
          }
        }
        
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'player'
          });
          
        if (roleError) {
          console.error('Error setting user role:', roleError);
        }
        
        toast({
          title: "Success",
          description: "User added successfully",
        });
        
        setNewUser({ username: '', email: '', phone: '', password: '', points: 0 });
        setIsAddUserDialogOpen(false);
        
        fetchUsers();
      } else {
        throw new Error("No user data returned");
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive"
      });
    }
  };

  const toggleUserSuspend = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ suspended: !currentStatus })
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, suspended: !currentStatus } : user
      ));
      
      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'suspended' : 'unsuspended'} successfully`,
      });
    } catch (error: any) {
      console.error('Error toggling user suspend status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    
    try {
      const { data, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', selectedUser.id);
        
      if (checkError) throw checkError;
      
      let roleError;
      
      if (data && data.length > 0) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: selectedRole })
          .eq('user_id', selectedUser.id);
          
        roleError = error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser.id,
            role: selectedRole
          });
          
        roleError = error;
      }
      
      if (roleError) throw roleError;
      
      toast({
        title: "Success",
        description: `User role updated to ${selectedRole}`,
      });
      
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, role: selectedRole } : user
      ));
      
      setIsEditRoleDialogOpen(false);
    } catch (error: any) {
      console.error('Error changing user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      toast({
        title: "Error",
        description: "User and new password are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const hashedPassword = hashPassword(newPassword);
      
      const { error } = await supabase
        .from('profiles')
        .update({ password_hash: hashedPassword })
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Password reset for ${selectedUser.username}`,
      });
      
      setIsResetPasswordDialogOpen(false);
      setNewPassword('');
      
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  const handleUpdateEmail = async () => {
    if (!selectedUser || !newEmail) {
      toast({
        title: "Error",
        description: "User and new email are required",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Success",
        description: `Email updated for ${selectedUser.username}`,
      });
      
      setIsUpdateEmailDialogOpen(false);
      setNewEmail('');
      
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users, points, and access
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
              <Button onClick={() => setIsAddUserDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="hidden md:table-cell">
                      <div className="flex items-center">
                        <Award className="mr-1 h-4 w-4" />
                        Points
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        Logins (D/M)
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-muted-foreground hidden md:block">
                            Joined: {formatDate(user.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{user.phone || "-"}</div>
                          <div className="text-xs text-muted-foreground hidden md:block">
                            Last login: {user.last_login ? formatDate(user.last_login) : "Never"}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary">{user.points}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex gap-1 items-center">
                            <Badge variant="outline" className="bg-blue-50">
                              <Calendar className="mr-1 h-3 w-3 text-blue-500" />
                              {user.daily_logins || 0}
                            </Badge>
                            <Badge variant="outline" className="bg-indigo-50">
                              <Calendar className="mr-1 h-3 w-3 text-indigo-500" />
                              {user.monthly_logins || 0}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.suspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-700">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.role === 'admin' ? (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Admin</Badge>
                          ) : user.role === 'team_leader' ? (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">Team Leader</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Player</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRole(user.role || 'player');
                                  setIsEditRoleDialogOpen(true);
                                }}
                              >
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewPassword('');
                                  setIsResetPasswordDialogOpen(true);
                                }}
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewEmail('');
                                  setIsUpdateEmailDialogOpen(true);
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Update Email
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => toggleUserSuspend(user.id, user.suspended)}
                                className={user.suspended ? "text-green-600" : "text-red-600"}
                              >
                                {user.suspended ? "Unsuspend User" : "Suspend User"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AdminTopPerformers />
      
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with permissions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="points" className="text-right">
                Initial Points
              </Label>
              <Input
                id="points"
                type="number"
                value={newUser.points}
                onChange={(e) => setNewUser({ ...newUser, points: parseInt(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAddUser}>
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              {selectedUser && `Update role for ${selectedUser.username}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="team_leader">Team Leader</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              {selectedUser && `Set a new password for ${selectedUser.username}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUpdateEmailDialogOpen} onOpenChange={setIsUpdateEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Email</DialogTitle>
            <DialogDescription>
              {selectedUser && `Set a new email for ${selectedUser.username}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEmail}>
              Update Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagementEnhanced;
