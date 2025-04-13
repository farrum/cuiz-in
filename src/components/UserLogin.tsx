
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import MD5 from 'crypto-js/md5';

const UserLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Memoize hashPassword function to prevent recreating on every render
  const hashPassword = useCallback((password: string): string => {
    return MD5(password).toString();
  }, []);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log(`Attempting to sign in with username: ${username}`);
      
      const hashedPassword = hashPassword(password);
      console.log('Password hashed for authentication');
      
      // Combine the two queries into one transaction with a more efficient approach
      // First find the user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, username, suspended, points')
        .eq('username', username)
        .eq('password_hash', hashedPassword)
        .maybeSingle();
      
      if (userError) {
        console.error('Login error:', userError);
        throw new Error('Authentication failed');
      }
      
      if (!userData) {
        console.error('Invalid credentials');
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
      localStorage.setItem(STORAGE_KEYS.USER_POINTS, userData.points ? userData.points.toString() : '0');
      
      const loginTime = new Date().toISOString();
      
      // Log login info in Supabase - do this in a background pattern
      // We don't need to await this since it's not critical for the user flow
      const loginPromise = supabase.from('login_logs').insert({
        username: userData.username,
        ip_address: "client-side",
        device: navigator.userAgent,
        login_time: loginTime,
        successful: true
      });
      
      // Check login history in parallel rather than sequentially
      const { data: loginHistory } = await supabase
        .from('login_logs')
        .select('id')
        .eq('username', userData.username)
        .limit(2);
        
      const isFirstLogin = !loginHistory || loginHistory.length <= 1;
      
      // Ensure the login entry was recorded
      await loginPromise;
      
      toast({
        title: "Login successful!",
        description: `Welcome ${isFirstLogin ? 'to Cuizin' : 'back'}, ${userData.username}!`,
      });
      
      window.dispatchEvent(new Event('pointsUpdated'));
      
      navigate(isFirstLogin ? '/profile' : '/quiz');
    } catch (error) {
      console.error('Login error:', error);
      
      // Log failed login - don't await this since it's not critical
      supabase.from('login_logs').insert({
        username: username,
        successful: false,
        login_time: new Date().toISOString()
      });
      
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [username, password, hashPassword, toast, navigate]);
  
  // Use useCallback for input handlers
  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  }, []);
  
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);
  
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
              onChange={handleUsernameChange}
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
              onChange={handlePasswordChange}
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
