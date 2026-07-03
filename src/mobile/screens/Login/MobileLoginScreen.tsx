import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Mascot } from '@/mobile/components/Mascot';
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
          title: 'Email Sent',
          description: 'Check your inbox for the password reset link.',
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
          throw new Error('Username is already taken');
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
      toast({ title: 'Oops', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col bg-gradient-to-br from-background via-background to-primary/10 px-6"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
    >
      <button onClick={() => navigate(-1)} className="self-start p-2 -ml-2 rounded-full hover:bg-muted" aria-label="Back">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <motion.img
        src="/cuizin-logo.png"
        alt="CuizIN logo"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="h-12 w-auto mx-auto mt-2"
      />

      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-6">
          {/* Kings & Advisors Royal Assembly Lineup */}
          <div className="relative h-28 w-full flex items-center justify-center mb-6 mt-2 select-none overflow-visible">
            {/* Left outer: Socrates */}
            <div className="absolute left-[calc(50%-100px)] bottom-2 transform -translate-x-1/2 scale-75 opacity-60 z-0 bg-slate-900 border border-slate-800 text-cyan-400 p-2 rounded-2xl flex flex-col items-center shadow-md">
              <span className="text-xl">🏛️</span>
              <span className="text-[7px] uppercase font-black tracking-wider mt-0.5">Socrates</span>
            </div>

            {/* Left inner: Aryabhata */}
            <div className="absolute left-[calc(50%-55px)] bottom-3 transform -translate-x-1/2 scale-90 opacity-80 z-10 bg-slate-900 border border-slate-800 text-amber-400 p-2 rounded-2xl flex flex-col items-center shadow-md">
              <span className="text-xl">📐</span>
              <span className="text-[7px] uppercase font-black tracking-wider mt-0.5">Aryabhata</span>
            </div>

            {/* Center Front: The King */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 scale-110 z-25 bg-[#fcf6ea] border-2 border-[#d4af37] text-slate-950 p-2.5 rounded-3xl shadow-xl flex flex-col items-center animate-[bounce_3s_infinite] shadow-yellow-500/10">
              <span className="text-3xl select-none">👑</span>
              <span className="text-[8px] uppercase font-black tracking-widest text-[#78350f] mt-0.5">The King</span>
            </div>

            {/* Right inner: Chanakya */}
            <div className="absolute left-[calc(50%+55px)] bottom-3 transform -translate-x-1/2 scale-90 opacity-80 z-10 bg-slate-900 border border-slate-800 text-rose-400 p-2 rounded-2xl flex flex-col items-center shadow-md">
              <span className="text-xl">📜</span>
              <span className="text-[7px] uppercase font-black tracking-wider mt-0.5">Chanakya</span>
            </div>

            {/* Right outer: Ramanujan */}
            <div className="absolute left-[calc(50%+100px)] bottom-2 transform -translate-x-1/2 scale-75 opacity-60 z-0 bg-slate-900 border border-slate-800 text-purple-400 p-2 rounded-2xl flex flex-col items-center shadow-md">
              <span className="text-xl">🧠</span>
              <span className="text-[7px] uppercase font-black tracking-wider mt-0.5">Ramanujan</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold">
            {mode === 'sign-in' ? 'Welcome back' : mode === 'forgot-password' ? 'Forgot Password?' : 'Join CuizIN'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'sign-in' 
              ? 'Sign in to keep your gems' 
              : mode === 'forgot-password' 
                ? "Enter your email and we'll send you a reset link" 
                : 'Start your gem-earning journey'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'sign-up' && (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-xl px-4 py-3 bg-card border border-border focus:border-primary outline-none"
            />
          )}
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl px-4 py-3 bg-card border border-border focus:border-primary outline-none"
          />
          {mode !== 'forgot-password' && (
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" minLength={6}
              className="w-full rounded-xl px-4 py-3 bg-card border border-border focus:border-primary outline-none"
            />
          )}
          
          {mode === 'sign-in' && (
            <div className="text-right px-1">
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            type="submit"
            className="w-full rounded-2xl py-3.5 font-bold text-primary-foreground bg-gradient-to-r from-primary to-purple-500 shadow-lg disabled:opacity-50"
          >
            {loading ? '…' : mode === 'sign-in' ? 'Sign in' : mode === 'forgot-password' ? 'Send reset link' : 'Create account'}
          </motion.button>
        </form>

        {mode === 'forgot-password' ? (
          <button
            onClick={() => setMode('sign-in')}
            className="mt-5 text-sm text-muted-foreground hover:underline"
          >
            Back to Sign in
          </button>
        ) : (
          <button
            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            className="mt-5 text-sm text-muted-foreground"
          >
            {mode === 'sign-in' ? "No account? Sign up" : "Already have an account? Sign in"}
          </button>
        )}
      </div>

      {/* Rotating banner ad */}
      <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
        <TopBannerAd />
      </div>
    </div>
  );
}