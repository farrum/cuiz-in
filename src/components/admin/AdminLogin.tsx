
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Key, User, EyeOff, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Admin credentials - same as in AdminPage.tsx
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
      return;
    }

    // Check credentials against hardcoded values first for simplicity
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      console.log("Local admin authentication successful");
      
      // Store admin auth in localStorage
      localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, username);
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      
      toast({
        title: "Success",
        description: "You have successfully logged in as admin",
      });
      
      navigate('/admin');
      setIsLoggingIn(false);
      return;
    }
    
    // Try Supabase authentication as fallback
    try {
      console.log("Attempting Supabase authentication");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'quizadmin@example.com', // Using the email we set in our SQL migration
        password: password
      });
      
      if (!error && data.user) {
        console.log("Supabase authentication successful");
        
        // Store admin auth in localStorage
        localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, username);
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        
        // Log the successful login
        try {
          await supabase
            .from('login_logs')
            .insert({
              username: username,
              ip_address: '127.0.0.1', // In a real app, this would be the actual IP
              device: navigator.userAgent,
              login_time: new Date().toISOString()
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
    } catch (err) {
      console.error('Supabase auth error:', err);
    }
    
    // If we reach here, authentication failed
    toast({
      title: "Authentication Failed",
      description: "Invalid username or password",
      variant: "destructive"
    });
    
    setIsLoggingIn(false);
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
