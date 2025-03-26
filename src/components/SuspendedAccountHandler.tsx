
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AccountReactivation from '@/components/AccountReactivation';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';

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
      const { error } = await supabase
        .from('profiles')
        .update({
          reactivation_requested: true,
          reactivation_requested_at: now
        })
        .eq('id', userId);

      if (error) {
        console.error('Error requesting reactivation:', error);
        return;
      }

      setReactivationRequested(true);
      setRequestDate(now);
    } catch (err) {
      console.error('Failed to request reactivation:', err);
    }
  };

  // Handle suspended account
  if (isAuthenticated && isSuspended) {
    // For admin routes, don't block access even if suspended
    if (location.pathname.startsWith('/admin') && (userRole === 'admin' || userRole === 'team_leader')) {
      return <>{children}</>;
    }
    
    // For regular routes, show reactivation UI
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <AccountReactivation 
          reactivationRequested={reactivationRequested}
          reactivationApproved={reactivationApproved}
          requestDate={requestDate}
          onReactivationRequest={handleRequestReactivation}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default SuspendedAccountHandler;
