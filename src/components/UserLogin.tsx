
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
  const [isInitializing, setIsInitializing] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Initialize test users if needed
  useEffect(() => {
    const initializeUsers = async () => {
      if (isInitializing) return;
      
      try {
        setIsInitializing(true);
        
        // Check if admin user exists by listing users and filtering
        console.log('Checking for admin user...');
        const adminEmail = 'quizadmin@quizpoints.com';
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
          console.error('Error listing users:', usersError);
          return;
        }
        
        // Type assertion to handle the users array
        const adminUser = usersData?.users?.find(u => {
          // Safe access the email property with optional chaining
          return u && typeof u === 'object' && 'email' in u && u.email === adminEmail;
        });
        
        if (!adminUser) {
          console.log('Creating admin user...');
          
          // Create admin user
          const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: '!Quizzer123',
            email_confirm: true,
            user_metadata: {
              full_name: 'Quiz Admin'
            }
          });
          
          if (adminError) {
            console.error('Error creating admin user:', adminError);
          } else if (adminUser?.user) {
            console.log('Admin user created with ID:', adminUser.user.id);
            
            // Update profile
            await supabase
              .from('profiles')
              .update({ 
                username: 'quizadmin',
                points: 999
              })
              .eq('id', adminUser.user.id);
              
            // Assign admin role
            await supabase
              .from('user_roles')
              .insert({
                user_id: adminUser.user.id,
                role: 'admin'
              });
              
            console.log('Admin user setup complete');
          }
        } else {
          console.log('Admin user already exists');
          
          // Ensure admin has the admin role
          const { error: roleCheckError, data: existingRole } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', adminUser.id)
            .eq('role', 'admin')
            .maybeSingle();
            
          if (!existingRole && (!roleCheckError || roleCheckError.code === 'PGRST116')) {
            console.log('Setting admin role for existing admin user');
            
            await supabase
              .from('user_roles')
              .insert({
                user_id: adminUser.id,
                role: 'admin'
              });
          }
        }
        
        // Check for a test user
        const testEmail = 'testuser@example.com';
        console.log('Checking for test user...');
        
        // Type assertion to handle the users array
        const testUser = usersData?.users?.find(u => {
          // Safe access the email property with optional chaining
          return u && typeof u === 'object' && 'email' in u && u.email === testEmail;
        });
        
        if (!testUser) {
          console.log('Creating test user...');
          
          // Create test user
          const { data: testUser, error: testError } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: {
              full_name: 'Test User'
            }
          });
          
          if (testError) {
            console.error('Error creating test user:', testError);
          } else if (testUser?.user) {
            console.log('Test user created with ID:', testUser.user.id);
            
            // Update profile
            await supabase
              .from('profiles')
              .update({ 
                username: 'testuser',
                points: 50
              })
              .eq('id', testUser.user.id);
              
            // Assign player role
            await supabase
              .from('user_roles')
              .insert({
                user_id: testUser.user.id,
                role: 'player'
              });
              
            console.log('Test user setup complete');
          }
        } else {
          console.log('Test user already exists');
        }
        
      } catch (error) {
        console.error('Error initializing users:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeUsers();
  }, []);

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
      // Handle special case for admin
      if (identifier.toLowerCase() === 'quizadmin') {
        console.log('Logging in admin from user login');
        const adminEmail = 'quizadmin@quizpoints.com';
        const { error } = await signIn(adminEmail, password);
        
        if (error) {
          throw error;
        }
        
        await refreshUserRole();
        navigate('/admin');
        return;
      }
      
      // For email login
      if (identifier.includes('@')) {
        console.log('Logging in with email:', identifier);
        const { error } = await signIn(identifier, password);
        
        if (error) {
          throw error;
        }
        
        await refreshUserRole();
        navigate('/');
        return;
      }
      
      // For username login
      console.log('Looking up email for username:', identifier);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', identifier)
        .maybeSingle();
        
      if (profileError || !profileData) {
        console.error('Profile lookup error:', profileError);
        throw new Error('Invalid username or password');
      }
      
      // Get user from auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileData.id);
      
      if (userError || !userData?.user?.email) {
        console.error('User lookup error:', userError);
        throw new Error('User email not found');
      }
      
      const { error } = await signIn(userData.user.email, password);
      
      if (error) {
        throw error;
      }
      
      await refreshUserRole();
      navigate('/');
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid username/email or password",
        variant: "destructive"
      });
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
            disabled={isLoggingIn || isInitializing}
          >
            {isLoggingIn ? 'Logging in...' : isInitializing ? 'Initializing...' : 'Log In'}
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
          
          {isInitializing && (
            <div className="text-center mt-2">
              <p className="text-xs text-muted-foreground">Setting up demo accounts...</p>
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
