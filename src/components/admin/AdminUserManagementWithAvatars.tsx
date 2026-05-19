import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserRound, Ban, UserCheck, Edit, Trash, Award, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { getUserLoginStreak } from '@/services/loginStreakService';
import { approveReactivationRequest } from '@/utils/accountSuspension';

interface UserData {
  id: string;
  username: string;
  display_name?: string;
  phone?: string;
  gems: number;
  suspended: boolean;
  profile_picture?: string;
  created_at: string;
  upi_id?: string;
  login_streak?: number;
  reactivation_requested?: boolean;
  reactivation_approved?: boolean;
  reactivation_requested_at?: string;
}

const AdminUserManagementWithAvatars: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGems, setEditGems] = useState(0);
  const [editSuspended, setEditSuspended] = useState(false);
  const [editUpiId, setEditUpiId] = useState('');
  const { toast } = useToast();
  
  const { isListening } = useRealtimeUpdates('profiles');

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        const enhancedUserData: UserData[] = [];
        
        const { data: streakData, error: streakError } = await supabase
          .from('login_streaks')
          .select('*');
          
        if (streakError) {
          console.error('Error fetching login streaks:', streakError);
        }
        
        const userStreaks = new Map();
        if (streakData) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          streakData.forEach(streak => {
            const lastLoginDate = new Date(streak.last_login_date);
            lastLoginDate.setHours(0, 0, 0, 0);
            
            const diffTime = today.getTime() - lastLoginDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            const currentStreak = diffDays <= 1 ? streak.current_streak : 0;
            userStreaks.set(streak.user_id, currentStreak);
          });
        }
        
        for (const user of data) {
          enhancedUserData.push({
            ...user,
            login_streak: userStreaks.get(user.id) || 0
          });
        }
        
        setUsers(enhancedUserData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
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
    loadUsers();
  }, []);
  
  useEffect(() => {
    if (isListening) {
      loadUsers();
    }
  }, [isListening]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(user => 
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.phone && user.phone.includes(searchTerm))
  );

  const openEditDialog = (user: UserData) => {
    setSelectedUser(user);
    setEditDisplayName(user.display_name || user.username || '');
    setEditPhone(user.phone || '');
    setEditGems(user.gems);
    setEditSuspended(user.suspended);
    setEditUpiId(user.upi_id || '');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editDisplayName,
          phone: editPhone || null,
          gems: editGems,
          suspended: editSuspended,
          upi_id: editUpiId || null
        })
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      
      setIsEditDialogOpen(false);
      loadUsers();
      
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      
      setIsDeleteDialogOpen(false);
      loadUsers();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const toggleUserSuspension = async (user: UserData) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ suspended: !user.suspended })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `User ${user.suspended ? 'unsuspended' : 'suspended'} successfully`,
      });
      
      loadUsers();
      
    } catch (error) {
      console.error('Error toggling user suspension:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleApproveReactivation = async (userId: string) => {
    try {
      const result = await approveReactivationRequest(userId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Reactivation request approved',
        });
        
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, reactivation_approved: true } 
            : user
        ));
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

  const renderUserAvatar = (user: UserData) => {
    if (user.profile_picture) {
      if (user.profile_picture.startsWith('http')) {
        return (
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.profile_picture} alt={user.display_name || user.username} />
            <AvatarFallback>
              {(user.display_name || user.username || '?').substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        );
      } else {
        switch (user.profile_picture) {
          case 'user-round':
            return (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <UserRound className="h-4 w-4 text-primary" />
              </div>
            );
          case 'smile':
            return (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm">😊</span>
              </div>
            );
          case 'robot':
            return (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
            );
          case 'graduation-cap':
            return (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm">🎓</span>
              </div>
            );
          case 'award':
            return (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm">🏆</span>
              </div>
            );
          default:
            return (
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {(user.display_name || user.username || '?').substring(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            );
        }
      }
    }
    
    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          {(user.display_name || user.username || '?').substring(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8 w-[200px] sm:w-[300px]"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Gems</TableHead>
              <TableHead>UPI ID</TableHead>
              <TableHead>Login Streak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center p-4">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {renderUserAvatar(user)}
                    </div>
                  </TableCell>
                  <TableCell>{user.display_name || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.username}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>{user.gems}</TableCell>
                  <TableCell>{user.upi_id || '-'}</TableCell>
                  <TableCell>
                    {user.login_streak > 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {user.login_streak} days
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.suspended ? (
                      user.reactivation_requested && !user.reactivation_approved ? (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Reactivation Requested
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Suspended</Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="bg-green-100 text-green-700">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.suspended && user.reactivation_requested && !user.reactivation_approved && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleApproveReactivation(user.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => toggleUserSuspension(user)}>
                        {user.suspended ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openDeleteDialog(user)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center p-4">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={9} className="text-right">
                Total Users: {filteredUsers.length}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            {selectedUser && (
              <DialogDescription>
                Editing profile for username: <strong>{selectedUser.username}</strong>
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="displayName" className="text-right">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="upiId" className="text-right">
                UPI ID
              </Label>
              <Input
                id="upiId"
                value={editUpiId}
                onChange={(e) => setEditUpiId(e.target.value)}
                className="col-span-3"
                placeholder="Optional UPI ID for withdrawals"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gems" className="text-right">
                Gems
              </Label>
              <Input
                id="gems"
                type="number"
                value={editGems}
                onChange={(e) => setEditGems(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="suspended" className="text-right">
                Suspended
              </Label>
              <Switch
                id="suspended"
                checked={editSuspended}
                onCheckedChange={setEditSuspended}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && (
              <div className="flex items-center gap-2 p-2 border rounded">
                {renderUserAvatar(selectedUser)}
                <div>
                  <div className="font-medium">{selectedUser.display_name || selectedUser.username}</div>
                  <div className="text-sm text-muted-foreground">
                    @{selectedUser.username} • {selectedUser.phone || 'No phone number'}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagementWithAvatars;
