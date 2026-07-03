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
import { initMobilePlatform } from './platform/init';
import { MobileMusicProvider, MobileMusicPlayer } from './components/MobileMusicPlayer';

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

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function RequireAuth({ authed }: { authed: boolean }) {
  const location = useLocation();
  if (!authed) {
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
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, (profileResult.data as any).display_name || profileResult.data.username);
      localStorage.setItem(STORAGE_KEYS.USER_GEMS, String((profileResult.data as any).gems ?? 0));
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
        <ThemeProvider defaultTheme="dark" storageKey="cuizin-mobile-theme">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MobileMusicProvider>
              <Suspense fallback={<MobileSplash />}>
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
                    </Route>
                    <Route path="/team-dashboard" element={<MobileTeamDashboard />} />
                    <Route path="/quiz" element={<QuizStoryScreen />} />
                    <Route path="/daily" element={<DailyChallengeStoryScreen />} />
                    <Route path="/game/:gameId" element={<MiniGameScreen />} />
                  </Route>
                  <Route path="/" element={<Navigate to="/hub" replace />} />
                  <Route path="*" element={<Navigate to="/hub" replace />} />
                </Routes>
              </Suspense>
              <MobileMusicPlayer />
            </MobileMusicProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default AppMobile;