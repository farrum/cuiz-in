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
      // NOTE: The `profiles` table has RLS enabled, so resolving username -> email
      // must happen server-side (Edge Function) before calling Supabase Auth.
      let authUserId: string | null = null;
      let authEmail: string | null = null;

      if (username.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username,
          password,
        });

        if (error) {
          const code = String((error as any)?.code ?? '').toLowerCase();
          const msg = String(error.message ?? '').toLowerCase();

          if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
            toast({
              title: "Email Not Verified",
              description: "Please check your email and click the verification link before logging in.",
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Login Failed",
            description: "Invalid email/username or password",
            variant: "destructive",
          });
          return;
        }

        authUserId = data.user?.id ?? null;
        authEmail = data.user?.email ?? null;
      } else {
        // Username login via edge function (bypasses RLS for username->email lookup)
        const { data, error } = await supabase.functions.invoke('auth-login', {
          body: { identifier: username, password },
        });

        if (error || !data?.access_token || !data?.refresh_token) {
          const code = String((data as any)?.code ?? '').toLowerCase();

          if (code === 'email_not_confirmed') {
            toast({
              title: "Email Not Verified",
              description: "Please check your email and click the verification link before logging in.",
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Login Failed",
            description: "Invalid email/username or password",
            variant: "destructive",
          });
          return;
        }

        // Persist the session in the Supabase client
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (sessionError || !sessionData.session?.user) {
          toast({
            title: "Login Failed",
            description: "Could not start session. Please try again.",
            variant: "destructive",
          });
          return;
        }

        authUserId = sessionData.session.user.id;
        authEmail = sessionData.session.user.email ?? null;
      }

      if (!authUserId) {
        toast({
          title: "Login Failed",
          description: "Invalid email/username or password",
          variant: "destructive",
        });
        return;
      }

      // Fetch profile data (RLS allows the authenticated user to read their row)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, suspended')
        .eq('id', authUserId)
        .maybeSingle();

      if (profileData?.suspended) {
        await supabase.auth.signOut();
        toast({
          title: "Account Suspended",
          description: "Your account has been suspended. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      const displayUsername = profileData?.username || username || authEmail || 'User';

      // Store user data
      localStorage.setItem(STORAGE_KEYS.USER_ID, authUserId);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, displayUsername);

      // Log successful login (table allows public insert)
      await supabase.from('login_logs').insert({
        username: displayUsername,
        ip_address: 'client-side',
        device: navigator.userAgent,
        login_time: new Date().toISOString(),
        successful: true,
      });

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      // Check role for redirection
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUserId)
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
        variant: "destructive",
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
