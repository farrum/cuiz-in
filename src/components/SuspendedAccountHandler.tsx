
import React from 'react';
import { useLocation } from 'react-router-dom';
import AccountReactivation from '@/components/AccountReactivation';

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
          onReactivated={onReactivated} 
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default SuspendedAccountHandler;
