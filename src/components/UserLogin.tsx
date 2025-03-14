import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { Key, User, EyeOff, Eye, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Check if username is admin
const isAdmin = (username: string): boolean => {
  return username === 'quizadmin';
};

// Log login activity
const logLogin = async (username: string, successful: boolean) => {
  // Log to localStorage for backward compatibility
  const loginLog = {
    username,
    date: new Date().toISOString(),
    successful,
    ip: '127.0.0.1', // In a real app, this would be the actual IP
    userAgent: navigator.userAgent
  };
  
  const logins = JSON.parse(localStorage.getItem('quiz_app_login_log') || '[]');
  logins.push(loginLog);
  localStorage.setItem('quiz_app_login_log', JSON.stringify(logins));
  
  // Log to Supabase
  try {
    const { error } = await supabase
      .from('login_logs')
      .insert({
        username: username,
        ip_address: '127.0.0.1', // In a real app, this would be the actual IP
        device: navigator.userAgent,
        login_time: new Date().toISOString(),
        successful: successful
      });
      
    if (error) {
      console.error('Error logging to Supabase:', error);
    }
  } catch (err) {
    console.error('Failed to log login to Supabase:', err);
  }
};

const UserLogin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    // Simple validation
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      setIsLoggingIn(false);
      logLogin(username, false);
      return;
    }

    // Check if admin credentials
    if (isAdmin(username)) {
      toast({
        title: "Admin Login",
        description: "Please use the admin login page",
        variant: "destructive"
      });
      navigate('/admin-login');
      setIsLoggingIn(false);
      logLogin(username, false);
      return;
    }

    try {
      // Try to authenticate with Supabase first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@example.com`, // Using username as email for this example
        password: password
      });
      
      if (error) {
        console.log('Supabase auth error, falling back to local auth:', error);
      } else if (data.user) {
        // Successful Supabase authentication
        localStorage.setItem(STORAGE_KEYS.USER_NAME, username);
        
        toast({
          title: "Success",
          description: "You have successfully logged in",
        });
        
        await logLogin(username, true);
        
        navigate('/');
        setIsLoggingIn(false);
        return;
      }
    } catch (err) {
      console.error('Supabase auth error:', err);
    }

    // Fallback to local authentication
    // Check if the user exists in the admin users list
    const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
    const user = adminUsers.find((u: any) => 
      u.name.toLowerCase() === username.toLowerCase() || 
      u.email.toLowerCase() === username.toLowerCase()
    );

    if (user) {
      // For this example, we're not checking passwords since they're not stored securely
      localStorage.setItem(STORAGE_KEYS.USER_NAME, user.name);
      localStorage.setItem('quiz_app_user_email', user.email);
      localStorage.setItem('quiz_app_user_phone', user.mobile || '');
      
      // Initialize points if first time
      if (!localStorage.getItem(STORAGE_KEYS.USER_POINTS)) {
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, user.points.toString() || '0');
      }
      
      toast({
        title: "Success",
        description: "You have successfully logged in",
      });
      
      // Log the successful login
      await logLogin(user.name, true);
      
      // Sync user data with Supabase
      try {
        // Check if user exists in profiles table
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', user.name);
          
        if (!profiles || profiles.length === 0) {
          // Add user to profiles if not exists
          await supabase
            .from('profiles')
            .insert({
              id: user.id || Math.random().toString(36).substring(2, 15),
              username: user.name,
              phone: user.mobile,
              points: user.points,
              suspended: user.suspended || false
            });
        }
      } catch (err) {
        console.error('Failed to sync user data with Supabase:', err);
      }
      
      navigate('/');
      setIsLoggingIn(false);
      return;
    }

    // For regular users not in admin list, just store their username
    localStorage.setItem(STORAGE_KEYS.USER_NAME, username);
    
    // Initialize points if first time
    if (!localStorage.getItem(STORAGE_KEYS.USER_POINTS)) {
      localStorage.setItem(STORAGE_KEYS.USER_POINTS, '0');
    }
    
    toast({
      title: "Success",
      description: "You have successfully logged in",
    });
    
    // Log the successful login
    await logLogin(username, true);
    
    navigate('/');
    setIsLoggingIn(false);
  };

  const handleResetPassword = (e: React.FormEvent) => {
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

    // In a real app, you would send a password reset email
    // For this demo, we'll just display a success message
    setTimeout(() => {
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password",
      });
      setResetDialogOpen(false);
      setIsResetting(false);
      setResetEmail('');
    }, 1500);
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
            disabled={isLoggingIn}
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

