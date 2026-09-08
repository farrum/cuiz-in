import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Shield, Scroll, Calendar, Loader2, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { NativeBannerAd } from '../../ads/NativeBannerAd';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Button } from '@/components/ui/button';

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  category?: string;
  reward_multiplier?: number;
  reward_points?: number;
}

export default function DailyChallengeStoryScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();

  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompletedToday, setIsCompletedToday] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Check local completion flag
    const localDone = localStorage.getItem(`daily_challenge_completed_${today}`) === 'true';
    if (localDone) {
      setIsCompletedToday(true);
    }

    // 2. Fetch challenge data & verify server progress
    const fetchChallenge = async () => {
      try {
        const { data, error } = await supabase
          .from('daily_challenges' as any)
          .select('*')
          .lte('start_date', today)
          .gte('end_date', today)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setChallenge(data as DailyChallenge);
        }

        // Check user completion from Supabase
        const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (userId) {
          const { data: progress } = await supabase
            .from('user_challenge_progress')
            .select('completed')
            .eq('user_id', userId)
            .eq('challenge_id', 'daily-' + today)
            .maybeSingle();

          if (progress?.completed) {
            setIsCompletedToday(true);
            localStorage.setItem(`daily_challenge_completed_${today}`, 'true');
          }
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
    const params = new URLSearchParams({ mode: 'daily' });
    if (challenge?.category) params.set('category', challenge.category);
    navigate(`/quiz?${params.toString()}`);
  };

  const rewardMultiplier = challenge?.reward_multiplier ?? 2;

  return (
    <div
      className="fixed inset-0 flex flex-col justify-between overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--shell-bg, hsl(38 65% 94%))',
        paddingTop: 'var(--safe-top, 0px)',
      }}
    >
      {/* Top Header */}
      <div className="relative z-20 px-4 pt-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/hub')}
          aria-label="Close"
          className="p-2 rounded-xl bg-amber-900/5 hover:bg-amber-900/10 active:scale-95 transition-all text-amber-900"
          style={{ border: '1px solid rgba(180,140,60,0.25)' }}
        >
          <X className="w-5 h-5 text-amber-900/80" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
          <Calendar className="w-3.5 h-3.5 text-amber-700" />
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 font-serif">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="w-9" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {/* King Mascot */}
          <Mascot
            mood={isCompletedToday ? 'celebrating' : 'cheer'}
            size={105}
            className="mx-auto mb-3 drop-shadow-sm"
          />

          {/* Title */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scroll className="w-5 h-5 text-amber-600" />
            <h1 className="text-2xl font-black tracking-tight text-amber-950 font-serif">
              Royal Decree
            </h1>
          </div>

          <p className="text-xs text-amber-900/60 font-semibold mb-5 uppercase tracking-widest font-serif">
            Official Daily Crown Challenge
          </p>

          {/* Decree Parchment Card */}
          <div
            className="rounded-3xl p-5 mb-5 text-left relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, hsl(40 70% 97%) 0%, hsl(36 55% 93%) 100%)',
              border: '1px solid rgba(180,140,60,0.28)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 6px 20px rgba(120,80,20,0.09)',
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                <span className="ml-2.5 text-xs font-black text-amber-900/70">Unrolling royal scroll...</span>
              </div>
            ) : isCompletedToday ? (
              <div className="text-center py-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-base font-black text-amber-950 font-serif mb-1">
                  Decree Accomplished Today
                </h3>
                <p className="text-xs text-amber-900/70 font-semibold leading-relaxed">
                  You have fulfilled today’s Royal Decree and collected your 2× bounties. The King prepares a fresh challenge for tomorrow!
                </p>
              </div>
            ) : challenge ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/20">
                    {challenge.category || 'Imperial Lore'}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-600 text-white font-serif">
                    5 Questions
                  </span>
                </div>

                <h2 className="font-black text-base text-amber-950 font-serif mb-1.5 leading-snug">
                  {challenge.title}
                </h2>
                <p className="text-xs text-amber-900/70 font-semibold leading-relaxed mb-4">
                  {challenge.description}
                </p>

                <div className="pt-3 border-t border-amber-800/15 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/60">
                    Decree Bounty
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-700 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/25 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {rewardMultiplier}× Gems
                    </span>
                    <span className="text-xs font-black text-orange-700 bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/25">
                      Shield Active
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/20">
                    Knowledge Trial
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-600 text-white font-serif">
                    5 Questions
                  </span>
                </div>

                <h2 className="font-black text-base text-amber-950 font-serif mb-1.5 leading-snug">
                  Curated Royal Trial
                </h2>
                <p className="text-xs text-amber-900/70 font-semibold leading-relaxed mb-4">
                  Prove your wisdom across 5 diverse questions to earn double treasure and maintain your kingdom honor.
                </p>

                <div className="pt-3 border-t border-amber-800/15 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/60">
                    Decree Bounty
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-700 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/25 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> 2× Gems
                    </span>
                    <span className="text-xs font-black text-orange-700 bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/25">
                      Streak Safe
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Button */}
          {isCompletedToday ? (
            <Button
              onClick={() => navigate('/hub')}
              className="w-full py-6 font-black uppercase text-sm rounded-2xl text-white shadow-md active:scale-[0.98] transition-all"
              style={{
                background: 'linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                boxShadow: '0 4px 0 hsl(30 80% 35%)',
              }}
            >
              👑 Return to the Keep
            </Button>
          ) : (
            <Button
              disabled={loading}
              onClick={startChallenge}
              className="w-full py-6 font-black uppercase text-sm rounded-2xl text-white shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              style={{
                background: 'linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                boxShadow: '0 4px 0 hsl(30 80% 35%), 0 6px 20px rgba(245,158,11,0.25)',
              }}
            >
              <Shield className="w-4 h-4" />
              <span>Accept Royal Decree (2× Gems)</span>
            </Button>
          )}

          {!isCompletedToday && (
            <button
              onClick={() => navigate('/hub')}
              className="mt-3 text-[11px] font-black uppercase tracking-wider text-amber-900/50 hover:text-amber-900/80 transition-colors"
            >
              Postpone for later
            </button>
          )}
        </motion.div>
      </div>

      {/* Bottom Banner Ad */}
      <NativeBannerAd noMargin />
    </div>
  );
}