import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react';
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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    haptics('medium');
    try {
      if (mode === 'forgot-password') {
        let resetEmail = identifier.trim();
        if (!resetEmail.includes('@')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', resetEmail)
            .maybeSingle();

          if (!profile?.email) {
            throw new Error('Username not found. Please enter your registered email address.');
          }
          resetEmail = profile.email;
        }

        const redirectUrl = `https://cuiz.in/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: redirectUrl,
        });
        if (error) throw error;
        toast({
          title: 'Raven Sent',
          description: 'Check your inbox for the password reset scroll.',
        });
        setMode('sign-in');
      } else if (mode === 'sign-in') {
        let loginEmail = identifier.trim();

        if (!loginEmail.includes('@')) {
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('email, id, username, display_name')
            .ilike('username', loginEmail)
            .maybeSingle();

          if (profileErr || !profile?.email) {
            throw new Error('Username not found. Please check your username or use your email address.');
          }
          loginEmail = profile.email;
        }

        const { data: authData, error } = await supabase.auth.signInWithPassword({ 
          email: loginEmail, 
          password 
        });
        
        if (error) throw error;

        if (authData?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', authData.user.id)
            .maybeSingle();

          localStorage.setItem('cuizin_user_id', authData.user.id);
          localStorage.setItem('cuizin_username', prof?.display_name || prof?.username || identifier);
        }

        haptics('success');
        navigate('/hub');
      } else {
        const inputEmail = email.trim();
        const uname = (username || inputEmail.split('@')[0]).trim();
        
        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', uname)
          .maybeSingle();

        if (existingUser) {
          throw new Error('That username is already claimed by another warrior');
        }

        // Create standard credentials account
        const { data, error } = await supabase.auth.signUp({
          email: inputEmail,
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
      const msg = err.message || 'The kingdom gates refused entry';
      setErrorMessage(msg);
      haptics('error');
      toast({ title: 'Alas!', description: msg, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div
      className="w-full flex-1 flex flex-col bg-gradient-to-b from-[#f4faff] to-white px-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed overflow-x-hidden"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      <button onClick={() => navigate(-1)} className="self-start p-2 rounded-full bg-white shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors z-10 shrink-0" aria-label="Back">
        <ArrowLeft className="w-4 h-4 text-slate-600" />
      </button>

      <div className="w-full max-w-sm mx-auto flex flex-col flex-1 justify-start pt-1 pb-4 relative z-10">
        <motion.img
          src="/cuizin-logo.png"
          alt="CuizIN logo"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-10 w-auto mx-auto mb-1 drop-shadow-sm shrink-0"
        />

        <div className="text-center mb-3">
          <h1 className="text-xl font-black font-serif text-primary tracking-wide">
            {mode === 'sign-in' ? 'Welcome to Cuiz.in' : mode === 'forgot-password' ? 'Lost Your Password?' : 'Create Account'}
          </h1>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
            {mode === 'sign-in' 
              ? 'Enter your Username or Email' 
              : mode === 'forgot-password' 
                ? "Enter your username or email to reset password" 
                : 'Start earning rewards today'}
          </p>
        </div>

        {/* Modern compact form area */}
        <form onSubmit={submit} className="space-y-2.5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}

          {mode === 'sign-up' && (
            <>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1 ml-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-300 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary shadow-sm transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1 ml-1">Email Address</label>
                <input
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-300 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary shadow-sm transition-colors"
                />
              </div>
            </>
          )}

          {mode !== 'sign-up' && (
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1 ml-1">Username or Email</label>
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter username or email"
                className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-300 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary shadow-sm transition-colors"
              />
            </div>
          )}

          {mode !== 'forgot-password' && (
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1 ml-1">Password</label>
              <input
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                minLength={6}
                className="w-full rounded-xl px-4 py-2.5 bg-white border border-slate-300 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary shadow-sm transition-colors"
              />
            </div>
          )}
          
          {mode === 'sign-in' && (
            <div className="text-right px-1">
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            type="submit"
            className="w-full rounded-xl py-3 btn-3d btn-3d-primary disabled:opacity-50 flex items-center justify-center gap-2 mt-1 uppercase tracking-wider text-xs font-black"
          >
            {loading ? 'Processing...' : mode === 'sign-in' ? 'Login' : mode === 'forgot-password' ? 'Send Reset Link' : 'Create Account'}
          </motion.button>
        </form>

        {mode === 'forgot-password' ? (
          <button
            onClick={() => setMode('sign-in')}
            className="mt-4 text-xs font-bold text-slate-500 hover:text-primary transition-colors text-center w-full"
          >
            ← Back to Login
          </button>
        ) : (
          <button
            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            className="mt-4 text-xs font-semibold text-slate-500 text-center w-full"
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