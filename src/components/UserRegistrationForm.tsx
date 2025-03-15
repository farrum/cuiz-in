
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MD5 from 'crypto-js/md5';
import { v4 as uuidv4 } from 'uuid';

const UserRegistrationForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Function to hash password with MD5
  const hashPassword = (password: string): string => {
    return MD5(password).toString();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords match.",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Registering with username:', username);
      
      // Check if username already exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
        
      if (userCheckError) {
        console.error('User check error:', userCheckError);
      }
      
      if (existingUser) {
        toast({
          title: "Username already taken",
          description: "Please choose a different username.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Hash the password
      const hashedPassword = hashPassword(password);
      console.log('Password hashed for storage');
      
      // Generate a UUID for the user
      const userId = uuidv4();
      
      // Create profile directly in profiles table with hashed password
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username,
          phone: phone,
          points: 0,
          suspended: false,
          password_hash: hashedPassword
        });
      
      if (profileError) {
        console.error('Profile error:', profileError);
        toast({
          title: "Profile creation failed",
          description: profileError.message || "Failed to create user profile",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Set user role as player by default
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'player'
        });
        
      if (roleError) {
        console.error('Role error:', roleError);
        // Continue anyway as this is not critical
      }
      
      // Handle referral code if provided
      if (referralCode) {
        try {
          const { data: referrerData, error: referrerError } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('username', referralCode)
            .maybeSingle();
            
          if (!referrerError && referrerData) {
            const currentDate = new Date().toISOString().split('T')[0];
            
            await supabase
              .from('user_referrals')
              .insert({
                referrer_id: referrerData.id,
                referrer_name: referrerData.username,
                referred_id: userId,
                referred_name: username,
                date: currentDate,
                active_this_month: true,
                last_active_date: currentDate
              });
          }
        } catch (referralErr) {
          console.error('Referral processing error:', referralErr);
          // Don't stop registration for referral errors
        }
      }
      
      toast({
        title: "Registration successful!",
        description: "Your account has been created. You can now log in.",
      });
      
      // Redirect to login page after successful registration
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.log('Error details:', errorMessage);
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>
          Start earning points by answering quiz questions
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
              placeholder="Enter a username"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
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
              placeholder="Create a password"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
            <Input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter referral code if you have one"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Log In
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};

export default UserRegistrationForm;
