import { BrowserRouter as Router, Route, Routes, Navigate, useParams } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { HelmetProvider } from 'react-helmet-async';
import { PromotionAnimation } from '@/components/PromotionAnimation';
import { useEffect, useState, Suspense } from 'react';
import { supabase, setupRealtimeSubscriptions } from '@/integrations/supabase/client';
import { fetchAllAppData } from '@/integrations/supabase/client';
import scheduledSyncService from './services/scheduledSync';
import accountStatusService from './services/accountStatusService';
import { STORAGE_KEYS } from '@/utils/quizData';
import { syncAdSlotsToLocal } from '@/utils/adService';
import React from 'react';

// Resilient lazy loader: a "Failed to fetch dynamically imported module" error
// usually means the user is running an old build whose chunk no longer exists
// (after a deploy) or a transient network hiccup. Retry once, then force a
// one-time hard reload to pull the fresh chunk instead of showing an error.
function lazyWithRetry<T extends { default: React.ComponentType<any> }>(
  factory: () => Promise<T>
) {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      try {
        return await factory();
      } catch (err2) {
        // Only guard against a *reload loop* within a short window. After that
        // window passes a fresh deploy is allowed to trigger another reload, so
        // the page self-heals instead of staying permanently broken.
        const key = 'chunk-reload-at';
        const now = Date.now();
        const last = Number(sessionStorage.getItem(key) || '0');
        if (!last || now - last > 10000) {
          sessionStorage.setItem(key, String(now));
          window.location.reload();
          // Return a never-resolving promise while the page reloads.
          return await new Promise<T>(() => {});
        }
        throw err2;
      }
    }
  });
}

// Eagerly load the Index page for best LCP
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import Registration from "@/pages/Registration";
import AuthCallback from "@/pages/AuthCallback";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy load non-critical pages for code splitting
const QuizPage = lazyWithRetry(() => import("@/pages/QuizPage"));
const OAuthConsent = lazyWithRetry(() => import("@/pages/OAuthConsent"));
const AnswerPage = lazyWithRetry(() => import("@/pages/AnswerPage"));
const ReferralPage = lazyWithRetry(() => import("@/pages/ReferralPage"));
const ReferralProgramPage = lazyWithRetry(() => import("@/pages/ReferralProgramPage"));
const MiniGamesList = lazyWithRetry(() =>
  import('@/pages/MiniGamesList').then((m) => ({ default: m.MiniGamesList }))
);
const MiniGamePlayPage = lazyWithRetry(() =>
  import('@/pages/MiniGamePlayPage').then((m) => ({ default: m.MiniGamePlayPage }))
);

const Profile = lazyWithRetry(() => import("@/pages/Profile"));
const ForgotPasswordPage = React.lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = React.lazy(() => import("@/pages/ResetPasswordPage"));
const AdminPage = lazyWithRetry(() => import("@/pages/AdminPage"));
const AdminLoginPage = React.lazy(() => import('@/pages/AdminLoginPage'));
const HowToPlay = React.lazy(() => import('@/pages/HowToPlay'));
const TermsPage = React.lazy(() => import('@/pages/TermsPage'));
const DisclaimerPage = React.lazy(() => import('@/pages/DisclaimerPage'));
const PrivacyPage = React.lazy(() => import('@/pages/PrivacyPage'));
const EditorialPolicyPage = React.lazy(() => import('@/pages/EditorialPolicyPage'));
const OurSourcesPage = React.lazy(() => import('@/pages/OurSourcesPage'));
const CorrectionsPolicyPage = React.lazy(() => import('@/pages/CorrectionsPolicyPage'));
const FaqPage = React.lazy(() => import('@/pages/FaqPage'));
const FaqDetailPage = React.lazy(() => import('@/pages/FaqDetailPage'));
const BlogPage = React.lazy(() => import('@/pages/BlogPage'));
const BlogPostPage = React.lazy(() => import('@/pages/BlogPostPage'));
const CategoriesPage = React.lazy(() => import('@/pages/CategoriesPage'));
const CategoryDetailPage = React.lazy(() => import('@/pages/CategoryDetailPage'));
const SubcategoryPage = React.lazy(() => import('@/pages/SubcategoryPage'));
const ChallengePlayPage = React.lazy(() => import('@/pages/ChallengePlayPage'));
const ArchivedChallengesPage = React.lazy(() => import('@/pages/ArchivedChallengesPage'));
const BrowseQuestionsPage = React.lazy(() => import('@/pages/BrowseQuestionsPage'));
const GkQuestionsPage = React.lazy(() => import('@/pages/GkQuestionsPage'));
const TopicPage = React.lazy(() => import('@/pages/TopicPage'));
const WebStoriesPage = React.lazy(() => import('@/pages/WebStoriesPage'));
const HtmlSitemapPage = React.lazy(() => import('@/pages/HtmlSitemapPage'));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const TeamLeaderDashboardPage = React.lazy(() => import("@/pages/TeamLeaderDashboardPage"));
const QuizQuestionPage = React.lazy(() => import("@/pages/QuizQuestionPage"));
const QuizLandingPage = React.lazy(() => import("@/pages/QuizLandingPage"));
const QuizPlayPage = React.lazy(() => import("@/pages/QuizPlayPage"));
const EmpireQuestsPage = React.lazy(() => import("@/pages/EmpireQuestsPage"));
const KingdomsPage = React.lazy(() => import("@/pages/KingdomsPage"));
const ShopScreen = React.lazy(() => import("@/mobile/screens/Shop/ShopScreen"));
const EntityPage = React.lazy(() => import("@/pages/EntityPage"));
const EntitiesDirectoryPage = React.lazy(() => import("@/pages/EntitiesDirectoryPage"));
const ApiDocsPage = React.lazy(() => import("@/pages/ApiDocsPage"));

// Lazy load components that aren't needed immediately
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

// Redirect legacy AMP question URLs (/amp/question/:id) to the real question page
const AmpQuestionRedirect: React.FC = () => {
  const { questionId } = useParams();
  return <Navigate to={`/quiz/play/${questionId}`} replace />;
};

/**
 * Hydrate localStorage cache from a valid Supabase session user.
 * This is called both on init and on auth state changes.
 * It is NEVER called inside onAuthStateChange directly — always deferred.
 */
async function hydrateUserFromSession(userId: string) {
  try {
    const [profileResult, roleResult] = await Promise.all([
      (supabase as any).from('profiles').select('username, gems:points, stars').eq('id', userId).maybeSingle(),
      (supabase as any).from('user_roles').select('role').eq('user_id', userId),
    ]);

    if (profileResult.data) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, profileResult.data.username);
      localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(profileResult.data.gems ?? 0));
      localStorage.setItem(STORAGE_KEYS.USER_STARS, String(profileResult.data.stars ?? 0));
    }

    const roles = new Set((roleResult.data || []).map((item) => item.role).filter(Boolean));
    const role = roles.has('admin') ? 'admin' : roles.has('team_leader') || roles.has('teamleader') ? 'team_leader' : roles.has('junior_team_leader') ? 'junior_team_leader' : 'player';
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);

    if (role === 'admin') {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    }
  } catch (err) {
    console.error('Error hydrating user session:', err);
  }
}

function clearUserCache() {
  localStorage.removeItem(STORAGE_KEYS.USER_ID);
  localStorage.removeItem(STORAGE_KEYS.USER_NAME);
  localStorage.removeItem(STORAGE_KEYS.USER_GEMS);
  localStorage.removeItem(STORAGE_KEYS.USER_STARS);
  localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Immersive edge-to-edge fullscreen overlay mode on native mobile Capacitor shells
        try {
          const { StatusBar } = await import('@capacitor/status-bar');
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.hide();
          console.log("Capacitor Status Bar configured edge-to-edge successfully.");
        } catch (e) {
          console.log("Capacitor Status Bar settings not supported on this platform.");
        }

        // Initialize Background Music (BGM) on first user interaction
        const startBgmOnInteraction = () => {
          import('@/utils/audioManager').then(({ audioManager }) => {
            audioManager.startBGM();
          });
          document.removeEventListener('click', startBgmOnInteraction);
          document.removeEventListener('keydown', startBgmOnInteraction);
        };
        document.addEventListener('click', startBgmOnInteraction);
        document.addEventListener('keydown', startBgmOnInteraction);

        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.user) {
          await hydrateUserFromSession(sessionData.session.user.id);
        } else {
          // No session — clear stale cache
          clearUserCache();
        }
        
        await fetchAllAppData();
        console.log('Initial data fetch complete');

        // Load active ad slots so web + mobile ad placements can render them.
        await syncAdSlotsToLocal();
        
        setupRealtimeSubscriptions();
        console.log('Realtime subscriptions initialized');
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true);
      }
    };
    
    initializeApp();
  }, []);

  // Initialize the scheduled services when the app loads
  useEffect(() => {
    if (isInitialized) {
      scheduledSyncService.start();
      accountStatusService.start(30);
    }
    
    return () => {
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

  // Set up auth state listener — CRITICAL: no awaited Supabase calls inside callback
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Defer async work to avoid deadlocking setSession/getSession
          setTimeout(() => {
            hydrateUserFromSession(session.user.id);
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          clearUserCache();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Silently refresh cache
          setTimeout(() => {
            hydrateUserFromSession(session.user.id);
          }, 0);
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
          <PromotionAnimation />
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
                <LoginPage />
              } />
              <Route path="/.lovable/oauth/consent" element={
                <Suspense fallback={<PageLoader />}>
                  <OAuthConsent />
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
                <Registration />
              } />
              <Route path="/auth/callback" element={
                <AuthCallback />
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
              <Route path="/editorial-policy" element={
                <Suspense fallback={<PageLoader />}>
                  <EditorialPolicyPage />
                </Suspense>
              } />
              <Route path="/our-sources" element={
                <Suspense fallback={<PageLoader />}>
                  <OurSourcesPage />
                </Suspense>
              } />
              <Route path="/corrections" element={
                <Suspense fallback={<PageLoader />}>
                  <CorrectionsPolicyPage />
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
              <Route path="/categories/:categorySlug/:subSlug" element={
                <Suspense fallback={<PageLoader />}>
                  <SubcategoryPage />
                </Suspense>
              } />
              <Route path="/browse" element={
                <Suspense fallback={<PageLoader />}>
                  <BrowseQuestionsPage />
                </Suspense>
              } />
              <Route path="/gk-questions" element={
                <Suspense fallback={<PageLoader />}>
                  <GkQuestionsPage />
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

              {/* Knowledge Graph Entity Routes */}
              <Route path="/entities" element={
                <Suspense fallback={<PageLoader />}>
                  <EntitiesDirectoryPage />
                </Suspense>
              } />
              <Route path="/people" element={
                <Suspense fallback={<PageLoader />}>
                  <EntitiesDirectoryPage initialType="person" />
                </Suspense>
              } />
              <Route path="/people/:slug" element={
                <Suspense fallback={<PageLoader />}>
                  <EntityPage entityType="person" />
                </Suspense>
              } />
              <Route path="/places" element={
                <Suspense fallback={<PageLoader />}>
                  <EntitiesDirectoryPage initialType="place" />
                </Suspense>
              } />
              <Route path="/places/:slug" element={
                <Suspense fallback={<PageLoader />}>
                  <EntityPage entityType="place" />
                </Suspense>
              } />
              <Route path="/events" element={
                <Suspense fallback={<PageLoader />}>
                  <EntitiesDirectoryPage initialType="event" />
                </Suspense>
              } />
              <Route path="/events/:slug" element={
                <Suspense fallback={<PageLoader />}>
                  <EntityPage entityType="event" />
                </Suspense>
              } />
              <Route path="/concepts" element={
                <Suspense fallback={<PageLoader />}>
                  <EntitiesDirectoryPage initialType="concept" />
                </Suspense>
              } />
              <Route path="/concepts/:slug" element={
                <Suspense fallback={<PageLoader />}>
                  <EntityPage entityType="concept" />
                </Suspense>
              } />

              {/* Developer & AI Knowledge API Routes */}
              <Route path="/developers" element={
                <Suspense fallback={<PageLoader />}>
                  <ApiDocsPage />
                </Suspense>
              } />
              <Route path="/api-docs" element={
                <Suspense fallback={<PageLoader />}>
                  <ApiDocsPage />
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
              <Route path="/admin/gamification" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/guests" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/team-leaders" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/tasks" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              <Route path="/admin/*" element={<LazyProtectedRoute><AdminPage /></LazyProtectedRoute>} />
              
              <Route path="/quiz/question/:questionId/:questionSlug" element={
                <Suspense fallback={<PageLoader />}>
                  <QuizQuestionPage />
                </Suspense>
              } />
              <Route path="/quiz/question/:questionId/:categorySlug/:questionSlug" element={
                <Suspense fallback={<PageLoader />}>
                  <QuizQuestionPage />
                </Suspense>
              } />
              <Route path="/quiz/question/:questionId/:categorySlug/:subSlug/:questionSlug" element={
                <Suspense fallback={<PageLoader />}>
                  <QuizQuestionPage />
                </Suspense>
              } />
              <Route path="/quiz/play/:questionId/:questionSlug" element={
                <Suspense fallback={<PageLoader />}>
                  <QuizPlayPage />
                </Suspense>
              } />
              <Route path="/quiz/play/:questionId" element={
                <Suspense fallback={<PageLoader />}>
                  <QuizPlayPage />
                </Suspense>
              } />

              {/* Legacy AMP URLs — redirect to the standard question page */}
              <Route path="/amp/question/:questionId" element={<AmpQuestionRedirect />} />
              <Route path="/amp/question/:questionId/*" element={<AmpQuestionRedirect />} />

              {/* SEO landing pages targeting high-volume Indian search queries */}
              <Route path="/cricket-quiz" element={
                <Suspense fallback={<PageLoader />}>
                  <QuizLandingPage slug="cricket-quiz" />
                </Suspense>
              } />
              <Route path="/bollywood-quiz" element={
                <Suspense fallback={<PageLoader />}>
                  <QuizLandingPage slug="bollywood-quiz" />
                </Suspense>
              } />
              <Route path="/gk-quiz" element={
                <Suspense fallback={<PageLoader />}>
                  <QuizLandingPage slug="gk-quiz" />
                </Suspense>
              } />
              
                            <Route path="/minigames" element={
                <Suspense fallback={<PageLoader />}>
                  <MiniGamesList />
                </Suspense>
              } />
              <Route path="/minigames/:gameId" element={
                <Suspense fallback={<PageLoader />}>
                  <MiniGamePlayPage />
                </Suspense>
              } />
              
              <Route path="/empire-quests" element={
                <LazyProtectedRoute>
                  <EmpireQuestsPage />
                </LazyProtectedRoute>
              } />

              <Route path="/kingdoms" element={
                <LazyProtectedRoute>
                  <KingdomsPage />
                </LazyProtectedRoute>
              } />

              <Route path="/shop" element={
                <LazyProtectedRoute>
                  <ShopScreen />
                </LazyProtectedRoute>
              } />

            </Routes>
          </Router>
        </ThemeProvider>
      </HelmetProvider>
    </div>
  );
}

export default App;