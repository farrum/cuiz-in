import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MD5 from 'crypto-js/md5';
import { v4 as uuidv4 } from 'uuid';
import { Loader } from 'lucide-react';

const UserRegistrationForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      setReferralCode(refCode);
      checkReferrer(refCode);
    }
  }, [location]);
  
  const checkReferrer = async (referrerUsername: string) => {
    try {
      const { data: referrerData, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', referrerUsername)
        .single();
        
      if (error) {
        console.error("Error checking referrer:", error);
        return;
      }
      
      if (referrerData) {
        setReferrerName(referrerData.username);
        toast({
          title: "Referral Applied",
          description: `You were referred by ${referrerData.username}`,
        });
      }
    } catch (err) {
      console.error("Failed to check referrer:", err);
    }
  };
  
  useEffect(() => {
    if (username && !displayName) {
      setDisplayName(username);
    }
  }, [username, displayName]);
  
  useEffect(() => {
    if (!username) return;
    
    const timer = setTimeout(async () => {
      checkUsernameAvailability(username);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username]);
  
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    
    setIsCheckingUsername(true);
    setUsernameError('');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
        
      if (error) {
        console.error('Error checking username:', error);
      }
      
      if (data) {
        setUsernameError('Username already taken');
      }
    } catch (err) {
      console.error('Failed to check username availability:', err);
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  const hashPassword = (password: string): string => {
    return MD5(password).toString();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usernameError) {
      toast({
        title: "Username Error",
        description: usernameError,
        variant: "destructive"
      });
      return;
    }
    
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
      
      const hashedPassword = hashPassword(password);
      console.log('Password hashed for storage');
      
      const userId = uuidv4();
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username,
          display_name: displayName || username,
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
      
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'player'
        });
        
      if (roleError) {
        console.error('Role error:', roleError);
      }
      
      if (referralCode) {
        try {
          const { data: referrerData, error: referrerError } = await supabase
            .from('profiles')
            .select('id, username, points')
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
                referred_email: email || undefined,
                date: currentDate,
                active_this_month: true,
                last_active_date: currentDate,
                status: 'active'
              });
              
            console.log('Referral recorded successfully');
            
            if (referrerData && typeof referrerData.points === 'number') {
              await supabase
                .from('profiles')
                .update({ points: referrerData.points + 20 })
                .eq('id', referrerData.id);
                
              console.log('Added 20 points to referrer');
            } else {
              console.error('Could not add points to referrer: missing points data');
            }
          }
        } catch (referralErr) {
          console.error('Referral processing error:', referralErr);
        }
      }
      
      localStorage.setItem('quiz_app_user_auth', 'true');
      localStorage.setItem('quiz_app_user_id', userId);
      localStorage.setItem('quiz_app_user_name', displayName || username);
      
      toast({
        title: "Registration successful!",
        description: "Your account has been created. You will be redirected to login.",
      });
      
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
        {referrerName && (
          <div className="mt-2 p-2 bg-primary/10 rounded-md text-sm">
            You were referred by <strong>{referrerName}</strong>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username (Cannot be changed later)</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a username"
                className={usernameError ? "border-red-500" : ""}
                required
              />
              {isCheckingUsername && (
                <div className="absolute right-2 top-2">
                  <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {usernameError && (
              <p className="text-sm text-red-500">{usernameError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This is your unique identifier and cannot be changed later.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              required
            />
            <p className="text-xs text-muted-foreground">
              This is the name shown to others. You can change it later.
            </p>
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
          
          <Button type="submit" className="w-full" disabled={isLoading || !!usernameError}>
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
