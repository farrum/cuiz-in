import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MascotPlayer } from './MascotPlayer';
import { CHARACTERS, type Character, type Mood, type CharacterId } from './registry';
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

function getRoyalDialogue(characterId: CharacterId, mood: Mood): { text: string; emoji: string } {
  const isPositive = ['cheer', 'excited', 'hype', 'forgive'].includes(mood) || mood === 'neutral';
  
  const dialogs: Record<CharacterId, { correct: { text: string; emoji: string }[]; wrong: { text: string; emoji: string }[] }> = {
    queen: {
      correct: [
        { text: "Splendidly done, my champion. Your intellect shines like the crown jewels.", emoji: "👑" },
        { text: "Ah, such grace! You make victory look effortless, my sweet champion.", emoji: "💖" }
      ],
      wrong: [
        { text: "Fret not, my brave soul. Even the grandest empires have their rainy days.", emoji: "🌸" },
        { text: "My heart aches to see you stumble, but I know you will rise again.", emoji: "✨" }
      ]
    },
    princess: {
      correct: [
        { text: "A perfect answer! You make my heart flutter with your wisdom, noble hero!", emoji: "💝" },
        { text: "Magnificent! I knew you would solve this riddle just for me!", emoji: "🎀" }
      ],
      wrong: [
        { text: "Oh dear... that wasn't it, but I still believe in your noble spirit!", emoji: "🥺" },
        { text: "Don't worry, my hero! You will conquer the next challenge, I just know it!", emoji: "💖" }
      ]
    },
    king: {
      correct: [
        { text: "By my decree, a flawless victory! The treasury rejoices!", emoji: "🦁" },
        { text: "Superb execution! You bring great honor to the royal crest.", emoji: "🏰" }
      ],
      wrong: [
        { text: "A momentary lapse in strategy. Stand tall, double your resolve!", emoji: "🛡️" },
        { text: "The battlefield demands focus. Learn from this defeat and push forward.", emoji: "👑" }
      ]
    },
    prince: {
      correct: [
        { text: "Ha! A crushing blow to the quiz. That's how a true heir wins!", emoji: "⚡" },
        { text: "Flawless. You fight with the fire of a dragon. Keep striking!", emoji: "🔥" }
      ],
      wrong: [
        { text: "Weakness has no place in our ranks. Dust yourself off and fight harder!", emoji: "🗡️" },
        { text: "A minor setback. Failure is just training for the ultimate victory!", emoji: "⛓️" }
      ]
    },
    knight: {
      correct: [
        { text: "Victory is ours! Honor and glory guide your hand, soldier!", emoji: "⚔️" },
        { text: "A masterclass in combat. Your focus is an inspiration to the garrison.", emoji: "🛡️" }
      ],
      wrong: [
        { text: "Shields up! Defeat is merely an opportunity to steel your armor.", emoji: "🛡️" },
        { text: "Keep your eyes on the enemy! We retreat, we regroup, and we win!", emoji: "⚔️" }
      ]
    },
    baron: {
      correct: [
        { text: "A profitable venture. That answer pays handsomely in gold and gems.", emoji: "💎" },
        { text: "Excellent calculations. Efficiency is the key to conquering these lands.", emoji: "💰" }
      ],
      wrong: [
        { text: "That mistake will cost us resources. Refocus before we lose the campaign!", emoji: "📉" },
        { text: "A sloppy move. Recalibrate your tactics or we will lose our commission.", emoji: "💼" }
      ]
    }
  };

  const characterDialogs = dialogs[characterId] || dialogs.king;
  const pool = isPositive ? characterDialogs.correct : characterDialogs.wrong;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function MascotReveal({ show, mood, message, emoji, headline, headlineClass, explanation, character, size = 96 }: Props) {
  const pinned = useMemo(() => character ?? rollCharacter(), [character, show, mood]);
  const royalDial = useMemo(() => getRoyalDialogue(pinned.id, mood), [pinned, mood]);

  const displayMessage = royalDial.text;
  const displayEmoji = royalDial.emoji;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-xl flex items-start gap-3.5 border-2 border-amber-500/60"
          style={{
            boxShadow: '0 6px 0 rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(245,158,11,0.2)',
          }}
        >
          <div className="shrink-0 rounded-xl overflow-hidden bg-amber-100/80 dark:bg-amber-950/80 p-1 border border-amber-300/80 dark:border-amber-600/50 shadow-sm">
            <MascotPlayer character={pinned} mood={mood} size={size} />
          </div>
          <div className="flex-1 min-w-0">
            {headline && (
              <p className={cn('font-black text-base mb-1 text-emerald-600 dark:text-emerald-400 drop-shadow-sm', headlineClass)}>{headline}</p>
            )}
            {displayMessage && (
              <p className="text-sm font-black leading-snug text-slate-900 dark:text-white">
                {displayEmoji && <span className="mr-1">{displayEmoji}</span>}{displayMessage}
              </p>
            )}
            {explanation && (
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2 leading-relaxed bg-amber-50/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-amber-200/50 dark:border-slate-700/60">
                {explanation}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MascotReveal;