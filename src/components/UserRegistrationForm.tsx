
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  
  // Extract referral code from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      setReferralCode(refCode);
      (async () => {
        const referrerData = await getReferrerInfo(refCode);
        if (referrerData) {
          setReferrerName(referrerData.username);
          toast({
            title: "Referral Applied",
            description: `You were referred by ${referrerData.username}`,
          });
        }
      })();
    }
  }, [location]);
  
  const getReferrerInfo = async (referrerUsername: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', referrerUsername)
        .maybeSingle();
      if (error || !data) return null;
      return data;
    } catch (err) {
      return null;
    }
  };

  const getReferrerId = async (referrerUsername: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', referrerUsername)
        .maybeSingle();
      if (error || !data) return null;
      return data.id;
    } catch {
      return null;
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
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      if (data) {
        setUsernameError('Username already taken');
      }
    } catch {
      // ignore
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters long", variant: "destructive" });
      return;
    }
    if (!email.includes('@')) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      // Call register-user edge function
      const { data: registerData, error: registerError } = await supabase.functions.invoke('register-user', {
        body: { username, displayName, email, phone, password },
      });

      if (registerError) {
        console.error('Registration edge function error:', registerError);
        toast({
          title: "Registration Failed",
          description: registerError.message || "Failed to contact registration server.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (registerData?.error) {
        toast({
          title: "Registration Failed",
          description: typeof registerData.error === 'object' 
            ? JSON.stringify(registerData.error) 
            : registerData.error,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (!registerData?.success || !registerData?.user?.id) {
        toast({
          title: "Registration Failed",
          description: "The server did not return a valid user ID.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const createdUserId = registerData.user.id;

      // Auto-login if tokens were returned
      if (registerData.access_token && registerData.refresh_token) {
        console.log('[Registration] Setting session with returned tokens');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: registerData.access_token,
          refresh_token: registerData.refresh_token,
        });

        if (sessionError) {
          console.error('[Registration] Session set failed:', sessionError);
          toast({
            title: "Account Created!",
            description: "Please log in with your credentials.",
          });
          navigate('/login');
          return;
        }

        // Session is set — onAuthStateChange in App.tsx will hydrate user data.
        // Handle referral if present
        if (referralCode) {
          // Defer referral insert so it doesn't block navigation
          setTimeout(async () => {
            try {
              const referrerUsername = referralCode.toLowerCase();
              const referrerId = await getReferrerId(referrerUsername);
              if (referrerId) {
                await supabase.from('user_referrals').insert({
                  referrer_id: referrerId,
                  referrer_name: referrerUsername,
                  referred_id: createdUserId,
                  referred_name: username,
                  referred_email: email,
                  date: new Date().toISOString().split('T')[0],
                  status: 'active'
                });
              }
            } catch (err) {
              console.error('Referral insert error:', err);
            }
          }, 100);
        }

        toast({
          title: "Welcome to CuizIn!",
          description: "Your account is ready. Let's start playing!",
        });

        navigate('/quiz');
      } else {
        // No tokens returned - redirect to login
        toast({
          title: "Account Created!",
          description: "Please log in with your credentials.",
        });
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "An error occurred during registration. Please try again.",
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
          Start playing quizzes and climb the leaderboard
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
            <Label htmlFor="email">Email (Required)</Label>
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
