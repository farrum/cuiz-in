
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { setUserContext } from '@/utils/authContext';
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
      // Check if referrer exists in the system
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
  
  // Function to get referrer info for display
  const getReferrerInfo = async (referrerUsername: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', referrerUsername)
        .maybeSingle();
        
      if (error || !data) {
        console.error("Error checking referrer:", error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error("Failed to check referrer:", err);
      return null;
    }
  };

  // Function to get referrer ID for insertion
  const getReferrerId = async (referrerUsername: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', referrerUsername)
        .maybeSingle();
      
      if (error || !data) {
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Error checking referrer:', error);
      return null;
    }
  };
  
  // Auto-fill display name based on username
  useEffect(() => {
    if (username && !displayName) {
      setDisplayName(username);
    }
  }, [username, displayName]);
  
  // Check username availability with debounce
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        toast({
          title: "Error",
          description: "Username already exists. Please choose a different one.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Use Supabase Auth for registration
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username,
            display_name: displayName,
            phone: phone
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        console.error('Registration error:', authError);
        toast({
          title: "Registration Failed",
          description: authError.message || "Failed to create account. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast({
          title: "Registration Failed",
          description: "Failed to create account. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Profile will be auto-created via trigger
      // Handle referral if present
      if (referralCode) {
        const referrerUsername = referralCode.toLowerCase();
        const referrerId = await getReferrerId(referrerUsername);
        
        if (referrerId) {
          await supabase
            .from('user_referrals')
            .insert({
              referrer_id: referrerId,
              referrer_name: referrerUsername,
              referred_id: authData.user.id,
              referred_name: username,
              referred_email: email,
              date: new Date().toISOString().split('T')[0],
              status: 'active'
            });
        }
      }

      toast({
        title: "Registration Successful!",
        description: "Your account has been created. Please check your email to verify your account.",
      });

      // Store user data
      localStorage.setItem(STORAGE_KEYS.USER_ID, authData.user.id);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, username);
      
      // Set user context for RLS
      await setUserContext(authData.user.id);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
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
