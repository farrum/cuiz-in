
import React, { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
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

  // For admin routes, don't block access even if suspended
  if (isAuthenticated && isSuspended) {
    if (location.pathname.startsWith('/admin') && (userRole === 'admin' || userRole === 'team_leader')) {
      return <>{children}</>;
    }
    
    // For essential pages like index, terms, etc. don't redirect but show overlay
    if (location.pathname === '/' || 
        location.pathname === '/login' || 
        location.pathname === '/register' || 
        location.pathname === '/terms' || 
        location.pathname === '/privacy' || 
        location.pathname === '/disclaimer' ||
        location.pathname === '/how-to-play') {
      return (
        <div className="relative min-h-screen">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <AccountReactivation 
              reactivationRequested={reactivationRequested}
              reactivationApproved={reactivationApproved}
              requestDate={requestDate}
              onReactivationRequest={handleRequestReactivation}
              onReactivated={onReactivated}
            />
          </div>
          <div className="pointer-events-none opacity-20">
            {children}
          </div>
        </div>
      );
    }
    
    // For all other routes (e.g., quiz, profile, etc.), redirect to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default SuspendedAccountHandler;
