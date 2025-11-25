
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Key, User, EyeOff, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { setUserContext } from '@/utils/authContext';

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'quizadmin',
  password: '!Quizzer123'
};

const AdminLogin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check if already logged in as admin
  useEffect(() => {
    const isAdminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
    
    if (isAdminAuth) {
      console.log('Admin already authenticated, redirecting to admin panel');
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      // Simple validation
      if (!username || !password) {
        toast({
          title: "Error",
          description: "Please enter both username and password",
          variant: "destructive"
        });
        setIsLoggingIn(false);
        return;
      }

      console.log(`Attempting admin login with username: ${username}`);

      // Check credentials against hardcoded values first for simplicity
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        console.log("Local admin authentication successful");
        
        try {
          // First, sign in with Supabase auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'quizadmin@example.com', // Using the email we set in our SQL migration
            password: password
          });
          
          if (authError) {
            console.error('Supabase auth error:', authError);
            // Continue with local auth if Supabase auth fails
          } else if (authData.user) {
            console.log('Supabase auth successful, user ID:', authData.user.id);
            
            // Update the profiles table to set this user as an admin
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ is_admin: true })
              .eq('id', authData.user.id);
              
            if (updateError) {
              console.error('Failed to update admin status:', updateError);
            } else {
              console.log('Updated admin status in profiles table');
            }
          }
        } catch (err) {
          console.error('Error updating Supabase admin status:', err);
          // Continue with local auth
        }
        
        // Set user context for RLS policies using existing admin user
        const adminUserId = '066otqbbqac7'; // Main admin user (player) in database
        await setUserContext(adminUserId);
        console.log('User context set for admin:', adminUserId);
        
        // Store admin data in localStorage
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, ADMIN_CREDENTIALS.username);
        localStorage.setItem(STORAGE_KEYS.USER_ID, adminUserId);
        localStorage.setItem(STORAGE_KEYS.USER_NAME, 'player');
        
        console.log('Admin localStorage set:', {
          adminAuth: 'true',
          userId: adminUserId,
          username: 'player'
        });
        
        // Log the successful login
        try {
          await supabase
            .from('login_logs')
            .insert({
              username: username,
              ip_address: '127.0.0.1',
              device: navigator.userAgent,
              login_time: new Date().toISOString(),
              successful: true
            });
        } catch (logError) {
          console.error('Failed to log admin login:', logError);
        }
        
        toast({
          title: "Success",
          description: "You have successfully logged in as admin",
        });
        
        navigate('/admin');
        setIsLoggingIn(false);
        return;
      }
      
      // Try Supabase authentication as fallback
      console.log("Attempting Supabase authentication");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'quizadmin@example.com',
        password: password
      });
      
      if (!error && data.user) {
        console.log("Supabase authentication successful");
        
        // Update the profiles table to set this user as an admin
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', data.user.id);
          
        if (updateError) {
          console.error('Failed to update admin status:', updateError);
        } else {
          console.log('Updated user as admin in profiles table');
        }
        
        // Store only essential admin data in localStorage
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        localStorage.setItem(STORAGE_KEYS.USER_ID, data.user.id);
        localStorage.setItem(STORAGE_KEYS.USER_NAME, 'quizadmin');
        
        // Log the successful login
        try {
          await supabase
            .from('login_logs')
            .insert({
              username: username,
              ip_address: '127.0.0.1',
              device: navigator.userAgent,
              login_time: new Date().toISOString(),
              successful: true
            });
        } catch (logError) {
          console.error('Failed to log admin login:', logError);
        }
        
        toast({
          title: "Success",
          description: "You have successfully logged in as admin",
        });
        
        navigate('/admin');
        setIsLoggingIn(false);
        return;
      } else {
        console.error('Supabase auth error:', error);
      }

      // If we reach here, authentication failed
      toast({
        title: "Authentication Failed",
        description: "Invalid username or password",
        variant: "destructive"
      });
      
      // Log the failed login attempt
      try {
        await supabase
          .from('login_logs')
          .insert({
            username: username,
            ip_address: '127.0.0.1',
            device: navigator.userAgent,
            login_time: new Date().toISOString(),
            successful: false
          });
      } catch (logError) {
        console.error('Failed to log failed login attempt:', logError);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during login",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin Username"
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
                placeholder="Admin Password"
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
          
          <Button
            type="submit"
            className="w-full btn-shine"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
