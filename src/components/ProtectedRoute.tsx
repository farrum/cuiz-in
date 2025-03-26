
import React, { useState, useEffect } from 'react';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useLoginActivity } from '@/hooks/useLoginActivity';
import AuthRedirect from '@/components/AuthRedirect';
import AdminRouteGuard from '@/components/AdminRouteGuard';
import SuspendedAccountHandler from '@/components/SuspendedAccountHandler';
import LoginBonusPopup from '@/components/LoginBonusPopup';
import { useToast } from '@/hooks/use-toast';
import { checkAndSuspendInactiveAccounts, reactivateUserAccount } from '@/utils/accountSuspension';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { toast } = useToast();
  const { 
    isAuthenticated, 
    userRole, 
    isSuspended, 
    userId, 
    userName, 
    isAdminAuth 
  } = useAuthCheck();
  
  const [localIsSuspended, setLocalIsSuspended] = useState(isSuspended);
  
  // Use the login activity hook to track logins and handle login streaks
  const { 
    showBonusPopup, 
    bonusPoints, 
    streakDays, 
    closeBonusPopup 
  } = useLoginActivity(userId, userName, isAuthenticated);

  // Check if user's reactivation has been approved and apply it if needed
  useEffect(() => {
    const checkReactivationApproval = async () => {
      if (isAuthenticated && localIsSuspended && userId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('reactivation_approved')
          .eq('id', userId)
          .single();
          
        if (!error && data && data.reactivation_approved) {
          // If approved, reactivate the account
          const result = await reactivateUserAccount(userId);
          if (result.success) {
            setLocalIsSuspended(false);
            toast({
              title: "Account Reactivated",
              description: "Your account has been reactivated by an administrator.",
            });
          }
        }
      }
    };
    
    checkReactivationApproval();
  }, [isAuthenticated, localIsSuspended, userId, toast]);

  // Show loading state
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  // Check for inactive accounts and suspend if needed when a user authenticates
  if (isAuthenticated) {
    checkAndSuspendInactiveAccounts();
  }

  // Handle popup close
  const handleBonusPopupClose = () => {
    closeBonusPopup();
    
    toast({
      title: "Login Bonus!",
      description: `You earned ${bonusPoints} bonus points for your ${streakDays}-day streak!`,
    });
  };

  // Handle account reactivated from admin approval
  const handleAccountReactivated = () => {
    setLocalIsSuspended(false);
  };

  return (
    <>
      {/* Auth redirect handling */}
      <AuthRedirect isAuthenticated={isAuthenticated} />
      
      {/* Admin route access control */}
      <AdminRouteGuard 
        isAuthenticated={isAuthenticated} 
        userRole={userRole} 
        isAdminAuth={isAdminAuth} 
      />
      
      {/* Account suspension handling */}
      <SuspendedAccountHandler
        isAuthenticated={isAuthenticated}
        isSuspended={localIsSuspended}
        userRole={userRole}
        onReactivated={handleAccountReactivated}
      >
        {children}
      </SuspendedAccountHandler>
      
      {/* Login Bonus Popup */}
      <LoginBonusPopup
        isOpen={showBonusPopup}
        onClose={handleBonusPopupClose}
        bonusPoints={bonusPoints}
        streakDays={streakDays}
      />
    </>
  );
};

export default ProtectedRoute;
