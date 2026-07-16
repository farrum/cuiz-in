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
      className="fixed inset-0 flex flex-col bg-gradient-to-b from-[#f4faff] to-white px-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
    >
      <button onClick={() => navigate(-1)} className="self-start p-2.5 rounded-full bg-white shadow-sm border-2 border-slate-100 hover:bg-slate-50 transition-colors z-10" aria-label="Back">
        <ArrowLeft className="w-5 h-5 text-slate-600" />
      </button>

      <motion.img
        src="/cuizin-logo.png"
        alt="CuizIN logo"
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="h-16 w-auto mx-auto mt-4 mb-4 drop-shadow-md relative z-10"
      />

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black font-serif text-primary tracking-wide drop-shadow-sm">
            {mode === 'sign-in' ? 'Welcome to Cuiz.in' : mode === 'forgot-password' ? 'Lost Your Password?' : 'Create Your Account'}
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-2">
            {mode === 'sign-in' 
              ? 'Jump back in and continue your journey' 
              : mode === 'forgot-password' 
                ? "We'll send you a link to reset your password" 
                : 'Join us and start earning rewards today'}
          </p>
        </div>

        {/* Modern form area */}
        <form onSubmit={submit} className="space-y-4">
          {mode === 'sign-up' && (
            <div>
              <label className="text-[11px] uppercase font-black tracking-wider text-slate-500 block mb-1.5 ml-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a cool username"
                className="w-full rounded-2xl px-5 py-4 bg-white border-2 border-slate-200 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/50 shadow-inner transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-[11px] uppercase font-black tracking-wider text-slate-500 block mb-1.5 ml-1">Email Address</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-2xl px-5 py-4 bg-white border-2 border-slate-200 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/50 shadow-inner transition-colors"
            />
          </div>
          {mode !== 'forgot-password' && (
            <div>
              <label className="text-[11px] uppercase font-black tracking-wider text-slate-500 block mb-1.5 ml-1">Password</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters" minLength={6}
                className="w-full rounded-2xl px-5 py-4 bg-white border-2 border-slate-200 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary/50 shadow-inner transition-colors"
              />
            </div>
          )}
          
          {mode === 'sign-in' && (
            <div className="text-right px-1">
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            type="submit"
            className="w-full rounded-2xl py-4 btn-3d btn-3d-primary disabled:opacity-50 flex items-center justify-center gap-2 mt-2 uppercase tracking-widest text-[13px]"
          >
            {loading ? 'Processing...' : mode === 'sign-in' ? 'Login' : mode === 'forgot-password' ? 'Send Reset Link' : 'Create Account'}
          </motion.button>
        </form>

        {mode === 'forgot-password' ? (
          <button
            onClick={() => setMode('sign-in')}
            className="mt-6 text-sm font-bold text-slate-500 hover:text-primary transition-colors text-center w-full"
          >
            ← Back to Login
          </button>
        ) : (
          <button
            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            className="mt-6 text-[13px] font-semibold text-slate-500 text-center w-full"
          >
            {mode === 'sign-in' 
              ? <span>Don't have an account? <span className="text-primary font-black">Sign Up</span></span>
              : <span>Already have an account? <span className="text-primary font-black">Login</span></span>}
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