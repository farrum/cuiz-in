import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  CHARACTER_MAP,
  type Character,
  type CharacterId,
  type Mood,
  spriteForMood,
} from './registry';

interface Props {
  character: CharacterId | Character;
  mood?: Mood;
  size?: number;
  className?: string;
  /** Hide the colored halo behind the sprite. */
  noHalo?: boolean;
}

/** Motion variants per mood — sprites are reused, motion sells the emotion. */
const variants: Record<Mood, any> = {
  cheer:   { y: [0, -6, 0], rotate: [0, -3, 3, 0],         transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } },
  excited: { y: [0, -12, 0], scale: [1, 1.06, 1],          transition: { duration: 0.55, repeat: Infinity, ease: 'easeOut' } },
  hype:    { y: [0, -18, 0], rotate: [0, -10, 10, -6, 0], scale: [1, 1.1, 1], transition: { duration: 0.55, repeat: Infinity } },
  forgive: { scale: [0.7, 1.15, 1], rotate: [0, 8, -8, 0], transition: { duration: 0.9, ease: 'backOut' } },
  neutral: { y: [0, -3, 0],                               transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
  sad:     { y: [0, 2, 0],                                transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  upset:   { x: [0, -3, 3, -3, 3, 0],                     transition: { duration: 0.45, repeat: Infinity, repeatDelay: 1.2 } },
  angry:   { x: [0, -5, 5, -5, 5, 0], rotate: [0, -2, 2, 0], transition: { duration: 0.4, repeat: Infinity, repeatDelay: 0.6 } },
};

export function MascotPlayer({ character, mood = 'neutral', size = 96, className, noHalo }: Props) {
  const char = typeof character === 'string' ? CHARACTER_MAP[character] : character;
  const src = char.sprites[spriteForMood(mood)];
  const isAngry = mood === 'angry';
  const isHype = mood === 'hype' || mood === 'excited';

  const haloClass = useMemo(() => {
    if (isAngry) return 'from-red-500/50 to-orange-500/30';
    if (isHype) return 'from-amber-300/60 to-pink-400/40';
    if (mood === 'sad' || mood === 'upset') return 'from-blue-400/30 to-slate-500/20';
    return char.accent;
  }, [char, mood, isAngry, isHype]);

  return (
    <div className={cn('relative inline-flex items-center justify-center select-none', className)} style={{ width: size, height: size }}>
      {!noHalo && (
        <motion.div
          aria-hidden
          className={cn('absolute inset-0 rounded-full blur-2xl bg-gradient-to-br', haloClass)}
          animate={{ scale: isHype ? [0.9, 1.25, 0.9] : [0.95, 1.1, 0.95], opacity: [0.55, 0.95, 0.55] }}
          transition={{ duration: isHype ? 0.9 : 2.4, repeat: Infinity }}
        />
      )}
      <motion.img
        key={char.id + ':' + mood}
        src={src}
        alt={char.name + ' ' + mood}
        width={size}
        height={size}
        draggable={false}
        loading="lazy"
        className="relative w-full h-full object-contain drop-shadow-lg"
        animate={variants[mood]}
      />
      {isHype && (
        <motion.div
          aria-hidden
          className="absolute -top-2 -right-1 text-2xl"
          animate={{ y: [0, -8, 0], rotate: [0, 20, -10, 0], opacity: [1, 0.6, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >✨</motion.div>
      )}
      {isAngry && (
        <motion.div
          aria-hidden
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl"
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >💢</motion.div>
      )}
    </div>
  );
}

export default MascotPlayer;