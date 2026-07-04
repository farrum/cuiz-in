import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Shield, Scroll } from 'lucide-react';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';

export default function DailyChallengeStoryScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();

  return (
    <div className="fixed inset-0 flex flex-col stone-wall p-6">
      {/* Torch ambience */}
      <div className="torch-glow-ambient absolute top-12 left-0" style={{ width: 100, height: 100, opacity: 0.3 }} />
      <div className="torch-glow-ambient absolute top-12 right-0" style={{ width: 100, height: 100, opacity: 0.3, animationDelay: '0.8s' }} />

      <button
        onClick={() => navigate('/hub')}
        aria-label="Close"
        className="self-end p-2 rounded-xl iron-frame hover:bg-stone-800/60"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <X className="w-5 h-5 text-stone-300" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <Mascot mood="celebrating" size={120} className="mb-6" />
        <Scroll className="w-6 h-6 text-amber-500 mb-2" />
        <h1
          className="text-2xl font-bold mb-2 text-amber-400"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Daily Royal Decree
        </h1>
        <p className="text-stone-400 max-w-xs mb-8 text-sm leading-relaxed">
          A fresh themed challenge drops every day by order of the King.
          Complete it for <strong className="text-amber-500">2× gems</strong> and
          bonus streak protection.
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { haptics('medium'); navigate('/quiz'); }}
          className="rounded-2xl px-8 py-3.5 medieval-btn flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Accept Today's Challenge
        </motion.button>
        <p className="text-[10px] text-stone-600 mt-4 uppercase tracking-wider">
          Full challenge UI is coming. For now this loads the regular quest with 2× rewards.
        </p>
      </div>
    </div>
  );
}