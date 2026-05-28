import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { getRandomQuestion } from '@/utils/quizData';
import type { QuizQuestion } from '@/utils/types';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { MascotPlayer } from '@/mobile/mascots/MascotPlayer';
import { characterOfTheDay } from '@/mobile/mascots/registry';
import { moodEngine } from '@/mobile/mascots/useMoodEngine';

export function TrueFalseGame() {
  const haptics = useHaptics();
  const [q, setQ] = useState<QuizQuestion | null>(null);
  const [score, setScore] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, 0, 200], [0.4, 1, 0.4]);

  const load = async () => { try { setQ(await getRandomQuestion()); } catch {} };
  useEffect(() => { load(); }, []);

  // Treat first option as "True" claim for swipe demo
  const handleSwipe = (right: boolean) => {
    haptics(right ? 'success' : 'medium');
    setScore((s) => s + (right ? 1 : 0));
    moodEngine.recordAnswer(right);
    load();
  };

  if (!q) return <div className="text-center text-muted-foreground py-10">Loading…</div>;

  const claim = `${q.question} — Answer: "${q.options[0]}"`;

  return (
    <div className="flex flex-col items-center pt-4">
      <p className="text-sm text-muted-foreground mb-4">Score: <strong className="text-foreground">{score}</strong></p>
      <motion.div
        drag="x" dragConstraints={{ left: 0, right: 0 }} style={{ x, rotate, opacity }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 120) handleSwipe(true);
          else if (info.offset.x < -120) handleSwipe(false);
        }}
        className="w-72 rounded-3xl bg-card border border-border p-6 shadow-xl cursor-grab active:cursor-grabbing"
      >
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{q.category}</p>
        <p className="font-bold text-lg mb-4">{claim}</p>
        <MascotPlayer character={characterOfTheDay()} mood={moodEngine.snapshot().lastMood} size={64} noHalo />
      </motion.div>
      <div className="flex gap-8 mt-8">
        <button onClick={() => handleSwipe(false)} className="w-14 h-14 rounded-full bg-destructive/15 text-destructive text-2xl font-bold">✕</button>
        <button onClick={() => handleSwipe(true)} className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 text-2xl font-bold">✓</button>
      </div>
      <p className="text-xs text-muted-foreground mt-4">Swipe right = True · left = False</p>
    </div>
  );
}