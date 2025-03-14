
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
      console.log('Attempting admin login with username:', username);
      
      // For the admin user, directly use the hardcoded email
      if (username.toLowerCase() === 'quizadmin') {
        const adminEmail = 'quizadmin@quizpoints.com';
        console.log('Using hardcoded admin email:', adminEmail);
        
        const { error, data } = await signIn(adminEmail, password);
        
        if (error) {
          console.error('Admin login error:', error);
          throw error;
        }
        
        console.log('Admin login successful, refreshing role');
        // Refresh the user role after login
        await refreshUserRole();
        
        if (userRole !== 'admin') {
          console.log('Role check failed after login, current role:', userRole);
          await checkAndSetAdminRole();
        }
        
        toast({
          title: "Success",
          description: "You have successfully logged in as admin",
        });
        
        navigate('/admin');
        setIsLoggingIn(false);
        return;
      }
      
      // For non-admin users, continue with the regular flow
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
        
        // For other users, get their email from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', profileData.id)
          .single();
          
        if (userError || !userData) {
          console.error('User email lookup failed:', userError);
          toast({
            title: "Authentication Failed",
            description: "User email not found",
            variant: "destructive"
          });
          setIsLoggingIn(false);
          return;
        }
        
        email = userData.email;
      }
      
      console.log('Signing in with email:', email);
      const { error } = await signIn(email, password);
      
      if (error) {
        throw error;
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
      
      toast({
        title: "Success",
        description: "You have successfully logged in as admin",
      });
      
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
  
  // Helper function to check and set admin role if needed
  const checkAndSetAdminRole = async () => {
    if (!user) return;
    
    console.log('Checking and setting admin role for user ID:', user.id);
    
    // Check if user already has admin role
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking admin role:', checkError);
    }
      
    // If no admin role exists and the user is quizadmin, add it
    if (!existingRole && user.email === 'quizadmin@quizpoints.com') {
      console.log('Setting admin role for quizadmin');
      
      // Delete any existing roles first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
        
      // Set admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin'
        });
        
      if (roleError) {
        console.error('Error setting admin role:', roleError);
      } else {
        console.log('Admin role set successfully');
        await refreshUserRole();
      }
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
