
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Key, User, EyeOff, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { setUserContext } from '@/utils/authContext';

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

      console.log('Attempting admin login via secure edge function');

      // Call the secure admin-auth edge function
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { username, password }
      });

      if (error) {
        console.error('Admin auth error:', error);
        toast({
          title: "Authentication Failed",
          description: "Unable to verify credentials",
          variant: "destructive"
        });
        setIsLoggingIn(false);
        return;
      }

      if (!data?.success) {
        console.log('Admin authentication failed:', data?.error);
        toast({
          title: "Authentication Failed",
          description: data?.error || "Invalid username or password",
          variant: "destructive"
        });
        setIsLoggingIn(false);
        return;
      }

      console.log('Admin authentication successful');

      // Set user context for RLS policies
      const adminUserId = data.adminUserId;
      await setUserContext(adminUserId);
      console.log('User context set for admin:', adminUserId);
      
      // Store admin data in localStorage with session timestamp
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      localStorage.setItem('quiz_app_admin_auth_time', Date.now().toString());
      localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, data.adminUsername);
      localStorage.setItem(STORAGE_KEYS.USER_ID, adminUserId);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, data.adminUsername);
      
      toast({
        title: "Success",
        description: "You have successfully logged in as admin",
      });
      
      navigate('/admin');
      setIsLoggingIn(false);
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
