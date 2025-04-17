
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import AdminLogin from '@/components/admin/AdminLogin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { STORAGE_KEYS } from '@/utils/quizData';

const AdminLoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    checkAdminStatus();
  }, []);
  
  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      
      // First check localStorage for admin auth - bare minimum
      const isAdminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
      if (isAdminAuth) {
        console.log('Admin authenticated via localStorage');
        setIsAdmin(true);
        toast({
          title: 'Welcome back, Admin!',
          description: 'You are already logged in as an administrator.',
        });
        
        // Redirect to admin page
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
        return;
      }
      
      // Get current user from Supabase as backup verification
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found in Supabase auth');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      console.log('Checking admin status for user:', user.id);
      
      // Check if user is admin in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else if (data?.is_admin) {
        console.log('User is confirmed as admin in database');
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        setIsAdmin(true);
        
        toast({
          title: 'Welcome back, Admin!',
          description: 'You are already logged in as an administrator.',
        });
        
        // Redirect to admin page
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
        return;
      } else {
        console.log('User is not an admin in database');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
        <div className="animated-bg top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/20" />
        <div className="animated-bg bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/20" />
        
        <div className="max-w-3xl w-full mx-auto text-center z-10">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </Link>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Checking admin status...</p>
              </div>
            ) : isAdmin ? (
              <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
                <p className="text-xl font-medium">You are already logged in as admin</p>
                <p className="mt-2 text-muted-foreground">Redirecting to admin dashboard...</p>
              </div>
            ) : (
              <AdminLogin />
            )}
          </div>
        </div>
      </div>
      
      <footer className="py-6 border-t border-border mt-auto">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cuiz<span className="text-green-500">IN</span>. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
};

export default AdminLoginPage;
