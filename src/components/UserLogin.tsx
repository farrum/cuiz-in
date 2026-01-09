import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { setUserContext } from '@/utils/authContext';
import CryptoJS from 'crypto-js';

const UserLogin: React.FC = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const hashPassword = React.useMemo(
    () => (password: string): string => CryptoJS.MD5(password).toString(),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // PHASE 1: Try Supabase Auth first
      let supabaseAuthAttempt = null;
      let loginEmail = username;
      
      // If input looks like email, try email login directly
      if (username.includes('@')) {
        supabaseAuthAttempt = await supabase.auth.signInWithPassword({
          email: username,
          password: password
        });
      } else {
        // First, check if this username has an associated email in profiles
        const { data: profileWithEmail } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', username)
          .maybeSingle();
          
        if (profileWithEmail?.email) {
          loginEmail = profileWithEmail.email;
          supabaseAuthAttempt = await supabase.auth.signInWithPassword({
            email: profileWithEmail.email,
            password: password
          });
        } else {
          // Try with temp email format for migrated users
          supabaseAuthAttempt = await supabase.auth.signInWithPassword({
            email: `${username}@temp.local`,
            password: password
          });
        }
      }
      
      // Check for specific Supabase Auth errors
      if (supabaseAuthAttempt?.error) {
        const errorMessage = supabaseAuthAttempt.error.message?.toLowerCase() || '';
        
        // Handle email not confirmed case
        if (errorMessage.includes('email not confirmed') || 
            errorMessage.includes('email_not_confirmed')) {
          toast({
            title: "Email Not Verified",
            description: "Please check your email and click the verification link before logging in.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      // If Supabase auth succeeded
      if (supabaseAuthAttempt?.data?.user) {
        const user = supabaseAuthAttempt.data.user;
        
        // Fetch profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, suspended')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData?.suspended) {
          await supabase.auth.signOut();
          toast({
            title: "Account Suspended",
            description: "Your account has been suspended. Please contact support.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Store user data
        localStorage.setItem(STORAGE_KEYS.USER_ID, user.id);
        localStorage.setItem(STORAGE_KEYS.USER_NAME, profileData?.username || username);
        
        // Log successful login
        await supabase
          .from('login_logs')
          .insert({
            username: profileData?.username || username,
            ip_address: 'client-side',
            device: navigator.userAgent,
            login_time: new Date().toISOString(),
            successful: true
          });

        toast({
          title: "Login Successful",
          description: `Welcome back!`
        });

        // Check role for redirection
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleData?.role === 'admin') {
          localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
          navigate('/admin');
        } else {
          navigate('/quiz');
        }
        
        setIsLoading(false);
        return;
      }

      // PHASE 2: Fall back to legacy auth if Supabase auth failed
      const hashedPassword = hashPassword(password);

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, username, suspended, email')
        .eq('username', username)
        .eq('password_hash', hashedPassword)
        .maybeSingle();

      if (userError || !userData) {
        // Log failed login attempt
        await supabase
          .from('login_logs')
          .insert({
            username,
            ip_address: 'client-side',
            device: navigator.userAgent,
            login_time: new Date().toISOString(),
            successful: false
          });

        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (userData.suspended) {
        toast({
          title: "Account Suspended",
          description: "Your account has been suspended. Please contact support.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Store user data in localStorage
      localStorage.setItem(STORAGE_KEYS.USER_ID, userData.id);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, username);
      
      // Set user context for legacy auth RLS
      await setUserContext(userData.id);
      
      // Log successful login
      await supabase
        .from('login_logs')
        .insert({
          username,
          ip_address: 'client-side',
          device: navigator.userAgent,
          login_time: new Date().toISOString(),
          successful: true
        });

      toast({
        title: "Login Successful",
        description: `Welcome back, ${username}!`
      });

      // Check role for redirection
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (roleData?.role === 'admin') {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        navigate('/admin');
      } else {
        navigate('/quiz');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Log In</CardTitle>
        <CardDescription>
          Log in to your account to start earning points
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username or Email</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username or email"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <p className="text-sm text-muted-foreground text-center">
          Don't have an account?{" "}
          <a href="/register" className="text-primary hover:underline">
            Create Account
          </a>
        </p>
        <div className="text-center w-full">
          <a href="/admin-login" className="text-xs text-muted-foreground hover:underline">
            Admin Login
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};

export default UserLogin;
