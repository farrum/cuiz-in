import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

export function StreakFlame({ streak }: { streak: number }) {
  const isHot = streak >= 3;
  return (
    <motion.div
      whileTap={{ scale: 0.9, rotate: -8 }}
      className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/40"
    >
      <motion.div
        animate={isHot ? { scale: [1, 1.15, 1], rotate: [-3, 3, -3] } : {}}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        <Flame className={`w-4 h-4 ${isHot ? 'text-orange-500' : 'text-muted-foreground'}`} />
      </motion.div>
      <span className="text-sm font-bold tabular-nums">{streak}</span>
    </motion.div>
  );
}

export default StreakFlame;