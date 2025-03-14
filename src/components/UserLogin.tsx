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

const isAdmin = (username: string): boolean => {
  return username === 'quizadmin';
};

const logLogin = async (username: string, successful: boolean) => {
  const loginLog = {
    username,
    date: new Date().toISOString(),
    successful,
    ip: '127.0.0.1',
    userAgent: navigator.userAgent
  };
  
  const logins = JSON.parse(localStorage.getItem('quiz_app_login_log') || '[]');
  logins.push(loginLog);
  localStorage.setItem('quiz_app_login_log', JSON.stringify(logins));
  
  try {
    const { error } = await supabase
      .from('login_logs')
      .insert({
        username: username,
        ip_address: '127.0.0.1',
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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (!profileError && profileData) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${username}@example.com`,
          password: password
        });
        
        if (error) {
          console.log('Supabase auth error, falling back to local auth:', error);
          if (error.message.includes('Invalid login credentials')) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: `${username}@example.com`,
              password: password,
              options: {
                data: {
                  username: username
                }
              }
            });
            
            if (!signUpError) {
              localStorage.setItem(STORAGE_KEYS.USER_NAME, username);
              toast({
                title: "Success",
                description: "Account created and logged in",
              });
              await logLogin(username, true);
              navigate('/');
              setIsLoggingIn(false);
              return;
            }
          }
        } else if (data.user) {
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
      }
    } catch (err) {
      console.error('Supabase auth error:', err);
    }

    const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
    const user = adminUsers.find((u: any) => 
      u.name.toLowerCase() === username.toLowerCase() || 
      u.email.toLowerCase() === username.toLowerCase()
    );

    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, user.name);
      localStorage.setItem('quiz_app_user_email', user.email);
      localStorage.setItem('quiz_app_user_phone', user.mobile || '');
      
      if (!localStorage.getItem(STORAGE_KEYS.USER_POINTS)) {
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, user.points.toString() || '0');
      }
      
      toast({
        title: "Success",
        description: "You have successfully logged in",
      });
      
      await logLogin(user.name, true);
      
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', user.name);
          
        if (!profiles || profiles.length === 0) {
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

    localStorage.setItem(STORAGE_KEYS.USER_NAME, username);
    
    if (!localStorage.getItem(STORAGE_KEYS.USER_POINTS)) {
      localStorage.setItem(STORAGE_KEYS.USER_POINTS, '0');
    }
    
    toast({
      title: "Success",
      description: "You have successfully logged in",
    });
    
    await logLogin(username, true);
    
    navigate('/');
    setIsLoggingIn(false);
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
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) {
        console.error('Error sending reset password:', error);
        toast({
          title: "Error",
          description: "Failed to send password reset email. " + error.message,
          variant: "destructive"
        });
        setIsResetting(false);
        return;
      }
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password",
      });
      setResetDialogOpen(false);
      setIsResetting(false);
      setResetEmail('');
    } catch (err) {
      console.error('Error in password reset:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      setIsResetting(false);
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
