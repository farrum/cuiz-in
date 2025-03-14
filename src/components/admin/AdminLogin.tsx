
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AdminRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user && userRole === 'admin') {
        // Redirect to admin dashboard if user is admin
        navigate('/admin');
      } else {
        // Redirect to login page if not admin
        navigate('/login');
      }
    }
  }, [user, userRole, isLoading, navigate]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
};

export default AdminRedirect;
