
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Key, User, EyeOff, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PasswordResetDialog from './PasswordResetDialog';

const LoginForm: React.FC = () => {
  const { toast } = useToast();
  const { signIn, refreshUserRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    // Simple validation
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      setIsLoggingIn(false);
      return;
    }

    try {
      // Special case for quizadmin
      if (email.toLowerCase() === 'quizadmin') {
        const adminEmail = 'clouddriveback@gmail.com';
        console.log('Logging in admin from user login with email:', adminEmail);
        
        const { error } = await signIn(adminEmail, password);
        
        if (error) {
          throw error;
        }
        
        await refreshUserRole();
        return;
      }
      
      // Standard email login
      console.log('Logging in with email:', email);
      const { error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      await refreshUserRole();
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">User Login</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or quizadmin"
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="pl-10"
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setResetDialogOpen(true)}
            >
              Forgot Password?
            </button>
          </div>
          
          <Button
            type="submit"
            className="w-full btn-shine"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Logging in...' : 'Log In'}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Admin?{' '}
              <Link to="/admin-login" className="text-primary hover:underline">
                Admin Login
              </Link>
            </p>
          </div>
        </form>
      </div>

      <PasswordResetDialog 
        open={resetDialogOpen} 
        onOpenChange={setResetDialogOpen} 
      />
    </div>
  );
};

export default LoginForm;
