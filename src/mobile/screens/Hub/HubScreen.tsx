import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, Disc3, ScrollText, Swords, ImageIcon } from 'lucide-react';
import { Mascot } from '@/mobile/components/Mascot';
import { GemCounter } from '@/mobile/components/GemCounter';
import { StreakFlame } from '@/mobile/components/StreakFlame';
import { MotivationBubble } from '@/mobile/components/MotivationBubble';
import { useMotivation } from '@/mobile/hooks/useMotivation';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { cn } from '@/lib/utils';

type Node = {
  id: string;
  label: string;
  to: string;
  icon: typeof Calendar;
  color: string;
  hint?: string;
};

const NODES: Node[] = [
  { id: 'quiz', label: 'Quick Quiz', to: '/quiz', icon: Sparkles, color: 'from-primary via-purple-500 to-pink-500', hint: 'Earn 10 gems / correct' },
  { id: 'daily', label: 'Daily Challenge', to: '/daily', icon: Calendar, color: 'from-orange-500 to-red-500', hint: '2x gems today' },
  { id: 'wheel', label: 'Spin Wheel', to: '/game/wheel', icon: Disc3, color: 'from-emerald-400 to-teal-600', hint: '1 free spin / day' },
  { id: 'scratch', label: 'Scratch Card', to: '/game/scratch', icon: ScrollText, color: 'from-amber-400 to-orange-600', hint: 'Mystery gems' },
  { id: 'true-false', label: 'True / False', to: '/game/true-false', icon: Swords, color: 'from-sky-400 to-blue-600', hint: 'Swipe to play' },
  { id: 'image', label: 'Image Trivia', to: '/game/image', icon: ImageIcon, color: 'from-violet-500 to-fuchsia-600', hint: 'Guess the picture' },
];

export default function HubScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const motivation = useMotivation('on_open');
  const { streak } = usePersistentQuizStats();
  const [gems, setGems] = useState<number>(() => Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || 0));
  const [name, setName] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Player');

  useEffect(() => {
    const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!uid) return;
    supabase.from('profiles').select('username, points, gems_balance').eq('id', uid).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const balance = (data as any).gems_balance ?? (data as any).points ?? 0;
          setGems(balance);
          setName((data as any).username || 'Player');
          localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(balance));
        }
      });
  }, []);

  const isLoggedIn = !!localStorage.getItem(STORAGE_KEYS.USER_ID);

  return (
    <div className="relative min-h-full pb-32 px-4 pt-3 overflow-hidden">
      {/* animated background blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-primary/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute top-32 -right-20 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], y: [0, -20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Hello,</p>
          <h1 className="text-xl font-bold leading-tight">{name} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <StreakFlame streak={streak} />
          <GemCounter value={gems} />
        </div>
      </div>

      {/* Mascot + motivation */}
      <div className="relative flex items-end gap-3 mb-6">
        <Mascot mood="happy" size={90} />
        <div className="pb-2">
          <MotivationBubble message={motivation?.text || ''} emoji={motivation?.emoji} />
        </div>
      </div>

      {!isLoggedIn && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => { haptics('medium'); navigate('/login'); }}
          className="w-full mb-6 rounded-2xl p-4 text-left bg-gradient-to-r from-primary to-purple-500 text-primary-foreground shadow-lg"
        >
          <p className="font-bold">Sign in to save your gems</p>
          <p className="text-xs opacity-90">Climb the leaderboard and win monthly prizes.</p>
        </motion.button>
      )}

      {/* Island map of activity nodes */}
      <section className="relative">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Choose your adventure</h2>
        <div className="relative space-y-4">
          {NODES.map((node, i) => {
            const Icon = node.icon;
            const offset = i % 2 === 0 ? 'mr-12' : 'ml-12';
            return (
              <motion.button
                key={node.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 220, damping: 22 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { haptics('medium'); navigate(node.to); }}
                className={cn(
                  'relative w-full flex items-center gap-4 rounded-3xl p-4 text-left bg-card border border-border shadow-md',
                  offset
                )}
              >
                <div className={cn(
                  'flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br',
                  node.color
                )}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base">{node.label}</p>
                  {node.hint && <p className="text-xs text-muted-foreground mt-0.5">{node.hint}</p>}
                </div>
                <motion.span
                  className="text-2xl"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  aria-hidden
                >→</motion.span>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}