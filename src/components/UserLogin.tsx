
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Key, User, EyeOff, Eye } from 'lucide-react';

// Check if username is admin
const isAdmin = (username: string): boolean => {
  return username === 'quizadmin';
};

const UserLogin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    // Simple validation
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      setIsLoggingIn(false);
      return;
    }

    // Check if admin credentials
    if (isAdmin(username)) {
      toast({
        title: "Admin Login",
        description: "Please use the admin login page",
        variant: "destructive"
      });
      navigate('/admin-login');
      setIsLoggingIn(false);
      return;
    }

    // For regular users, just store their username
    localStorage.setItem(STORAGE_KEYS.USER_NAME, username);
    
    // Initialize points if first time
    if (!localStorage.getItem(STORAGE_KEYS.USER_POINTS)) {
      localStorage.setItem(STORAGE_KEYS.USER_POINTS, '0');
    }
    
    toast({
      title: "Success",
      description: "You have successfully logged in",
    });
    
    navigate('/');
    setIsLoggingIn(false);
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
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
    </div>
  );
};

export default UserLogin;
