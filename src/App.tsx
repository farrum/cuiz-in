import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { HelmetProvider } from 'react-helmet-async';
import { useEffect, useState, Suspense } from 'react';
import { supabase, setupRealtimeSubscriptions } from '@/integrations/supabase/client';
import { fetchAllAppData } from '@/integrations/supabase/client';
import scheduledSyncService from './services/scheduledSync';
import accountStatusService from './services/accountStatusService';
import { STORAGE_KEYS } from '@/utils/quizData';
import React from 'react';

// Eagerly load the Index page for best LCP
import Index from "@/pages/Index";

// Lazy load all other pages for code splitting
const QuizPage = React.lazy(() => import("@/pages/QuizPage"));
const AnswerPage = React.lazy(() => import("@/pages/AnswerPage"));
const ReferralPage = React.lazy(() => import("@/pages/ReferralPage"));
const ReferralProgramPage = React.lazy(() => import("@/pages/ReferralProgramPage"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const LoginPage = React.lazy(() => import("@/pages/LoginPage"));
const ForgotPasswordPage = React.lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = React.lazy(() => import("@/pages/ResetPasswordPage"));
const Registration = React.lazy(() => import("@/pages/Registration"));
const AdminPage = React.lazy(() => import("@/pages/AdminPage"));
const AdminLoginPage = React.lazy(() => import('@/pages/AdminLoginPage'));
const HowToPlay = React.lazy(() => import('@/pages/HowToPlay'));
const TermsPage = React.lazy(() => import('@/pages/TermsPage'));
const DisclaimerPage = React.lazy(() => import('@/pages/DisclaimerPage'));
const PrivacyPage = React.lazy(() => import('@/pages/PrivacyPage'));
const FaqPage = React.lazy(() => import('@/pages/FaqPage'));
const FaqDetailPage = React.lazy(() => import('@/pages/FaqDetailPage'));
const BlogPage = React.lazy(() => import('@/pages/BlogPage'));
const BlogPostPage = React.lazy(() => import('@/pages/BlogPostPage'));
const CategoriesPage = React.lazy(() => import('@/pages/CategoriesPage'));
const CategoryDetailPage = React.lazy(() => import('@/pages/CategoryDetailPage'));
const ChallengePlayPage = React.lazy(() => import('@/pages/ChallengePlayPage'));
const ArchivedChallengesPage = React.lazy(() => import('@/pages/ArchivedChallengesPage'));
const BrowseQuestionsPage = React.lazy(() => import('@/pages/BrowseQuestionsPage'));
const TopicPage = React.lazy(() => import('@/pages/TopicPage'));
const WebStoriesPage = React.lazy(() => import('@/pages/WebStoriesPage'));
const HtmlSitemapPage = React.lazy(() => import('@/pages/HtmlSitemapPage'));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const TeamLeaderDashboardPage = React.lazy(() => import("@/pages/TeamLeaderDashboardPage"));
const QuizQuestionPage = React.lazy(() => import("@/pages/QuizQuestionPage"));

// Lazy load components that aren't needed immediately
const ProtectedRoute = React.lazy(() => import("@/components/ProtectedRoute"));
const ScrollToTop = React.lazy(() => import("@/components/ScrollToTop"));

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Wrapper for protected routes with suspense
const LazyProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    <ProtectedRoute>{children}</ProtectedRoute>
  </Suspense>
);

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

  // Initialize the scheduled services when the app loads
  useEffect(() => {
    if (isInitialized) {
      scheduledSyncService.start();
      accountStatusService.start(30); // Check every 30 minutes
    }
    
    return () => {
      // Clean up services on unmount
      scheduledSyncService.stop();
      accountStatusService.stop();
    };
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
          
          // Force reload if on access-controlled pages to refresh permissions
          if (window.location.pathname.startsWith('/admin') || 
              window.location.pathname.startsWith('/team-dashboard')) {
            console.log('User is on a role-controlled page, will reload to apply permissions');
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
      <HelmetProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <Toaster />
          <Router>
            <Suspense fallback={null}>
              <ScrollToTop />
            </Suspense>
            <Routes>
              {/* Index page loads eagerly for best LCP */}
              <Route path="/" element={<Index />} />
              
              {/* All other routes are lazy-loaded */}
              <Route path="/quiz" element={
                <Suspense fallback={<PageLoader />}>
                  <QuizPage />
                </Suspense>
              } />
              <Route path="/answer/:questionId/:selectedOption" element={
                <Suspense fallback={<PageLoader />}>
                  <AnswerPage />
                </Suspense>
              } />
              <Route path="/challenge/:challengeId" element={
                <LazyProtectedRoute>
                  <ChallengePlayPage />
                </LazyProtectedRoute>
              } />
              <Route path="/archived-challenges" element={
                <LazyProtectedRoute>
                  <ArchivedChallengesPage />
                </LazyProtectedRoute>
              } />
              <Route path="/referral" element={
                <LazyProtectedRoute>
                  <ReferralPage />
                </LazyProtectedRoute>
              } />
              <Route path="/referral-program" element={
                <Suspense fallback={<PageLoader />}>
                  <ReferralProgramPage />
                </Suspense>
              } />
              <Route path="/login" element={
                <Suspense fallback={<PageLoader />}>
                  <LoginPage />
                </Suspense>
              } />
              <Route path="/forgot-password" element={
                <Suspense fallback={<PageLoader />}>
                  <ForgotPasswordPage />
                </Suspense>
              } />
              <Route path="/reset-password" element={
                <Suspense fallback={<PageLoader />}>
                  <ResetPasswordPage />
                </Suspense>
              } />
              <Route path="/register" element={
                <Suspense fallback={<PageLoader />}>
                  <Registration />
                </Suspense>
              } />
              <Route path="/admin-login" element={
                <Suspense fallback={<PageLoader />}>
                  <AdminLoginPage />
                </Suspense>
              } />
              <Route path="/how-to-play" element={
                <Suspense fallback={<PageLoader />}>
                  <HowToPlay />
                </Suspense>
              } />
              <Route path="/terms" element={
                <Suspense fallback={<PageLoader />}>
                  <TermsPage />
                </Suspense>
              } />
              <Route path="/disclaimer" element={
                <Suspense fallback={<PageLoader />}>
                  <DisclaimerPage />
                </Suspense>
              } />
              <Route path="/privacy" element={
                <Suspense fallback={<PageLoader />}>
                  <PrivacyPage />
                </Suspense>
              } />
              
              {/* New SEO Content Pages */}
              <Route path="/faq" element={
                <Suspense fallback={<PageLoader />}>
                  <FaqPage />
                </Suspense>
              } />
              <Route path="/faq/:id/:slug" element={
                <Suspense fallback={<PageLoader />}>
                  <FaqDetailPage />
                </Suspense>
              } />
              <Route path="/blog" element={
                <Suspense fallback={<PageLoader />}>
                  <BlogPage />
                </Suspense>
              } />
              <Route path="/blog/:postSlug" element={
                <Suspense fallback={<PageLoader />}>
                  <BlogPostPage />
                </Suspense>
              } />
              <Route path="/categories" element={
                <Suspense fallback={<PageLoader />}>
                  <CategoriesPage />
                </Suspense>
              } />
              <Route path="/categories/:categorySlug" element={
                <Suspense fallback={<PageLoader />}>
                  <CategoryDetailPage />
                </Suspense>
              } />
              <Route path="/browse" element={
                <Suspense fallback={<PageLoader />}>
                  <BrowseQuestionsPage />
                </Suspense>
              } />
              <Route path="/topics" element={
                <Suspense fallback={<PageLoader />}>
                  <TopicPage />
                </Suspense>
              } />
              <Route path="/topics/:topicSlug" element={
                <Suspense fallback={<PageLoader />}>
                  <TopicPage />
                </Suspense>
              } />
              <Route path="/stories" element={
                <Suspense fallback={<PageLoader />}>
                  <WebStoriesPage />
                </Suspense>
              } />
              <Route path="/all-questions" element={
                <Suspense fallback={<PageLoader />}>
                  <HtmlSitemapPage />
                </Suspense>
              } />
              <Route path="/stories/:storyId" element={
                <Suspense fallback={<PageLoader />}>
                  <WebStoriesPage />
                </Suspense>
              } />
              
              <Route path="/team-dashboard" element={
                <LazyProtectedRoute>
                  <TeamLeaderDashboardPage />
                </LazyProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <LazyProtectedRoute>
                  <Profile />
                </LazyProtectedRoute>
              } />
              
              {/* Admin routes */}
              <Route path="/admin" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/users" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/logs" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/ads" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/payments" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/referrals" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/quiz" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/quiz/questions" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/quiz/challenges" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/badges" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/reports" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/sync" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/messages" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/ticker" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/icons" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/requests" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/partnerships" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/blog" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/faq" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/seo" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              
              <Route path="/quiz/question/:questionId/:questionSlug" element={
                <Suspense fallback={<PageLoader />}>
                  <QuizQuestionPage />
                </Suspense>
              } />
              
              <Route path="*" element={
                <Suspense fallback={<PageLoader />}>
                  <NotFound />
                </Suspense>
              } />
            </Routes>
          </Router>
        </ThemeProvider>
      </HelmetProvider>
    </div>
  );
}

export default App;
