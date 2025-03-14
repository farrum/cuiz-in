
import React from 'react';
import { useLoginRedirect } from '@/hooks/useLoginRedirect';
import LoginForm from '@/components/auth/LoginForm';

const UserLogin: React.FC = () => {
  // Handle redirects if user is already logged in
  useLoginRedirect();
  
  return <LoginForm />;
};

export default UserLogin;
