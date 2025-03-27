import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountReactivation from '@/components/AccountReactivation';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { adminNotificationsApi } from '@/utils/supabaseUtils';

interface SuspendedAccountHandlerProps {
  isAuthenticated: boolean | null;
  isSuspended: boolean;
  userRole: string | null;
  onReactivated: () => void;
  children: React.ReactNode;
}

const SuspendedAccountHandler: React.FC<SuspendedAccountHandlerProps> = ({
  isAuthenticated,
  isSuspended,
  userRole,
  onReactivated,
  children
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reactivationRequested, setReactivationRequested] = useState(false);
  const [reactivationApproved, setReactivationApproved] = useState(false);
  const [requestDate, setRequestDate] = useState<string | null>(null);
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

  useEffect(() => {
    const checkReactivationStatus = async () => {
      if (isAuthenticated && isSuspended && userId) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('reactivation_requested, reactivation_approved, reactivation_requested_at')
          .eq('id', userId)
          .single();

        if (!error && profileData) {
          setReactivationRequested(profileData.reactivation_requested || false);
          setReactivationApproved(profileData.reactivation_approved || false);
          setRequestDate(profileData.reactivation_requested_at);
          
          if (profileData.reactivation_approved) {
            onReactivated();
          }
        }
      }
    };
    
    checkReactivationStatus();
  }, [isAuthenticated, isSuspended, userId, onReactivated]);

  const handleRequestReactivation = async () => {
    if (!userId) return;
    
    try {
      const now = new Date().toISOString();
      
      try {
        await adminNotificationsApi.create({
          type: 'reactivation_request',
          message: `User has requested account reactivation`,
          user_id: userId,
          read: false
        });
      } catch (err) {
        console.error('Error creating admin notification:', err);
        // Continue with the process even if notification fails
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          reactivation_requested: true,
          reactivation_requested_at: now
        })
        .eq('id', userId);

      if (error) {
        console.error('Error requesting reactivation:', error);
        toast({
          title: "Error",
          description: "Failed to submit reactivation request. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setReactivationRequested(true);
      setRequestDate(now);
      
      toast({
        title: "Request Submitted",
        description: "Your account reactivation request has been submitted for review.",
      });
    } catch (err) {
      console.error('Failed to request reactivation:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated && isSuspended) {
      // Allow admins and team leaders to access admin pages even when suspended
      if (location.pathname.startsWith('/admin') && (userRole === 'admin' || userRole === 'team_leader')) {
        return;
      }
      
      // Force redirect from quiz and answer pages to profile page
      const restrictedPages = ['/quiz', '/answer'];
      const isRestricted = restrictedPages.some(page => 
        location.pathname === page || location.pathname.startsWith(page + '/')
      );
      
      if (isRestricted) {
        navigate('/profile', { replace: true });
        
        toast({
          title: "Account Suspended",
          description: "Your account is currently suspended. Please request reactivation from your profile page.",
          variant: "destructive"
        });
      }
    }
  }, [isAuthenticated, isSuspended, location.pathname, navigate, userRole, toast]);

  if (isAuthenticated && isSuspended) {
    if (location.pathname.startsWith('/admin') && (userRole === 'admin' || userRole === 'team_leader')) {
      return <>{children}</>;
    }
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="w-full max-w-md p-4">
          <AccountReactivation 
            reactivationRequested={reactivationRequested}
            reactivationApproved={reactivationApproved}
            requestDate={requestDate}
            onReactivationRequest={handleRequestReactivation}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SuspendedAccountHandler;
