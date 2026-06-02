import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';

export default function MobileLoginScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { toast } = useToast();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    haptics('medium');
    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const uname = (username || email.split('@')[0]).trim();
        const { data, error } = await supabase.functions.invoke('register-user', {
          body: {
            username: uname,
            displayName: uname,
            email: email.trim(),
            phone: '',
            password,
          },
        });
        if (error || !data?.success) {
          const msg = data?.error || error?.message || 'Registration failed';
          throw new Error(typeof msg === 'string' ? msg : 'Registration failed');
        }
        if (data.access_token && data.refresh_token) {
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
        }
      }
      haptics('success');
      navigate('/hub');
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

      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-6">
          <Mascot mood="happy" size={80} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold">{mode === 'sign-in' ? 'Welcome back' : 'Join CuizIN'}</h1>
          <p className="text-sm text-muted-foreground">{mode === 'sign-in' ? 'Sign in to keep your gems' : 'Start your gem-earning journey'}</p>
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
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" minLength={6}
            className="w-full rounded-xl px-4 py-3 bg-card border border-border focus:border-primary outline-none"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            type="submit"
            className="w-full rounded-2xl py-3.5 font-bold text-primary-foreground bg-gradient-to-r from-primary to-purple-500 shadow-lg disabled:opacity-50"
          >
            {loading ? '…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </motion.button>
        </form>

        <button
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="mt-5 text-sm text-muted-foreground"
        >
          {mode === 'sign-in' ? "No account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}