import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MascotPlayer } from './MascotPlayer';
import { CHARACTERS, type Character, type Mood } from './registry';
import { cn } from '@/lib/utils';

interface Props {
  show: boolean;
  mood: Mood;
  message?: string;
  emoji?: string;
  /** sub-heading (e.g. "+10 gems!" / "Not quite") */
  headline?: string;
  headlineClass?: string;
  explanation?: string;
  character?: Character; // optional pin; default random
  size?: number;
}

/** Picks a fresh character on every show, biased away from the last one. */
let lastId: string | null = null;
function rollCharacter(): Character {
  const pool = CHARACTERS.filter((c) => c.id !== lastId);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  lastId = pick.id;
  return pick;
}

export function MascotReveal({ show, mood, message, emoji, headline, headlineClass, explanation, character, size = 96 }: Props) {
  const pinned = useMemo(() => character ?? rollCharacter(), [character, show, mood]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          className="rounded-2xl wooden-door p-4 shadow-xl flex items-start gap-3"
        >
          <MascotPlayer character={pinned} mood={mood} size={size} />
          <div className="flex-1 min-w-0">
            {headline && (
              <p className={cn('font-bold text-base mb-1', headlineClass)}>{headline}</p>
            )}
            {message && (
              <p className="text-sm leading-snug text-stone-200">
                {emoji && <span className="mr-1">{emoji}</span>}{message}
              </p>
            )}
            {explanation && (
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">{explanation}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MascotReveal;