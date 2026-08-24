import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { storePendingReferral, claimPendingReferral } from '@/utils/pendingReferral';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || '/quiz';
    storePendingReferral(params.get('ref'));

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      while (!cancelled && attempts < 15) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          // Link the new account to the commander whose invite link was used.
          await claimPendingReferral();
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