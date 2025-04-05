
import React from 'react';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const QuizPage = React.lazy(() => import('./pages/QuizPage'));
const ChallengePlayPage = React.lazy(() => import('./pages/ChallengePlayPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));

// Export all lazy-loaded components
export {
  LoginPage,
  ProfilePage,
  QuizPage,
  ChallengePlayPage, 
  AdminPage,
};
