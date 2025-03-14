
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Key, Eye, EyeOff, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';

const UserRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    upiId: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Phone number should be 10 digits';
    }
    
    if (!formData.upiId.trim()) {
      newErrors.upiId = 'UPI ID is required';
    } else if (!/^[\w\.\-]{3,}@[a-zA-Z]{3,}$/i.test(formData.upiId)) {
      newErrors.upiId = 'UPI ID format should be username@bank';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // In a real app, you would send this data to a server
    // For this demo, we'll just store in localStorage
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.USER_NAME, formData.fullName);
      localStorage.setItem('quiz_app_user_email', formData.email);
      localStorage.setItem('quiz_app_user_phone', formData.phone);
      localStorage.setItem('quiz_app_user_upi', formData.upiId);
      
      // Initialize points if first time
      if (!localStorage.getItem(STORAGE_KEYS.USER_POINTS)) {
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, '10');
        
        // Fire event to update the points display
        window.dispatchEvent(new Event('pointsUpdated'));
      }
      
      // Simulate sending welcome email
      console.log(`Welcome email sent to ${formData.email} with login details`);
      
      setIsSubmitting(false);
      
      toast({
        title: "Registration Successful",
        description: "Welcome to QuizPoints! You've been awarded 10 bonus points. Login details sent to your email.",
      });
      
      // Navigate to quiz page after successful registration
      navigate('/quiz');
    }, 1500);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="glass rounded-2xl p-8 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Your Account</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className={`pl-10 ${errors.fullName ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName}</p>}
        </div>
        
        <div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              name="email"
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
        </div>
        
        <div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
        </div>
        
        <div>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              name="upiId"
              placeholder="UPI ID (e.g., yourname@bankname)"
              value={formData.upiId}
              onChange={handleChange}
              className={`pl-10 ${errors.upiId ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.upiId && <p className="text-destructive text-sm mt-1">{errors.upiId}</p>}
        </div>
        
        <div>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={`pl-10 ${errors.password ? 'border-destructive' : ''}`}
            />
            <button 
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
        </div>
        
        <div>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`pl-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>}
        </div>
        
        <Button
          type="submit"
          className="w-full btn-shine"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <p className="text-muted-foreground">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default UserRegistrationForm;
