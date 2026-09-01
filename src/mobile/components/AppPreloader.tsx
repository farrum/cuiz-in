import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';

interface AppPreloaderProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export function AppPreloader({ onComplete, minDurationMs = 2600 }: AppPreloaderProps) {
  const [progress, setProgress] = useState(15);
  const [stepText, setStepText] = useState('Connecting to Realm...');

  useEffect(() => {
    // Step 1
    const t1 = setTimeout(() => {
      setProgress(45);
      setStepText('Warming up Challenges & Quests...');
    }, minDurationMs * 0.3);

    // Step 2
    const t2 = setTimeout(() => {
      setProgress(85);
      setStepText('Preparing Rewards & Defense...');
    }, minDurationMs * 0.65);

    // Step 3
    const t3 = setTimeout(() => {
      setProgress(100);
      setStepText('Entering Kingdom...');
    }, minDurationMs * 0.9);

    // Complete
    const tComplete = setTimeout(() => {
      onComplete();
    }, minDurationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tComplete);
    };
  }, [minDurationMs, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0c0a09] text-white select-none px-6"
      style={{
        paddingTop: 'var(--safe-top, 0px)',
        paddingBottom: 'var(--safe-bottom, 0px)',
      }}
    >
      {/* Background ambient gold aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Medieval Shield Crest Icon with gentle glow */}
      <div className="relative mb-6">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-900/40 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10 backdrop-blur-sm"
        >
          <Shield className="w-10 h-10 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        </motion.div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1 -right-1 text-amber-300"
        >
          <Sparkles className="w-5 h-5" />
        </motion.div>
      </div>

      {/* Brand Title */}
      <h1 className="text-2xl font-black tracking-wider text-amber-200 uppercase drop-shadow-md mb-1 font-serif">
        CuizIN
      </h1>
      <p className="text-xs text-amber-400/80 font-medium tracking-wide uppercase mb-8">
        The Realm of Knowledge
      </p>

      {/* Progress Bar Container */}
      <div className="w-full max-w-xs space-y-2.5">
        <div className="w-full h-1.5 bg-stone-800/80 rounded-full overflow-hidden border border-amber-500/20 p-0.5">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.6)]"
            initial={{ width: '10%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Dynamic Status Text */}
        <div className="flex justify-between items-center text-[11px] text-stone-400 px-1">
          <span className="truncate pr-2">{stepText}</span>
          <span className="font-mono text-amber-400/90 shrink-0">{progress}%</span>
        </div>
      </div>
    </motion.div>
  );
}

export default AppPreloader;
