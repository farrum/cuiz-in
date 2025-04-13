
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';

const UserLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log(`Attempting to sign in with username: ${username}`);
      
      // First, find the user by username to get their auth account
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, username, suspended')
        .eq('username', username)
        .maybeSingle();
      
      if (userError || !userData) {
        console.error('Login error:', userError || 'User not found');
        throw new Error('Invalid username or password');
      }
      
      // Now use Supabase Auth to sign in
      // We need to provide the email from the profiles table to auth.signInWithPassword
      const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
        email: `${username}@example.com`, // Use the placeholder email format
        password: password,
      });
      
      if (loginError) {
        console.error('Login error:', loginError);
        throw new Error('Invalid username or password');
      }
      
      console.log('User authenticated successfully:', userData.id);

      if (userData.suspended) {
        console.warn('User account is suspended:', userData.id);
        toast({
          title: "Account Suspended",
          description: "Your account has been suspended due to inactivity. You'll need to reactivate it.",
          variant: "destructive"
        });
      }
      
      // Store essential user data only
      localStorage.setItem(STORAGE_KEYS.USER_ID, userData.id);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, userData.username);
      localStorage.setItem(STORAGE_KEYS.USER_POINTS, '0'); // Default to 0 until we fetch points
      
      const loginTime = new Date().toISOString();
      
      // Log login info in Supabase
      await supabase.from('login_logs').insert({
        username: userData.username,
        ip_address: "client-side",
        device: navigator.userAgent,
        login_time: loginTime,
        successful: true
      });
      
      // Track attendance directly - this will trigger the DB function to update user_attendance
      console.log('Recording user attendance in database');
      
      const { data: loginHistory } = await supabase
        .from('login_logs')
        .select('id')
        .eq('username', userData.username)
        .limit(2);
        
      const isFirstLogin = !loginHistory || loginHistory.length <= 1;
      
      toast({
        title: "Login successful!",
        description: `Welcome ${isFirstLogin ? 'to Cuizin' : 'back'}, ${userData.username}!`,
      });
      
      window.dispatchEvent(new Event('pointsUpdated'));
      
      navigate(isFirstLogin ? '/profile' : '/quiz');
    } catch (error) {
      console.error('Login error:', error);
      
      try {
        // Log failed login
        await supabase.from('login_logs').insert({
          username: username,
          successful: false,
          login_time: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Failed to log failed login attempt:', logError);
      }
      
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
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
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
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
