import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user arrived via password reset link (they will have a session)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    // Listen for PASSWORD_RECOVERY event
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim() || !confirmPassword.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both password fields',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update password',
          variant: 'destructive',
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: 'Password Updated',
        description: 'Your password has been reset successfully.',
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Still checking session
  if (hasSession === null) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  // No session means the user didn't arrive via a valid reset link
  if (!hasSession) {
    return (
      <>
        <Helmet>
          <title>Reset Password | CuizIN</title>
        </Helmet>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
          <div className="container max-w-md mx-auto text-center">
            <Card>
              <CardHeader>
                <CardTitle>Invalid or Expired Link</CardTitle>
                <CardDescription>
                  This password reset link is invalid or has expired.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/forgot-password">
                  <Button className="w-full">Request a New Link</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reset Password | CuizIN</title>
        <meta name="description" content="Set a new password for your CuizIN account" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
        <div className="container max-w-md mx-auto">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                {isSuccess ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <Lock className="w-6 h-6 text-primary" />
                )}
              </div>
              <CardTitle>{isSuccess ? 'Password Reset!' : 'Reset Your Password'}</CardTitle>
              <CardDescription>
                {isSuccess
                  ? 'You can now log in with your new password'
                  : 'Enter a new password for your account'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isSuccess ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Redirecting you to the login page...
                  </p>
                  <Link to="/login">
                    <Button className="w-full">Go to Login</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              )}
            </CardContent>

            {!isSuccess && (
              <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    Log in
                  </Link>
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ResetPasswordPage;
