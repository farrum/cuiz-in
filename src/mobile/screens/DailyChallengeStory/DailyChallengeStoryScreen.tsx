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
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-50" />
      </div>

      <button
        onClick={() => navigate('/hub')}
        aria-label="Close"
        className="self-end p-2 rounded-xl panel-3d bg-white border-2 border-primary/20 hover:bg-muted relative z-10"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <Mascot mood="celebrating" size={120} className="mb-6 drop-shadow-sm" />
        <Scroll className="w-8 h-8 text-primary mb-3 drop-shadow-sm" />
        <h1 className="text-2xl font-black mb-3 text-primary tracking-tight">
          Daily Royal Decree
        </h1>
        <div className="panel-3d bg-white p-6 rounded-2xl mb-8 max-w-sm w-full">
          <p className="text-muted-foreground text-sm font-bold leading-relaxed">
            A fresh themed challenge drops every day by order of the King.
            Complete it for <strong className="text-primary font-black">2× gems</strong> and
            bonus streak protection.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { haptics('medium'); navigate('/quiz'); }}
          className="w-full max-w-sm rounded-xl py-4 btn-3d btn-3d-primary flex items-center justify-center gap-2 uppercase tracking-wide"
        >
          <Shield className="w-5 h-5 drop-shadow-sm" />
          Accept Today's Challenge
        </motion.button>
        <p className="text-[11px] font-black text-muted-foreground/60 mt-6 uppercase tracking-widest max-w-[200px]">
          Full challenge UI is coming.
        </p>
      </div>
    </div>
  );
}