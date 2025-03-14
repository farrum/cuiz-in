
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { Key, User, EyeOff, Eye, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const UserLogin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, user, refreshUserRole } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    // Simple validation
    if (!identifier || !password) {
      toast({
        title: "Error",
        description: "Please enter both username/email and password",
        variant: "destructive"
      });
      setIsLoggingIn(false);
      return;
    }

    try {
      console.log('Attempting login with:', identifier);
      const { error, data } = await signIn(identifier, password);
      
      if (error) {
        throw error;
      }
      
      // Refresh role information
      await refreshUserRole();
      
      toast({
        title: "Success",
        description: "You have successfully logged in",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid username/email or password",
        variant: "destructive"
      });
      
      // Still log failed attempts to the database
      try {
        await supabase.from('login_logs').insert({
          username: identifier,
          login_time: new Date().toISOString(),
          device: navigator.userAgent,
          ip_address: '127.0.0.1', // This would be set by the server in a real app
          user_id: null // No user ID for failed attempts
        });
      } catch (logError) {
        console.error('Failed to log login attempt:', logError);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      setIsResetting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password",
      });
      
      setResetDialogOpen(false);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reset password email",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
      setResetEmail('');
    }
  };

  // Create admin user on first load (if needed)
  useEffect(() => {
    const createAdminUser = async () => {
      try {
        setIsCreatingAdmin(true);
        console.log('Checking for admin user...');
        
        // Check if the specific admin user exists already
        const { data: existingAdmin, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', 'quizadmin')
          .limit(1);
          
        if (checkError) {
          console.error('Error checking for admin user:', checkError);
          setIsCreatingAdmin(false);
          return;
        }
        
        if (existingAdmin && existingAdmin.length > 0) {
          console.log('Admin user already exists with ID:', existingAdmin[0].id);
          setIsCreatingAdmin(false);
          return;
        }
        
        // Delete any existing admin users
        console.log('Removing existing admin users...');
        const { data: adminRoles, error: adminRolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');
        
        if (adminRolesError) {
          console.error('Error fetching admin roles:', adminRolesError);
        } else if (adminRoles && adminRoles.length > 0) {
          for (const adminRole of adminRoles) {
            // Delete the user's auth record
            const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
              adminRole.user_id
            );
            
            if (deleteAuthError) {
              console.error('Error deleting admin auth user:', deleteAuthError);
            } else {
              console.log('Successfully deleted admin user:', adminRole.user_id);
            }
          }
        }
        
        console.log('Creating new admin user...');
        
        // Create admin user with the specified credentials
        const { data: adminUser, error: signUpError } = await supabase.auth.signUp({
          email: 'quizadmin@quizpoints.com',
          password: '!Quizzer123',
          options: {
            data: {
              full_name: 'Quiz Admin',
            }
          }
        });
        
        if (signUpError) {
          console.error('Error creating admin user:', signUpError);
          setIsCreatingAdmin(false);
          return;
        }
        
        if (adminUser?.user) {
          console.log('Admin user created with ID:', adminUser.user.id);
          
          // Update the admin's username
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              username: 'quizadmin',
              points: 999
            })
            .eq('id', adminUser.user.id);
            
          if (profileError) {
            console.error('Error updating admin profile:', profileError);
          } else {
            console.log('Admin profile updated successfully');
          }
            
          // Assign admin role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: adminUser.user.id,
              role: 'admin'
            });
            
          if (roleError) {
            console.error('Error assigning admin role:', roleError);
          } else {
            console.log('Admin user role assigned successfully');
            
            // Initialize daily and monthly points for admin
            const today = new Date().toISOString().split('T')[0];
            const yearMonth = today.substring(0, 7).replace('-', '_');
            
            await supabase.from('daily_points').insert({
              user_id: adminUser.user.id,
              date: today,
              points: 0
            });
            
            await supabase.from('monthly_points').insert({
              user_id: adminUser.user.id,
              year_month: yearMonth,
              points: 0
            });
            
            console.log('Admin user setup complete');
          }
        } else {
          console.log('Failed to create admin user - no user data returned');
        }
      } catch (error) {
        console.error('Error in admin user creation:', error);
      } finally {
        setIsCreatingAdmin(false);
      }
    };
    
    createAdminUser();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">User Login</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Username or Email"
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="pl-10"
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setResetDialogOpen(true)}
            >
              Forgot Password?
            </button>
          </div>
          
          <Button
            type="submit"
            className="w-full btn-shine"
            disabled={isLoggingIn || isCreatingAdmin}
          >
            {isLoggingIn ? 'Logging in...' : 'Log In'}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Admin?{' '}
              <Link to="/admin-login" className="text-primary hover:underline">
                Admin Login
              </Link>
            </p>
          </div>
          
          {isCreatingAdmin && (
            <div className="text-center mt-2">
              <p className="text-xs text-muted-foreground">Setting up admin account...</p>
            </div>
          )}
        </form>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription>
              Enter your email address, and we'll send you instructions to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Email Address"
                className="pl-10"
                required
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setResetDialogOpen(false)}
                disabled={isResetting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isResetting}
              >
                {isResetting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserLogin;
