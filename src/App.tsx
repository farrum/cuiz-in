
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useEffect, useState } from 'react';
import { supabase, setupRealtimeSubscriptions } from '@/integrations/supabase/client';
import { fetchAllAppData } from '@/integrations/supabase/client';
import scheduledSyncService from './services/scheduledSync';
import { STORAGE_KEYS } from '@/utils/quizData';
import React from 'react';

// Pages
import Index from "@/pages/Index";
import QuizPage from "@/pages/QuizPage";
import AnswerPage from "@/pages/AnswerPage";
import ReferralPage from "@/pages/ReferralPage";
import ReferralProgramPage from "@/pages/ReferralProgramPage";
import Profile from "@/pages/Profile";
import LoginPage from "@/pages/LoginPage";
import Registration from "@/pages/Registration";
import AdminPage from "@/pages/AdminPage";
import AdminLoginPage from '@/pages/AdminLoginPage';
import HowToPlay from '@/pages/HowToPlay';
import TermsPage from '@/pages/TermsPage';
import DisclaimerPage from '@/pages/DisclaimerPage';
import PrivacyPage from '@/pages/PrivacyPage';
import ChallengePlayPage from '@/pages/ChallengePlayPage';
import ArchivedChallengesPage from '@/pages/ArchivedChallengesPage';
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import TeamLeaderDashboardPage from "@/pages/TeamLeaderDashboardPage";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Check for existing session
        const { data: sessionData } = await supabase.auth.getSession();
        
        // If user is logged in, fetch their profile
        if (sessionData?.session?.user) {
          const userId = sessionData.session.user.id;
          
          // Get user profile from Supabase
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (profileData) {
            // Store user data in localStorage
            localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
            localStorage.setItem(STORAGE_KEYS.USER_NAME, profileData.username);
            localStorage.setItem(STORAGE_KEYS.USER_POINTS, profileData.points.toString());
            
            // Get user role
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', userId)
              .maybeSingle();
              
            if (roleData) {
              localStorage.setItem(STORAGE_KEYS.USER_ROLE, roleData.role);
            } else {
              localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'player');
            }
          }
        }
        
        // Fetch all app data
        await fetchAllAppData();
        console.log('Initial data fetch complete');
        
        // Set up realtime subscriptions
        setupRealtimeSubscriptions();
        console.log('Realtime subscriptions initialized');
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true); // Set to true anyway to allow app to render
      }
    };
    
    initializeApp();
  }, []);

  // Initialize the scheduled sync service when the app loads
  useEffect(() => {
    if (isInitialized) {
      scheduledSyncService.start();
    }
  }, [isInitialized]);
  
  // Listen for role updates
  useEffect(() => {
    const handleRoleUpdate = (event: any) => {
      const roleData = event.detail?.[0];
      
      if (roleData) {
        const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        
        if (userId && roleData.user_id === userId) {
          localStorage.setItem(STORAGE_KEYS.USER_ROLE, roleData.role);
          console.log('User role updated:', roleData.role);
          
          // Force reload if on admin page to refresh permissions
          if (window.location.pathname.startsWith('/admin') || 
              window.location.pathname.startsWith('/team-dashboard')) {
            window.location.reload();
          }
        }
      }
    };
    
    window.addEventListener('userRoleUpdated', handleRoleUpdate);
    
    return () => {
      window.removeEventListener('userRoleUpdated', handleRoleUpdate);
    };
  }, []);

  // Set up auth state listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // User signed in, update local storage
          const userId = session.user.id;
          
          // Get user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (profileData) {
            localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
            localStorage.setItem(STORAGE_KEYS.USER_NAME, profileData.username);
            localStorage.setItem(STORAGE_KEYS.USER_POINTS, profileData.points.toString());
            
            // Get user role
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', userId)
              .maybeSingle();
              
            if (roleData) {
              localStorage.setItem(STORAGE_KEYS.USER_ROLE, roleData.role);
            } else {
              localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'player');
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out, clear local storage
          localStorage.removeItem(STORAGE_KEYS.USER_ID);
          localStorage.removeItem(STORAGE_KEYS.USER_NAME);
          localStorage.removeItem(STORAGE_KEYS.USER_POINTS);
          localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="app-container">
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Toaster />
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/answer/:questionId/:selectedOption" element={<AnswerPage />} />
            <Route path="/challenge/:challengeId" element={
              <ProtectedRoute>
                <ChallengePlayPage />
              </ProtectedRoute>
            } />
            <Route path="/archived-challenges" element={
              <ProtectedRoute>
                <ArchivedChallengesPage />
              </ProtectedRoute>
            } />
            <Route path="/referral" element={
              <ProtectedRoute>
                <ReferralPage />
              </ProtectedRoute>
            } />
            <Route path="/referral-program" element={<ReferralProgramPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/how-to-play" element={<HowToPlay />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            
            <Route path="/team-dashboard" element={
              <ProtectedRoute>
                <TeamLeaderDashboardPage />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            {/* Admin routes - make all admin paths go to the AdminPage */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/ads" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/referrals" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/quiz" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/quiz/questions" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/quiz/challenges" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/badges" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/sync" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/messages" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/ticker" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/icons" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/requests" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </div>
  );
}

export default App;
