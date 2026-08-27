import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { storePendingReferral, claimPendingReferral } from '@/utils/pendingReferral';
import { STORAGE_KEYS } from '@/utils/quizData';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || '/';
    storePendingReferral(params.get('ref'));

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      while (!cancelled && attempts < 15) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          // Link the new account to the commander whose invite link was used.
          await claimPendingReferral();

          // Sync guest data (gems, stars, etc.) to their profile in Supabase
          const guestGems = Number(localStorage.getItem('quiz_app_user_gems') || '0');
          const guestStars = Number(localStorage.getItem('quiz_app_user_stars') || '0');
          
          if (guestGems > 0 || guestStars > 0) {
            try {
              const uid = data.session.user.id;
              const { data: profile } = await supabase
                .from('profiles')
                .select('points, stars')
                .eq('id', uid)
                .maybeSingle();
                
              if (profile) {
                const newPoints = Number(profile.points || 0) + guestGems;
                const newStars = Number(profile.stars || 0) + guestStars;
                
                await supabase
                  .from('profiles')
                  .update({ points: newPoints, stars: newStars })
                  .eq('id', uid);
              }
            } catch (err) {
              console.error('Failed to sync guest stats to profile:', err);
            }
          }
          
          // Clear guest statistics so they don't persist into the account
          try {
            localStorage.removeItem(STORAGE_KEYS.COMPLETED_QUESTIONS);
            localStorage.removeItem(STORAGE_KEYS.STREAK_COUNT);
            localStorage.removeItem('quiz_app_user_stars');
            localStorage.removeItem('quiz_app_user_gems');
            localStorage.removeItem('cuizin_quest_progress');
          } catch (e) {
            console.error('Failed to clear guest local storage data:', e);
          }

          navigate(next, { replace: true });
          return;
        }
        attempts++;
        await new Promise((r) => setTimeout(r, 400));
      }
      if (!cancelled) {
        toast({
          title: 'Sign-in failed',
          description: 'We could not complete Google sign-in. Please try again.',
          variant: 'destructive',
        });
        navigate('/login', { replace: true });
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [location, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Completing sign-in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;