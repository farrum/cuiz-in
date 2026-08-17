import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { Shield } from 'lucide-react';

const SLIDES = [
  {
    portrait: '/medieval/king.png',
    name: 'The King',
    accent: 'text-amber-600',
    borderColor: 'border-amber-400/50',
    title: 'Welcome to the Kingdom',
    text: 'You have been summoned to the Royal Court. Prove your wisdom to rise through the ranks and claim the throne.',
  },
  {
    portrait: '/medieval/socrates.png',
    name: 'Socrates',
    accent: 'text-sky-600',
    borderColor: 'border-sky-400/50',
    title: 'Your Council Awaits',
    text: 'Four legendary advisors stand ready to aid your quest. Unlock their powers with shards earned through conquest.',
  },
  {
    portrait: '/medieval/chanakya.png',
    name: 'Chanakya',
    accent: 'text-rose-600',
    borderColor: 'border-rose-400/50',
    title: 'Conquer Campaigns',
    text: 'March across historical battlefields. Each conquest earns stars, gems, and glory for your kingdom.',
  },
  {
    portrait: '/medieval/ramanujan.png',
    name: 'Ramanujan',
    accent: 'text-purple-600',
    borderColor: 'border-purple-400/50',
    title: 'Rise to the Throne',
    text: 'Complete quests, unlock mystery chests, and ascend the leaderboard to become Emperor of all knowledge.',
  },
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
    <div className="fixed inset-0 flex flex-col px-6">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)' }} />

      <motion.img
        src="/cuizin-logo.png"
        alt="CuizIN logo"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="h-10 w-auto mx-auto relative z-10"
        style={{ marginTop: 'calc(env(safe-area-inset-top, 0px) + 24px)' }}
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            className="flex flex-col items-center max-w-xs"
          >
            <div className="relative">
              <div className={`relative w-28 h-28 rounded-2xl overflow-hidden border-4 bg-white/50 shadow-lg ${slide.borderColor}`}>
                <img
                  src={slide.portrait}
                  alt={slide.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Character name */}
              <p className={`text-[10px] font-black tracking-[0.2em] uppercase mt-2.5 ${slide.accent}`}>
                {slide.name}
              </p>
            </div>

            {/* Glass text card */}
            <div className="mt-5 bg-white/80 ring-1 ring-black/[0.06] rounded-2xl px-5 py-4 max-w-[280px] shadow-sm">
              <h1 className="text-lg font-black mb-2 text-slate-800 tracking-tight">{slide.title}</h1>
              <p className="text-[12px] leading-relaxed text-slate-500 font-semibold">{slide.text}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators */}
        <div className="mt-8 flex gap-2">
          {SLIDES.map((_, j) => (
            <motion.div
              key={j}
              className={`transition-all ${j === i ? 'scale-110' : 'opacity-35'}`}
            >
              <Shield className={`w-4 h-4 ${j === i ? 'text-amber-500 fill-amber-500/20' : 'text-slate-400'}`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action button */}
      <div className="pb-8 relative z-10">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          className="w-full rounded-2xl py-3.5 font-black text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))',
            boxShadow: '0 4px 0 hsl(30 80% 35%), 0 6px 20px hsl(45 70% 50% / 0.35)',
          }}
        >
          <Shield className="w-4 h-4" />
          {i < SLIDES.length - 1 ? 'Continue' : "Enter the Kingdom"}
        </motion.button>
      </div>
    </div>
  );
}