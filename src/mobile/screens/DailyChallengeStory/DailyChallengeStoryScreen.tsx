/**
 * DailyChallengeStoryScreen — wires the Daily Challenge route to the actual
 * QuizStoryScreen with a special `daily` mode search param.
 *
 * The admin can create daily challenges via the admin panel. This screen
 * fetches today's challenge category/tag and passes it to the quiz engine.
 * If no daily challenge exists, falls back to a general themed quiz.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Shield, Scroll, Calendar, Loader2 } from 'lucide-react';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { NativeBannerAd } from '../../ads/NativeBannerAd';
import { supabase } from '@/integrations/supabase/client';

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  category?: string;
  reward_multiplier?: number;
}

export default function DailyChallengeStoryScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();

  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        // Fetch today's daily challenge from the database
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const { data, error } = await supabase
          .from('daily_challenges' as any)
          .select('*')
          .lte('starts_at', today)
          .gte('ends_at', today)
          .eq('active', true)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setChallenge(data as DailyChallenge);
        }
      } catch (e) {
        console.warn('[DailyChallenge] fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenge();
  }, []);

  const startChallenge = () => {
    haptics('medium');
    // Navigate to quiz engine with daily mode — QuizStoryScreen handles the daily category
    const params = new URLSearchParams({ mode: 'daily' });
    if (challenge?.category) params.set('category', challenge.category);
    navigate(`/quiz?${params.toString()}`);
  };

  const rewardMultiplier = challenge?.reward_multiplier ?? 2;

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        backgroundColor: 'var(--shell-bg, hsl(38 65% 94%))',
        background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)',
        paddingTop: 'var(--safe-top, 0px)',
      }}
    >
      {/* Close button */}
      <button
        onClick={() => navigate('/hub')}
        aria-label="Close"
        className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 ring-1 ring-black/[0.06] hover:bg-white transition-colors z-10"
        style={{ top: 'calc(var(--safe-top, 0px) + 12px)' }}
      >
        <X className="w-5 h-5 text-slate-500" />
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <Mascot mood="celebrating" size={110} className="mx-auto mb-5 drop-shadow-sm" />

          {/* Date badge */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700/60">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Scroll className="w-6 h-6 text-amber-600 drop-shadow-sm" />
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'hsl(30 60% 18%)' }}>
              Daily Royal Decree
            </h1>
          </div>

          {/* Challenge card */}
          <div
            className="rounded-2xl p-5 mb-6 text-left"
            style={{
              background: 'linear-gradient(145deg, hsl(40 70% 97%) 0%, hsl(36 55% 93%) 100%)',
              border: '1px solid rgba(180,140,60,0.22)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 16px rgba(120,80,20,0.10)',
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                <span className="ml-2 text-sm font-semibold text-amber-700/60">Loading today's challenge...</span>
              </div>
            ) : challenge ? (
              <>
                <p className="font-black text-sm text-amber-800 uppercase tracking-wide mb-1.5">
                  {challenge.title}
                </p>
                <p className="text-sm text-amber-800/60 font-semibold leading-relaxed">
                  {challenge.description}
                </p>
                {challenge.category && (
                  <span className="inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                    {challenge.category}
                  </span>
                )}
              </>
            ) : (
              <p className="text-sm text-amber-800/60 font-semibold leading-relaxed">
                A fresh themed challenge from the King awaits.
                Complete it for{' '}
                <strong className="text-amber-700 font-black">{rewardMultiplier}× gems</strong>{' '}
                and bonus streak protection.
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-200/60">
              <span className="text-[10px] font-black uppercase tracking-wide text-amber-700/50">Reward:</span>
              <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {rewardMultiplier}× Gems
              </span>
              <span className="text-[11px] font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
                Streak Shield
              </span>
            </div>
          </div>

          {/* Start button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={startChallenge}
            className="w-full rounded-2xl py-3.5 font-black text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 48%))',
              boxShadow: '0 4px 0 hsl(30 80% 35%), 0 6px 20px hsl(45 70% 50% / 0.35)',
            }}
          >
            <Shield className="w-5 h-5 drop-shadow-sm" />
            Accept Today's Challenge
          </motion.button>

          <button
            onClick={() => navigate('/hub')}
            className="mt-3 text-[11px] font-bold text-amber-700/40 uppercase tracking-widest"
          >
            Return to Keep
          </button>
        </motion.div>
      </div>

      <NativeBannerAd noMargin />
    </div>
  );
}