import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { TopBannerAd } from '@/mobile/ads/TopBannerAd';
import { Shield } from 'lucide-react';
import { TorchSparks } from '@/mobile/components/TorchSparks';

const SLIDES = [
  {
    portrait: '/medieval/king.png',
    name: 'The King',
    accent: 'text-yellow-500',
    borderColor: 'border-yellow-500/50',
    title: 'Welcome to the Kingdom',
    text: 'You have been summoned to the Royal Court. Prove your wisdom to rise through the ranks and claim the throne.',
  },
  {
    portrait: '/medieval/socrates.png',
    name: 'Socrates',
    accent: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    title: 'Your Council Awaits',
    text: 'Four legendary advisors stand ready to aid your quest. Unlock their powers with shards earned through conquest.',
  },
  {
    portrait: '/medieval/chanakya.png',
    name: 'Chanakya',
    accent: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    title: 'Conquer Campaigns',
    text: 'March across historical battlefields. Each conquest earns stars, gems, and glory for your kingdom.',
  },
  {
    portrait: '/medieval/ramanujan.png',
    name: 'Ramanujan',
    accent: 'text-purple-400',
    borderColor: 'border-purple-500/40',
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
    <div className="fixed inset-0 flex flex-col stone-wall px-6">
      {/* Torch ambience */}
      <div className="torch-glow-ambient absolute top-16 left-0 animate-wind" style={{ width: 100, height: 100, opacity: 0.3 }}>
        <TorchSparks count={4} />
      </div>
      <div className="torch-glow-ambient absolute top-16 right-0 animate-wind" style={{ width: 100, height: 100, opacity: 0.3, animationDelay: '0.8s' }}>
        <TorchSparks count={4} />
      </div>

      <motion.img
        src="/cuizin-logo.png"
        alt="CuizIN logo"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="h-10 w-auto mx-auto"
        style={{ marginTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            className="flex flex-col items-center max-w-xs scroll-unroll-container"
          >
            {/* Stone archway frame */}
            <div className="relative">
              <div className="absolute -inset-4 castle-archway opacity-30" />
              <div className={`relative w-28 h-28 rounded-2xl overflow-hidden border-[3px] shadow-2xl ${slide.borderColor}`}>
                <img
                  src={slide.portrait}
                  alt={slide.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Character name */}
              <p className={`text-[9px] font-black tracking-[0.2em] uppercase mt-2 ${slide.accent}`}>
                {slide.name}
              </p>
            </div>

            {/* Parchment text card */}
            <div className="mt-5 parchment-card rounded-xl px-5 py-4 max-w-[280px]">
              <h1 className="text-lg font-black font-serif mb-2 text-amber-900">{slide.title}</h1>
              <p className="text-[12px] leading-relaxed text-stone-700">{slide.text}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide shields */}
        <div className="mt-8 flex gap-2">
          {SLIDES.map((_, j) => (
            <motion.div
              key={j}
              className={`transition-all ${j === i ? 'scale-110' : 'opacity-40'}`}
            >
              <Shield className={`w-4 h-4 ${j === i ? 'text-yellow-500 fill-yellow-500/20' : 'text-stone-600'}`} />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="pb-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          className="w-full rounded-2xl py-3.5 medieval-btn flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4" />
          {i < SLIDES.length - 1 ? 'Continue' : "Enter the Kingdom"}
        </motion.button>
      </div>

      {/* Banner ad */}
      <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
        <TopBannerAd />
      </div>
    </div>
  );
}