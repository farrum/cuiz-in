
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Key, User, EyeOff, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const AdminLogin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, isAdmin, user, userRole, refreshUserRole } = useAuth();
  const [username, setUsername] = useState('quizadmin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && userRole === 'admin') {
      navigate('/admin');
    }
  }, [user, userRole, navigate]);

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

    try {
      // Special handling for admin user
      if (username.toLowerCase() === 'quizadmin') {
        // Always use the fixed email for the admin account
        const adminEmail = 'quizadmin@quizpoints.com';
        console.log('Admin login attempt with email:', adminEmail);
        
        // Direct login attempt for admin user
        const { error, data } = await signIn(adminEmail, password);
        
        if (error) {
          console.error('Admin login error:', error);
          toast({
            title: "Authentication Failed",
            description: "Invalid admin credentials",
            variant: "destructive"
          });
          setIsLoggingIn(false);
          return;
        }
        
        console.log('Admin login successful, refreshing role');
        // Refresh role to ensure admin privileges
        await refreshUserRole();
        
        navigate('/admin');
        setIsLoggingIn(false);
        return;
      }
      
      // For non-admin users
      let email = username;
      
      if (!username.includes('@')) {
        console.log('Looking up email for username:', username);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();
          
        if (profileError) {
          console.error('Profile lookup error:', profileError);
          toast({
            title: "Authentication Failed",
            description: "Invalid username or password",
            variant: "destructive"
          });
          setIsLoggingIn(false);
          return;
        }
        
        // Try to sign in directly with the username/password
        const { error } = await signIn(email, password);
        
        if (error) {
          throw error;
        }
      } else {
        // Email-based login
        console.log('Signing in with email:', email);
        const { error } = await signIn(email, password);
        
        if (error) {
          throw error;
        }
      }
      
      // Refresh the user role after login
      await refreshUserRole();
      
      if (userRole !== 'admin') {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive"
        });
        navigate('/login');
        setIsLoggingIn(false);
        return;
      }
      
      navigate('/admin');
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid username or password",
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
