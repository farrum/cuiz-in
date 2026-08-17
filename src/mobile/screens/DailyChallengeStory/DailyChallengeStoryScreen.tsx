import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Shield, Scroll } from 'lucide-react';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';

export default function DailyChallengeStoryScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();

  return (
    <div className="fixed inset-0 flex flex-col bg-background p-6">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)' }} />

      <button
        onClick={() => navigate('/hub')}
        aria-label="Close"
        className="self-end p-2 rounded-xl bg-white/80 ring-1 ring-black/[0.06] hover:bg-white transition-colors relative z-10"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <X className="w-5 h-5 text-slate-450" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <Mascot mood="celebrating" size={120} className="mb-6 drop-shadow-sm" />
        <Scroll className="w-8 h-8 text-amber-600 mb-3 drop-shadow-sm" />
        <h1 className="text-2xl font-black mb-3 tracking-tight" style={{ color: 'hsl(30 60% 18%)' }}>
          Daily Royal Decree
        </h1>
        <div className="bg-white/85 ring-1 ring-black/[0.06] shadow-sm p-6 rounded-2xl mb-8 max-w-sm w-full">
          <p className="text-slate-600 text-sm font-semibold leading-relaxed">
            A fresh themed challenge drops every day by order of the King.
            Complete it for <strong className="text-amber-700 font-black">2× gems</strong> and
            bonus streak protection.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { haptics('medium'); navigate('/quiz'); }}
          className="w-full max-w-sm rounded-2xl py-3.5 font-black text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))',
            boxShadow: '0 4px 0 hsl(30 80% 35%), 0 6px 20px hsl(45 70% 50% / 0.35)',
          }}
        >
          <Shield className="w-5 h-5 drop-shadow-sm text-white" />
          Accept Today's Challenge
        </motion.button>
        <p className="text-[10px] font-black text-slate-400 mt-6 uppercase tracking-widest max-w-[200px]">
          Challenge UI is coming.
        </p>
      </div>
    </div>
  );
}