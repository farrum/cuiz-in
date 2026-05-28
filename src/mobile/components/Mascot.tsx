import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Mood = 'happy' | 'celebrating' | 'thinking' | 'sad' | 'idle';

const moodEmoji: Record<Mood, string> = {
  happy: '😄',
  celebrating: '🥳',
  thinking: '🤔',
  sad: '😟',
  idle: '🙂',
};

export function Mascot({ mood = 'happy', size = 80, className }: { mood?: Mood; size?: number; className?: string }) {
  return (
    <motion.div
      className={cn('relative inline-flex items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
      animate={
        mood === 'celebrating'
          ? { y: [0, -8, 0, -4, 0], rotate: [0, -8, 8, -4, 0] }
          : mood === 'idle'
          ? { y: [0, -3, 0] }
          : { y: [0, -2, 0] }
      }
      transition={{ duration: mood === 'celebrating' ? 0.8 : 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* glow */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-purple-400/30 to-pink-400/30 blur-xl"
        animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      <div className="relative" style={{ fontSize: size * 0.7 }}>{moodEmoji[mood]}</div>
    </motion.div>
  );
}

export default Mascot;