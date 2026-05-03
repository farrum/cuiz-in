
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Key, User, EyeOff, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminLogin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check if already logged in as admin (real Supabase session)
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (role?.role === 'admin') {
          navigate('/admin');
        }
      }
    })();
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

      if (!data?.success || !data.access_token) {
        console.log('Admin authentication failed:', data?.error);
        toast({
          title: "Authentication Failed",
          description: data?.error || "Invalid username or password",
          variant: "destructive"
        });
        setIsLoggingIn(false);
        return;
      }

      // Establish a real Supabase session so RLS works (auth.uid() is set)
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) {
        toast({
          title: "Login Failed",
          description: "Could not establish admin session.",
          variant: "destructive",
        });
        setIsLoggingIn(false);
        return;
      }

      // Cache for display (useAuthCheck refreshes from DB on next tick)
      localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, data.adminUsername);
      localStorage.setItem(STORAGE_KEYS.USER_ID, data.adminUserId);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, data.adminUsername);
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'admin');
      
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
