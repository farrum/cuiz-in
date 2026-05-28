import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Calendar } from 'lucide-react';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';

export default function DailyChallengeStoryScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-orange-500/15 via-background to-red-500/15 p-6">
      <button
        onClick={() => navigate('/hub')}
        aria-label="Close"
        className="self-end p-2 rounded-full hover:bg-muted"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <Mascot mood="celebrating" size={120} className="mb-6" />
        <Calendar className="w-6 h-6 text-orange-500 mb-2" />
        <h1 className="text-3xl font-bold mb-2">Daily Challenge</h1>
        <p className="text-muted-foreground max-w-xs mb-8">
          A fresh themed challenge drops every day. Complete it for <strong className="text-amber-600">2x gems</strong> and bonus streak protection.
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { haptics('medium'); navigate('/quiz'); }}
          className="rounded-2xl px-8 py-3.5 font-bold text-primary-foreground bg-gradient-to-r from-orange-500 to-red-500 shadow-lg"
        >
          Play today's challenge
        </motion.button>
        <p className="text-xs text-muted-foreground mt-4">
          Full challenge UI is coming. For now this loads the regular quiz with 2x rewards on the web side.
        </p>
      </div>
    </div>
  );
}