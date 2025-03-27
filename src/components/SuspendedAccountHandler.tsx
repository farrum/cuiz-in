
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountReactivation from '@/components/AccountReactivation';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';

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

  // Check if reactivation has been requested and/or approved
  useEffect(() => {
    const checkReactivationStatus = async () => {
      if (isAuthenticated && isSuspended && userId) {
        // Check if user has a pending reactivation request
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('reactivation_requested, reactivation_approved, reactivation_requested_at')
          .eq('id', userId)
          .single();

        if (!error && profileData) {
          setReactivationRequested(profileData.reactivation_requested || false);
          setReactivationApproved(profileData.reactivation_approved || false);
          setRequestDate(profileData.reactivation_requested_at);
          
          // If reactivation is approved, call onReactivated to update parent state
          if (profileData.reactivation_approved) {
            onReactivated();
          }
        }
      }
    };
    
    checkReactivationStatus();
  }, [isAuthenticated, isSuspended, userId, onReactivated]);

  // Handle requesting reactivation
  const handleRequestReactivation = async () => {
    if (!userId) return;
    
    try {
      const now = new Date().toISOString();
      
      // First create a notification for admins
      await supabase
        .from('admin_notifications')
        .insert({
          type: 'reactivation_request',
          message: `User has requested account reactivation`,
          user_id: userId,
          read: false
        });
      
      // Then update the user's profile
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

  // Redirect suspended users away from game-related pages
  useEffect(() => {
    if (isAuthenticated && isSuspended) {
      // For admin routes, don't block access even if suspended
      if (location.pathname.startsWith('/admin') && (userRole === 'admin' || userRole === 'team_leader')) {
        return;
      }
      
      // For game-related pages, redirect to profile page
      if (location.pathname === '/quiz' || location.pathname.startsWith('/answer')) {
        navigate('/profile', { replace: true });
        
        // Show toast to explain the redirect
        toast({
          title: "Account Suspended",
          description: "Your account is currently suspended. Please request reactivation from your profile page.",
          variant: "destructive"
        });
      }
    }
  }, [isAuthenticated, isSuspended, location.pathname, navigate, userRole, toast]);

  // Handle suspended account overlay
  if (isAuthenticated && isSuspended) {
    // For admin routes, don't block access even if suspended
    if (location.pathname.startsWith('/admin') && (userRole === 'admin' || userRole === 'team_leader')) {
      return <>{children}</>;
    }
    
    // For all other routes, show reactivation UI
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
