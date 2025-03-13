
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
import { Pencil, UserX, UserPlus, Search, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';

// User interface for our local storage
interface UserData {
  id: string;
  name: string;
  email: string;
  points: number;
  referredBy?: string;
  suspended: boolean;
  joinDate: string;
}

const AdminUserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const form = useForm<Omit<UserData, 'id' | 'joinDate'>>();
  const editForm = useForm<UserData>();
  
  // Load users from localStorage
  useEffect(() => {
    // This is a mock implementation - in a real app, you'd fetch from a database
    const mockUsers: UserData[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        points: 450,
        suspended: false,
        joinDate: '2023-01-15'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        points: 1200,
        referredBy: '1',
        suspended: false,
        joinDate: '2023-02-10'
      },
      {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        points: 50,
        suspended: true,
        joinDate: '2023-03-05'
      }
    ];
    
    // In a real implementation, you'd load from your database instead
    const usersFromStorage = localStorage.getItem('admin_users');
    if (usersFromStorage) {
      setUsers(JSON.parse(usersFromStorage));
    } else {
      setUsers(mockUsers);
      localStorage.setItem('admin_users', JSON.stringify(mockUsers));
    }
  }, []);
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Create new user
  const handleCreateUser = (data: Omit<UserData, 'id' | 'joinDate'>) => {
    const newUser: UserData = {
      ...data,
      id: Date.now().toString(),
      joinDate: new Date().toISOString().split('T')[0]
    };
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('admin_users', JSON.stringify(updatedUsers));
    
    toast({
      title: "Success",
      description: `User ${newUser.name} has been created.`,
    });
    
    setIsCreateDialogOpen(false);
    form.reset();
  };
  
  // Edit existing user
  const handleEditUser = (data: UserData) => {
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
  };
  
  // Toggle user suspension status
  const toggleUserSuspension = (userId: string) => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        const newStatus = !user.suspended;
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
  };
  
  // Open edit dialog with user data
  const openEditDialog = (user: UserData) => {
    setCurrentUser(user);
    editForm.reset(user);
    setIsEditDialogOpen(true);
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
              <TableHead>Points</TableHead>
              <TableHead>Referred By</TableHead>
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
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={user.suspended ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => toggleUserSuspension(user.id)}
                    >
                      <UserX className="w-4 h-4" />
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
    </div>
  );
};

export default AdminUserManagement;
