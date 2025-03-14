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
        
        // First, check if admin user exists by listing users and filtering
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
          console.error('Error listing users:', usersError);
          toast({
            title: "Error",
            description: "Failed to check for admin user",
            variant: "destructive"
          });
          setIsLoggingIn(false);
          return;
        }
        
        const adminUser = usersData?.users?.find(u => u.email === adminEmail);
        
        if (!adminUser) {
          console.log('Admin user does not exist, creating it now');
          // Create the admin user if not exists
          await createAdminUser(password);
        }
        
        // Try logging in with admin credentials
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
        // Ensure admin role is set
        await refreshUserRole();
        await ensureAdminRole();
        
        if (userRole !== 'admin') {
          toast({
            title: "Role Assignment",
            description: "Setting up admin privileges...",
          });
          // Force a refresh to ensure the admin role is applied
          await refreshUserRole();
        }
        
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
        
        // Get user email from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profileData.id);
        
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
        
        email = userData.user.email;
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
  
  // Helper function to create admin user
  const createAdminUser = async (password: string) => {
    try {
      console.log('Creating admin user...');
      
      // Create admin user with specified credentials
      const { data: adminUser, error: signUpError } = await supabase.auth.admin.createUser({
        email: 'quizadmin@quizpoints.com',
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Quiz Admin',
        }
      });
      
      if (signUpError) {
        console.error('Error creating admin user:', signUpError);
        return false;
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
        }
        
        return true;
      }
    } catch (error) {
      console.error('Error in admin user creation:', error);
      return false;
    }
    
    return false;
  };
  
  // Helper function to ensure admin role
  const ensureAdminRole = async () => {
    if (!user) return;
    
    try {
      console.log('Ensuring admin role for user ID:', user.id);
      
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
        
      // If no admin role exists and the user email matches admin email, add it
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
    } catch (error) {
      console.error('Error ensuring admin role:', error);
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
