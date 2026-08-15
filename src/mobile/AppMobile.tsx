import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { useEffect, useState, lazy, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { MobileShell } from './layout/MobileShell';
import { MobileSplash } from './components/MobileSplash';
import { ScreenSkeleton } from './components/ScreenSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initMobilePlatform } from './platform/init';
import { MobileMusicProvider, MobileMusicPlayer } from './components/MobileMusicPlayer';
import { BannerHost } from './ads/BannerHost';

// Lazy-load screens for fast first paint
const HubScreen = lazy(() => import('./screens/Hub/HubScreen'));
const QuizStoryScreen = lazy(() => import('./screens/QuizStory/QuizStoryScreen'));
const LeaderboardScreen = lazy(() => import('./screens/Leaderboard/LeaderboardScreen'));
const ProfileScreen = lazy(() => import('./screens/Profile/ProfileScreen'));
const MobileTeamDashboard = lazy(() => import('./screens/Profile/MobileTeamDashboard'));
const OnboardingScreen = lazy(() => import('./screens/Onboarding/OnboardingScreen'));
const MobileLoginScreen = lazy(() => import('./screens/Login/MobileLoginScreen'));
const DailyChallengeStoryScreen = lazy(() => import('./screens/DailyChallengeStory/DailyChallengeStoryScreen'));
const MiniGameScreen = lazy(() => import('./screens/MiniGames/MiniGameScreen'));
const EmpireQuestsPage = lazy(() => import('../pages/EmpireQuestsPage'));
const KingdomsPage = lazy(() => import('../pages/KingdomsPage'));
const ShopScreen = lazy(() => import('./screens/Shop/ShopScreen'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function RequireAuth({ authed }: { authed: boolean }) {
  const location = useLocation();
  if (!authed) {
    const onboarded = localStorage.getItem('mobile_onboarded') === '1';
    if (!onboarded) {
      return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

async function hydrateMobileSession(userId: string) {
  try {
    const [profileResult, roleResult] = await Promise.all([
      supabase.from('profiles').select('username, display_name, gems:points').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);
    if (profileResult.data) {
      const pd = profileResult.data as any;
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      // USER_NAME is the display greeting (can be display_name)
      localStorage.setItem(STORAGE_KEYS.USER_NAME, pd.display_name || pd.username);
      // USER_USERNAME is the stable login handle — always used for referral links
      localStorage.setItem('cuizin_username', pd.username || '');
      localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(pd.gems ?? 0));
    }
    const roles = new Set((roleResult.data || []).map((r) => r.role).filter(Boolean));
    const role = roles.has('admin') ? 'admin' : roles.has('team_leader') ? 'team_leader' : roles.has('junior_team_leader') ? 'junior_team_leader' : 'player';
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
  } catch (err) {
    console.error('[Mobile] hydrate error:', err);
  }
}

function AppMobile() {
  const [booted, setBooted] = useState(false);
  const [authed, setAuthed] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    initMobilePlatform();

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setAuthed(true);
          await hydrateMobileSession(data.session.user.id);
        }
      } finally {
        if (mounted) setBooted(true);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setAuthed(true);
        setTimeout(() => hydrateMobileSession(session.user.id), 0);
      } else if (event === 'SIGNED_OUT') {
        setAuthed(false);
        [STORAGE_KEYS.USER_ID, STORAGE_KEYS.USER_NAME, STORAGE_KEYS.USER_GEMS, STORAGE_KEYS.USER_ROLE]
          .forEach((k) => localStorage.removeItem(k));
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!booted) return <MobileSplash />;

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="cuizin-mobile-theme" enableSystem={false} forcedTheme="light">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MobileMusicProvider>
              {/* Routes inside MobileShell have their own Suspense + error
                  boundary so navigation never blanks the whole viewport. */}
              <ErrorBoundary>
              <Suspense fallback={<ScreenSkeleton />}>
                <Routes>
                  <Route path="/onboarding" element={<OnboardingScreen />} />
                  <Route path="/login" element={<MobileLoginScreen />} />
                  <Route element={<RequireAuth authed={authed} />}>
                    <Route element={<MobileShell />}>
                      <Route path="/hub" element={<HubScreen />} />
                      <Route path="/leaderboard" element={<LeaderboardScreen />} />
                      <Route path="/profile" element={<ProfileScreen />} />
                      <Route path="/empire-quests" element={<EmpireQuestsPage />} />
                      <Route path="/kingdoms" element={<KingdomsPage />} />
                      <Route path="/shop" element={<ShopScreen />} />
                      <Route path="/team-dashboard" element={<MobileTeamDashboard />} />
                    </Route>
                    {/* Full-screen routes live outside the shell, so they need
                        their own boundary — otherwise one bad render blanks
                        the entire app instead of just this screen. */}
                    <Route
                      path="/quiz"
                      element={<ErrorBoundary compact resetKey="/quiz"><QuizStoryScreen /></ErrorBoundary>}
                    />
                    <Route
                      path="/daily"
                      element={<ErrorBoundary compact resetKey="/daily"><DailyChallengeStoryScreen /></ErrorBoundary>}
                    />
                    <Route
                      path="/game/:gameId"
                      element={<ErrorBoundary compact resetKey="/game"><MiniGameScreen /></ErrorBoundary>}
                    />
                  </Route>
                  <Route path="/" element={<Navigate to="/hub" replace />} />
                  <Route path="*" element={<Navigate to="/hub" replace />} />
                </Routes>
              </Suspense>
              </ErrorBoundary>
              <MobileMusicPlayer />
              {/* Single, session-long native banner surface. */}
              <BannerHost />
            </MobileMusicProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default AppMobile;