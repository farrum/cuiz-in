import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MascotPlayer } from '@/mobile/mascots/MascotPlayer';
import { CHARACTERS } from '@/mobile/mascots/registry';
import { useHaptics } from '@/mobile/hooks/useHaptics';

const SLIDES = [
  { character: 'gemmy' as const, mood: 'cheer'   as const, title: 'Hi! I’m Gemmy.', text: 'Answer questions, build streaks, watch your gem stash grow.' },
  { character: 'foxy'  as const, mood: 'excited' as const, title: 'Daily streaks',   text: 'Show up every day to multiply your rewards. Don’t leave us hanging!' },
  { character: 'owlie' as const, mood: 'cheer'   as const, title: 'Climb the ranks', text: 'Top the monthly leaderboard and win real prizes — I’ll be cheering.' },
  { character: 'draco' as const, mood: 'hype'    as const, title: 'Mini-games galore', text: 'Spin wheels, scratch cards, swipe true/false — your whole crew is waiting.' },
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
            className="flex flex-col items-center"
          >
            <MascotPlayer character={slide.character} mood={slide.mood} size={180} />
            <h1 className="text-3xl font-bold mt-4 mb-2">{slide.title}</h1>
            <p className="text-muted-foreground max-w-xs">{slide.text}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-8 flex gap-2 opacity-60">
          {CHARACTERS.slice(0, 8).map((c, idx) => (
            <MascotPlayer key={c.id} character={c} mood={idx === i % 4 ? 'cheer' : 'neutral'} size={28} noHalo />
          ))}
        </div>
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