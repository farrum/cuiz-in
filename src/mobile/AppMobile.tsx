import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { useEffect, useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { MobileShell } from './layout/MobileShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { hideNativeSplashAfterFirstPaint, initMobilePlatform } from './platform/init';
import { MobileMusicProvider, MobileMusicPlayer } from './components/MobileMusicPlayer';
import { BannerHost } from './ads/BannerHost';
import { AppPreloader } from './components/AppPreloader';

// All screens are statically imported — no Suspense needed and no lazy-load blinks
import HubScreen from './screens/Hub/HubScreen';
import LeaderboardScreen from './screens/Leaderboard/LeaderboardScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';
import MobileTeamDashboard from './screens/Profile/MobileTeamDashboard';
import ShopScreen from './screens/Shop/ShopScreen';
import QuizStoryScreen from './screens/QuizStory/QuizStoryScreen';
import OnboardingScreen from './screens/Onboarding/OnboardingScreen';
import MobileLoginScreen from './screens/Login/MobileLoginScreen';
import DailyChallengeStoryScreen from './screens/DailyChallengeStory/DailyChallengeStoryScreen';
import MiniGameScreen from './screens/MiniGames/MiniGameScreen';
import EmpireQuestsPage from '../pages/EmpireQuestsPage';
import KingdomsPage from '../pages/KingdomsPage';

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
      localStorage.setItem(STORAGE_KEYS.USER_NAME, pd.display_name || pd.username);
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

const getSystemTimeTheme = () => {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? 'light' : 'dark';
};

function AppMobile() {
  const [authed, setAuthed] = useState<boolean>(() => Boolean(localStorage.getItem(STORAGE_KEYS.USER_ID)));

  // Preloader gates the entire route tree. While it shows, the app warms up
  // in background (session check, questions cache, AdMob init).
  // The preloader div has a solid dark background so the WebView never shows white.
  const [preloadDone, setPreloadDone] = useState<boolean>(false);

  useEffect(() => {
    initMobilePlatform();

    // Native splash is hidden by the preloader taking over immediately.
    hideNativeSplashAfterFirstPaint();

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setAuthed(true);
          await hydrateMobileSession(data.session.user.id);
          const { recordAttendance } = await import('@/services/attendanceService');
          void recordAttendance();
        }
      } catch (err) {
        console.warn('[Mobile] session check error:', err);
      }
    })();

    // Silent prefetch questions cache for offline gameplay
    (async () => {
      try {
        const lastFetched = localStorage.getItem('last_questions_fetch_time');
        const now = Date.now();
        if (!lastFetched || now - Number(lastFetched) > 86400000) {
          const { fetchQuizQuestions } = await import('@/utils/quizData');
          await fetchQuizQuestions();
          localStorage.setItem('last_questions_fetch_time', String(now));
        }
      } catch (e) {
        console.warn('[Offline Cache] Silent prefetch failed:', e);
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

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  // Render preloader before anything else. It's full-screen with a solid
  // dark background (no opacity, no transparency) so WebView can't bleed through.
  if (!preloadDone) {
    return <AppPreloader minDurationMs={2400} onComplete={() => setPreloadDone(true)} />;
  }

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme={getSystemTimeTheme()} storageKey="cuizin-mobile-theme" enableSystem={false}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MobileMusicProvider>
              <ErrorBoundary>
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
                    <Route
                      path="/minigames/:gameId"
                      element={<ErrorBoundary compact resetKey="/minigames"><MiniGameScreen /></ErrorBoundary>}
                    />
                    <Route
                      path="/minigames"
                      element={<ErrorBoundary compact resetKey="/minigames-hub"><MiniGameScreen /></ErrorBoundary>}
                    />
                  </Route>
                  <Route path="/" element={<Navigate to="/hub" replace />} />
                  <Route path="*" element={<Navigate to="/hub" replace />} />
                </Routes>
              </ErrorBoundary>
              <MobileMusicPlayer />
              {/* Single, session-long native banner surface — managed here, never per-screen */}
              <BannerHost />
            </MobileMusicProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default AppMobile;