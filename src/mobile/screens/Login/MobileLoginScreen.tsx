import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MedievalCharacterBanner } from '@/mobile/components/MedievalCharacterBanner';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';
import { trackGuestEvent } from '@/utils/guestAnalytics';
import { TopBannerAd } from '@/mobile/ads/TopBannerAd';

export default function MobileLoginScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { toast } = useToast();
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'forgot-password'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    haptics('medium');
    try {
      if (mode === 'forgot-password') {
        const redirectUrl = `https://cuiz.in/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectUrl,
        });
        if (error) throw error;
        toast({
          title: 'Raven Sent',
          description: 'Check your inbox for the password reset scroll.',
        });
        setMode('sign-in');
      } else if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        haptics('success');
        navigate('/hub');
      } else {
        const uname = (username || email.split('@')[0]).trim();
        
        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', uname)
          .maybeSingle();

        if (existingUser) {
          throw new Error('That name is already claimed by another warrior');
        }

        // Create standard credentials account
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: uname,
            }
          }
        });
        if (error) throw error;

        if (data?.user) {
          // Create matching profile row
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: data.user.id,
                username: uname,
                email: data.user.email,
              }
            ]);
          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }

        trackGuestEvent({ event_type: 'registered' });
        haptics('success');
        navigate('/hub');
      }
    } catch (err: any) {
      haptics('error');
      toast({ title: 'Alas!', description: err.message || 'The kingdom gates refused entry', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col stone-wall px-6"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
    >
      {/* Torch ambience */}
      <div className="torch-glow-ambient absolute top-20 left-0" style={{ width: 120, height: 120, opacity: 0.3 }} />
      <div className="torch-glow-ambient absolute top-20 right-0" style={{ width: 120, height: 120, opacity: 0.3, animationDelay: '1s' }} />

      <button onClick={() => navigate(-1)} className="self-start p-2 -ml-2 rounded-full hover:bg-muted/20" aria-label="Back">
        <ArrowLeft className="w-5 h-5 text-stone-400" />
      </button>

      <motion.img
        src="/cuizin-logo.png"
        alt="CuizIN logo"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="h-10 w-auto mx-auto mt-1"
      />

      <div className="flex-1 flex flex-col justify-center">
        {/* King + Advisors Banner */}
        <MedievalCharacterBanner compact className="mb-4" />

        <div className="text-center mb-5">
          <h1 className="text-xl font-black font-serif text-yellow-500 tracking-wide">
            {mode === 'sign-in' ? 'Return to the Kingdom' : mode === 'forgot-password' ? 'Lost Your Seal?' : 'Pledge Your Allegiance'}
          </h1>
          <p className="text-[11px] text-muted-foreground mt-1 italic">
            {mode === 'sign-in' 
              ? 'The throne awaits your return, noble warrior' 
              : mode === 'forgot-password' 
                ? "We shall dispatch a raven with your new seal" 
                : 'Join the Royal Court and begin your quest for glory'}
          </p>
        </div>

        {/* Parchment form area */}
        <form onSubmit={submit} className="space-y-3">
          {mode === 'sign-up' && (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose thy warrior name"
              className="w-full rounded-xl px-4 py-3 parchment-card text-sm font-medium placeholder:text-stone-500 outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Royal dispatch address (email)"
            className="w-full rounded-xl px-4 py-3 parchment-card text-sm font-medium placeholder:text-stone-500 outline-none focus:ring-2 focus:ring-primary/50"
          />
          {mode !== 'forgot-password' && (
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Secret passphrase" minLength={6}
              className="w-full rounded-xl px-4 py-3 parchment-card text-sm font-medium placeholder:text-stone-500 outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}
          
          {mode === 'sign-in' && (
            <div className="text-right px-1">
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-[11px] text-amber-500/70 hover:text-amber-400 italic"
              >
                Lost thy passphrase?
              </button>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            type="submit"
            className="w-full rounded-2xl py-3.5 medieval-btn disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            {loading ? '…' : mode === 'sign-in' ? 'Enter the Kingdom' : mode === 'forgot-password' ? 'Send the Raven' : 'Take the Oath'}
          </motion.button>
        </form>

        {mode === 'forgot-password' ? (
          <button
            onClick={() => setMode('sign-in')}
            className="mt-5 text-sm text-muted-foreground hover:text-amber-500 italic text-center"
          >
            ← Return to the gates
          </button>
        ) : (
          <button
            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            className="mt-5 text-[12px] text-muted-foreground text-center"
          >
            {mode === 'sign-in' 
              ? <span>New to the realm? <span className="text-amber-500 font-bold">Pledge allegiance</span></span>
              : <span>Already sworn? <span className="text-amber-500 font-bold">Enter the gates</span></span>}
          </button>
        )}
      </div>

      {/* Banner ad */}
      <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
        <TopBannerAd />
      </div>
    </div>
  );
}