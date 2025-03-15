
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log(`Attempting to sign in with email: ${email}`);
      
      // Sign in with Supabase auth using email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (authError) {
        console.error('Login error:', authError);
        throw authError;
      }
      
      if (authData.user) {
        console.log('User authenticated successfully:', authData.user.id);
        
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (profileError) {
          console.error('Profile error:', profileError);
          throw profileError;
        }
        
        console.log('Profile data retrieved:', profileData);
        
        // Store user information in localStorage
        localStorage.setItem(STORAGE_KEYS.USER_ID, authData.user.id);
        localStorage.setItem(STORAGE_KEYS.USER_NAME, profileData.username);
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, profileData.points.toString());
        
        // Record login in login_logs table
        const clientInfo = {
          device: navigator.userAgent
        };
        
        await supabase.from('login_logs').insert({
          username: profileData.username,
          ip_address: "client-side", // We can't get IP on client side
          device: JSON.stringify(clientInfo),
          successful: true
        });
        
        toast({
          title: "Login successful!",
          description: `Welcome back, ${profileData.username}!`,
        });
        
        navigate('/quiz');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Record failed login attempt
      await supabase.from('login_logs').insert({
        username: email,
        successful: false
      });
      
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
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
