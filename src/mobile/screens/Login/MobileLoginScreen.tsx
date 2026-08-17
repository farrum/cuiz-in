import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';
import { trackGuestEvent } from '@/utils/guestAnalytics';

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
          localStorage.setItem('cuizin_username', prof?.username || identifier);
        }

        haptics('success');
        navigate('/hub');
      } else {
        const inputEmail = email.trim();
        const uname = (username || inputEmail.split('@')[0]).trim();

        const { data, error } = await supabase.functions.invoke('register-user', {
          body: {
            username: uname,
            displayName: uname,
            email: inputEmail,
            phone: '',
            password,
          },
        });

        if (error || !data?.success) {
          let message = data?.error || error?.message || 'Registration failed. Please try again.';
          try {
            const context = (error as { context?: { json?: () => Promise<{ error?: string }> } } | null)?.context;
            if (context?.json) {
              const body = await context.json();
              if (body?.error) message = body.error;
            }
          } catch {
            // Keep error
          }
          throw new Error(message);
        }

        if (!data.access_token || !data.refresh_token) {
          throw new Error('Account created, but login could not start. Please sign in.');
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        if (sessionError) {
          throw new Error('Account created, but login could not start. Please sign in.');
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
    <div className="w-full min-h-screen flex flex-col relative overflow-hidden">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)' }} />

      {/* Back button */}
      <div className="shrink-0 px-5 pt-3 pb-1 relative z-10" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/80 ring-1 ring-black/[0.06] hover:bg-white shadow-sm transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4 text-slate-650" />
        </button>
      </div>

      {/* Form area */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 relative z-10 flex items-center">
        <div className="w-full max-w-sm mx-auto flex flex-col">
          <motion.img
            src="/cuizin-logo.png"
            alt="CuizIN logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-10 w-auto mx-auto mb-2 drop-shadow-sm shrink-0"
          />

          <div className="text-center mb-4">
            <h1 className="text-xl font-black text-slate-800 tracking-wide">
              {mode === 'sign-in' ? 'Welcome to Cuiz.in' : mode === 'forgot-password' ? 'Lost Your Password?' : 'Create Account'}
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {mode === 'sign-in'
                ? 'Enter your Username or Email'
                : mode === 'forgot-password'
                  ? 'Enter your username or email to reset password'
                  : 'Start earning rewards today'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {mode === 'sign-up' && (
              <>
                <div>
                  <label className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-1 ml-1">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full rounded-2xl px-4 py-2.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 shadow-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-1 ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl px-4 py-2.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 shadow-sm transition-colors"
                  />
                </div>
              </>
            )}

            {mode !== 'sign-up' && (
              <div>
                <label className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-1 ml-1">Username or Email</label>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                  className="w-full rounded-2xl px-4 py-2.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 shadow-sm transition-colors"
                />
              </div>
            )}

            {mode !== 'forgot-password' && (
              <div>
                <label className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-1 ml-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  minLength={6}
                  className="w-full rounded-2xl px-4 py-2.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 shadow-sm transition-colors"
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
              className="w-full rounded-2xl py-3.5 text-white flex items-center justify-center gap-2 mt-2.5 uppercase tracking-wider text-xs font-black shadow-md disabled:opacity-50"
              style={{
                background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                boxShadow: '0 3.5px 0 hsl(30 80% 35%)'
              }}
            >
              {loading ? 'Processing...' : mode === 'sign-in' ? 'Login' : mode === 'forgot-password' ? 'Send Reset Link' : 'Create Account'}
            </motion.button>
          </form>

          {mode === 'forgot-password' ? (
            <button
              onClick={() => setMode('sign-in')}
              className="mt-4 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors text-center w-full"
            >
              ← Back to Login
            </button>
          ) : (
            <button
              onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
              className="mt-4 text-xs font-semibold text-slate-500 text-center w-full"
            >
              {mode === 'sign-in'
                ? <span>Don't have an account? <span className="text-amber-600 font-black">Sign Up</span></span>
                : <span>Already have an account? <span className="text-amber-600 font-black">Login</span></span>}
            </button>
          )}
        </div>
      </div>

      {/* Persistent native banner spacer instead of duplicate mount */}
      <div aria-hidden className="h-[var(--banner-h)] shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
    </div>
  );
}