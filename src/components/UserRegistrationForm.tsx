
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

import { Loader, Check, X } from 'lucide-react';

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
  const [usernameAvailable, setUsernameAvailable] = useState(false);
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

  const getSafeNextPath = () => {
    const params = new URLSearchParams(location.search);
    const nextPath = params.get('next');
    return nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/quiz';
  };

  const getFunctionErrorMessage = async (error: any, data: any) => {
    if (data?.error) return String(data.error);

    try {
      const context = error?.context;
      if (context?.json) {
        const body = await context.json();
        if (body?.error) return String(body.error);
      }
    } catch {
      // Ignore parsing errors and fall through to the generic message.
    }

    return error?.message || "Registration failed. Please try again.";
  };
  
  useEffect(() => {
    if (username && !displayName) {
      setDisplayName(username);
    }
  }, [username, displayName]);
  
  useEffect(() => {
    if (!username) {
      setUsernameError('');
      setUsernameAvailable(false);
      return;
    }
    setUsernameAvailable(false);
    const timer = setTimeout(async () => {
      checkUsernameAvailability(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);
  
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameAvailable(false);
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Only letters, numbers, and underscores allowed');
      setUsernameAvailable(false);
      return;
    }
    setIsCheckingUsername(true);
    setUsernameError('');
    setUsernameAvailable(false);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .maybeSingle();
      if (data) {
        setUsernameError('Username already taken');
        setUsernameAvailable(false);
      } else {
        setUsernameAvailable(true);
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
      console.log('[Registration] Starting sign up process for:', email);
      
      // 1a. Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: "Username Taken",
          description: "This username is already in use. Please choose another.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // 1b. Check if email is already registered (prevents silent duplicate-signup success)
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('username')
        .ilike('email', email.trim())
        .maybeSingle();

      if (existingEmail) {
        toast({
          title: "Email Already Registered",
          description: `An account with this email already exists (username: ${existingEmail.username}). Please log in or reset your password.`,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // 2. Register through the server flow so account creation does not depend on email delivery.
      const { data, error } = await supabase.functions.invoke('register-user', {
        body: {
          username: username.trim(),
          displayName: displayName.trim() || username.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        },
      });

      if (error || !data?.success) {
        console.error('[Registration] Register function error:', error || data);
        const errorMessage = await getFunctionErrorMessage(error, data);

        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (!data.user?.id) {
        toast({
          title: "Registration Failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (!data.access_token || !data.refresh_token) {
        toast({
          title: "Registration Failed",
          description: "Account was created, but we could not start your session. Please log in.",
          variant: "destructive"
        });
        navigate('/login');
        setIsLoading(false);
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        console.error('[Registration] Session set failed:', sessionError);
        toast({
          title: "Registration Failed",
          description: "Account was created, but we could not start your session. Please log in.",
          variant: "destructive"
        });
        navigate('/login');
        setIsLoading(false);
        return;
      }

      console.log('[Registration] User created successfully:', data.user.id);
      const createdUserId = data.user.id;

      // 3. Handle referral if present
      if (referralCode) {
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
        }, 500);
      }

      toast({
        title: "Welcome to CuizIN!",
        description: "Account created successfully.",
      });
      navigate(getSafeNextPath());
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred during registration.",
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
        <div className="space-y-3 mb-4">
          <GoogleAuthButton label="Sign up with Google" nextPath="/quiz" />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
            </div>
          </div>
        </div>
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
                className={
                  usernameError
                    ? "border-red-500 pr-9"
                    : usernameAvailable
                    ? "border-green-500 pr-9"
                    : "pr-9"
                }
                required
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {isCheckingUsername ? (
                  <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : usernameAvailable ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : usernameError && username.length > 0 ? (
                  <X className="h-5 w-5 text-red-500" />
                ) : null}
              </div>
            </div>
            {usernameError && (
              <p className="text-sm text-red-500">{usernameError}</p>
            )}
            {!usernameError && usernameAvailable && (
              <p className="text-sm text-green-600">Username is available</p>
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
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
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
