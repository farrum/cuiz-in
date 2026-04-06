import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';

const UserLogin: React.FC = () => {
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim() || !password.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      // Call auth-login edge function for both username and email
      console.log('[Login] Calling auth-login edge function');
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: { identifier: identifier.trim(), password },
      });

      if (error || !data?.success) {
        const errorMsg = data?.error || 'Invalid email/username or password';
        const code = String(data?.code ?? '').toLowerCase();

        if (code === 'email_not_confirmed') {
          toast({
            title: "Email Not Verified",
            description: "Please check your email and click the verification link before logging in.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (errorMsg === 'Account suspended') {
          toast({
            title: "Account Suspended",
            description: "Your account has been suspended. Please contact support.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Login Failed",
          description: errorMsg,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Set session with returned tokens
      console.log('[Login] Setting session with tokens');
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        console.error('[Login] Session set failed:', sessionError);
        toast({
          title: "Login Failed",
          description: "Could not establish session. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Session is now set — onAuthStateChange in App.tsx will hydrate user data.
      // We just need to determine where to navigate.
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      // Quick role check for navigation (the full hydration happens via the auth listener)
      const userRole = data.role || 'player';
      if (userRole === 'admin') {
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
            <Label htmlFor="identifier">Username or Email</Label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your username or email"
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </a>
            </div>
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
