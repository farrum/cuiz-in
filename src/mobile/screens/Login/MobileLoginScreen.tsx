import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';
import { trackGuestEvent } from '@/utils/guestAnalytics';
import { EmberBackground } from '@/mobile/components/EmberBackground';
import { NativeBannerAd } from '@/mobile/ads/NativeBannerAd';
import { cn } from '@/lib/utils';

// ── Animated input field with focus glow ─────────────────────────────────────
function Field({
  label, id, type = 'text', value, onChange, placeholder, required, minLength, autoCapitalize, autoCorrect,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string; required?: boolean;
  minLength?: number; autoCapitalize?: string; autoCorrect?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const isPassword = type === 'password';
  const inputType  = isPassword && showPw ? 'text' : type;

  return (
    <div>
      <label htmlFor={id} className="text-[9px] uppercase font-black tracking-wider text-amber-900/50 block mb-1 ml-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minLength={minLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'w-full rounded-2xl px-4 py-3 bg-white/85 text-xs font-bold text-slate-800',
            'placeholder:text-slate-400 outline-none transition-all duration-200',
            isPassword ? 'pr-11' : '',
          )}
          style={{
            border: `1.5px solid ${focused ? 'hsl(38 85% 55%)' : 'rgba(0,0,0,0.09)'}`,
            boxShadow: focused
              ? '0 0 0 3px rgba(255,180,40,0.25), 0 2px 10px rgba(255,160,0,0.12)'
              : '0 1px 4px rgba(0,0,0,0.06)',
          }}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Mode tab indicator ────────────────────────────────────────────────────────
function ModeTabs({ mode, setMode }: { mode: 'sign-in' | 'sign-up'; setMode: (m: 'sign-in' | 'sign-up') => void }) {
  return (
    <div className="relative flex gap-0 bg-black/[0.06] rounded-2xl p-1 mb-5">
      {(['sign-in', 'sign-up'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={cn(
            'flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-colors relative z-10',
            mode === m ? 'text-amber-900' : 'text-slate-500',
          )}
        >
          {m === 'sign-in' ? 'Sign In' : 'Sign Up'}
          {mode === m && (
            <motion.div
              layoutId="mode-tab-pill"
              className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

export default function MobileLoginScreen() {
  const navigate = useNavigate();
  const haptics  = useHaptics();
  const { toast } = useToast();
  const uid = useId();
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'forgot-password'>('sign-in');
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [username,   setUsername]   = useState('');
  const [email,      setEmail]      = useState('');
  const [loading,    setLoading]    = useState(false);
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
            .from('profiles').select('email').ilike('username', resetEmail).maybeSingle();
          if (!profile?.email) throw new Error('Username not found. Please enter your registered email address.');
          resetEmail = profile.email;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: 'https://cuiz.in/reset-password',
        });
        if (error) throw error;
        toast({ title: 'Raven Sent', description: 'Check your inbox for the password reset scroll.' });
        setMode('sign-in');
      } else if (mode === 'sign-in') {
        let loginEmail = identifier.trim();
        if (!loginEmail.includes('@')) {
          const { data: profile, error: profileErr } = await supabase
            .from('profiles').select('email, id, username, display_name').ilike('username', loginEmail).maybeSingle();
          if (profileErr || !profile?.email) throw new Error('Username not found. Please check your username or use your email address.');
          loginEmail = profile.email;
        }
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
        if (error) throw error;
        if (authData?.user) {
          const { data: prof } = await supabase.from('profiles').select('username, display_name').eq('id', authData.user.id).maybeSingle();
          localStorage.setItem('cuizin_user_id', authData.user.id);
          localStorage.setItem('cuizin_username', prof?.username || identifier);
        }
        haptics('success');
        navigate('/hub');
      } else {
        const inputEmail = email.trim();
        const uname = (username || inputEmail.split('@')[0]).trim();
        const { data, error } = await supabase.functions.invoke('register-user', {
          body: { username: uname, displayName: uname, email: inputEmail, phone: '', password },
        });
        if (error || !data?.success) {
          let message = data?.error || error?.message || 'Registration failed. Please try again.';
          try {
            const context = (error as { context?: { json?: () => Promise<{ error?: string }> } } | null)?.context;
            if (context?.json) { const body = await context.json(); if (body?.error) message = body.error; }
          } catch { /* Keep error */ }
          throw new Error(message);
        }
        if (!data.access_token || !data.refresh_token) throw new Error('Account created, but login could not start. Please sign in.');
        const { error: sessionError } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
        if (sessionError) throw new Error('Account created, but login could not start. Please sign in.');
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
    <div className="w-full min-h-screen flex flex-col relative overflow-hidden living-sky"
      style={{
        background: 'linear-gradient(160deg, hsl(38 65% 94%), hsl(30 75% 88%), hsl(24 60% 86%), hsl(210 45% 92%), hsl(38 65% 94%))',
      }}
    >
      {/* Ember atmosphere — same as Hub */}
      <EmberBackground count={14} />

      {/* Radial glow behind the form card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(255,200,80,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Back button */}
      <div className="shrink-0 px-5 pt-3 pb-1 relative z-10" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/80 ring-1 ring-black/[0.06] hover:bg-white shadow-sm transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4 text-slate-650" />
        </motion.button>
      </div>

      {/* Form area */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 relative z-10 flex items-center">
        <div className="w-full max-w-sm mx-auto flex flex-col">

          {/* Logo — dramatic reveal with golden flare */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="relative flex justify-center mb-5"
          >
            <motion.div
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,200,60,0.45) 0%, transparent 65%)' }}
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <img src="/cuizin-logo.png" alt="CuizIN logo" className="h-12 w-auto drop-shadow-md relative z-10" />
          </motion.div>

          {/* Glassmorphic card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 20, delay: 0.1 }}
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(255, 251, 240, 0.88)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1.5px solid rgba(212,170,60,0.25)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 0 rgba(255,255,255,0.7) inset',
            }}
          >
            <div className="px-6 pt-6 pb-5">

              {/* Mode tabs (sign-in / sign-up only) */}
              {mode !== 'forgot-password' && (
                <ModeTabs
                  mode={mode as 'sign-in' | 'sign-up'}
                  setMode={(m) => { setMode(m); setErrorMessage(null); }}
                />
              )}

              <AnimatePresence mode="wait">
                <motion.form
                  key={mode}
                  onSubmit={submit}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  className="w-full flex flex-col gap-3"
                >
                  {/* Title (for forgot-password mode) */}
                  {mode === 'forgot-password' && (
                    <div className="text-center mb-1">
                      <h1 className="text-lg font-black text-slate-800 tracking-wide">Lost Your Password?</h1>
                      <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Enter your username or email to reset</p>
                    </div>
                  )}

                  {/* Error banner */}
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span className="leading-tight">{errorMessage}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Fields */}
                  {mode === 'sign-up' && (
                    <>
                      <Field id={`${uid}-username`} label="Username" value={username} onChange={setUsername} placeholder="Choose a username" required />
                      <Field id={`${uid}-email`}    label="Email Address" type="email" value={email} onChange={setEmail} placeholder="name@example.com" required />
                    </>
                  )}
                  {mode !== 'sign-up' && (
                    <Field id={`${uid}-identifier`} label="Username or Email" value={identifier} onChange={setIdentifier} placeholder="Enter username or email" required autoCapitalize="none" autoCorrect="off" />
                  )}
                  {mode !== 'forgot-password' && (
                    <Field id={`${uid}-password`} label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required minLength={6} />
                  )}

                  {mode === 'sign-in' && (
                    <div className="text-right -mt-1 px-1">
                      <button
                        type="button"
                        onClick={() => setMode('forgot-password')}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit button with ripple */}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    disabled={loading}
                    type="submit"
                    className="w-full rounded-2xl py-3.5 text-white flex items-center justify-center gap-2 mt-1 uppercase tracking-wider text-xs font-black shadow-md disabled:opacity-50 relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                      boxShadow: '0 3.5px 0 hsl(30 80% 35%), 0 6px 20px hsl(45 70% 50% / 0.35)',
                    }}
                  >
                    {/* Shimmer sweep on the button */}
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)' }}
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      {loading
                        ? <><Shield className="w-4 h-4 animate-spin" /><span>Processing…</span></>
                        : mode === 'sign-in' ? '⚔️ Enter the Realm'
                        : mode === 'forgot-password' ? '📜 Send Reset Scroll'
                        : '🛡️ Create Account'}
                    </span>
                  </motion.button>
                </motion.form>
              </AnimatePresence>

              {/* Mode switch link */}
              {mode === 'forgot-password' ? (
                <button
                  onClick={() => setMode('sign-in')}
                  className="mt-4 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors text-center w-full"
                >
                  ← Back to Login
                </button>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>

      <NativeBannerAd />
    </div>
  );
}