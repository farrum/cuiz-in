import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';

const SLIDES = [
  { emoji: '💎', title: 'Earn gems', text: 'Answer questions, build streaks, watch your gem stash grow.' },
  { emoji: '🔥', title: 'Daily streaks', text: 'Show up every day, multiply your rewards.' },
  { emoji: '👑', title: 'Climb the ranks', text: 'Top the monthly leaderboard and win real prizes.' },
  { emoji: '🎉', title: 'Mini-games galore', text: 'Spin wheels, scratch cards, true-or-false swipes & more.' },
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];

  const next = () => {
    haptics('light');
    if (i < SLIDES.length - 1) setI(i + 1);
    else { localStorage.setItem('mobile_onboarded', '1'); navigate('/hub'); }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-primary/15 via-background to-purple-500/15 px-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          >
            <div className="text-8xl mb-4">{slide.emoji}</div>
            <h1 className="text-3xl font-bold mb-2">{slide.title}</h1>
            <p className="text-muted-foreground max-w-xs">{slide.text}</p>
          </motion.div>
        </AnimatePresence>
        <Mascot mood="happy" size={70} className="mt-10" />
      </div>

      <div className="pb-10">
        <div className="flex justify-center gap-1.5 mb-6">
          {SLIDES.map((_, j) => (
            <span
              key={j}
              className={`h-1.5 rounded-full transition-all ${j === i ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`}
            />
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          className="w-full rounded-2xl py-3.5 font-bold text-primary-foreground bg-gradient-to-r from-primary to-purple-500 shadow-lg"
        >
          {i < SLIDES.length - 1 ? 'Next' : "Let's go!"}
        </motion.button>
      </div>
    </div>
  );
}