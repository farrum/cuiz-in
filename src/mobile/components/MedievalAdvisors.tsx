import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Advisor {
  id: string;
  name: string;
  title: string;
  portrait: string;
  emoji: string;
  accentColor: string;
  borderColor: string;
  glowColor: string;
  ability: string;
  quotes: string[];
}

export const ADVISORS: Advisor[] = [
  {
    id: 'socrates',
    name: 'Socrates',
    title: 'The Philosopher',
    portrait: '/medieval/socrates.png',
    emoji: '🏛️',
    accentColor: 'from-cyan-500 to-teal-600',
    borderColor: 'border-cyan-500/40',
    glowColor: 'rgba(6,182,212,0.15)',
    ability: '50/50 Lifeline',
    quotes: [
      '"The only true wisdom is in knowing you know nothing."',
      '"An unexamined question is not worth answering."',
      '"I can guide thee — but two paths shall remain."',
    ],
  },
  {
    id: 'aryabhata',
    name: 'Aryabhata',
    title: 'The Mathematician',
    portrait: '/medieval/aryabhata.png',
    emoji: '📐',
    accentColor: 'from-amber-500 to-yellow-600',
    borderColor: 'border-amber-500/40',
    glowColor: 'rgba(245,158,11,0.15)',
    ability: 'Skip Question',
    quotes: [
      '"Numbers speak truths that words cannot."',
      '"Let calculation guide thy next move."',
      '"A wise warrior knows when to retreat."',
    ],
  },
  {
    id: 'chanakya',
    name: 'Chanakya',
    title: 'The Strategist',
    portrait: '/medieval/chanakya.png',
    emoji: '📜',
    accentColor: 'from-rose-500 to-red-600',
    borderColor: 'border-rose-500/40',
    glowColor: 'rgba(244,63,94,0.15)',
    ability: 'Audience Poll',
    quotes: [
      '"Before you act, consider the counsel of the masses."',
      '"A king who listens to all, falls to none."',
      '"Strategy without knowledge is but a gamble."',
    ],
  },
  {
    id: 'ramanujan',
    name: 'Ramanujan',
    title: 'The Genius',
    portrait: '/medieval/ramanujan.png',
    emoji: '🧠',
    accentColor: 'from-purple-500 to-violet-600',
    borderColor: 'border-purple-500/40',
    glowColor: 'rgba(139,92,246,0.15)',
    ability: 'Extra Time',
    quotes: [
      '"An equation has no meaning unless it expresses the thought of God."',
      '"Time bends for those who see beyond."',
      '"I shall grant thee a moment more, use it wisely."',
    ],
  },
];

interface MedievalAdvisorsProps {
  compact?: boolean;
  onAdvisorTap?: (advisor: Advisor) => void;
}

export function MedievalAdvisors({ compact = false, onAdvisorTap }: MedievalAdvisorsProps) {
  const [activeSpeech, setActiveSpeech] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleTap = (advisor: Advisor) => {
    const quote = advisor.quotes[Math.floor(Math.random() * advisor.quotes.length)];
    setActiveSpeech(quote);
    setActiveId(advisor.id);
    if (onAdvisorTap) onAdvisorTap(advisor);

    setTimeout(() => {
      setActiveSpeech(null);
      setActiveId(null);
    }, 3500);
  };

  return (
    <div className="relative">
      {/* Speech bubble */}
      <AnimatePresence>
        {activeSpeech && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            className="absolute -top-24 z-30 max-w-[200px] w-max -translate-x-1/2"
            style={{
              left: activeId === 'socrates' ? '12.5%' : 
                    activeId === 'aryabhata' ? '37.5%' : 
                    activeId === 'chanakya' ? '62.5%' : '87.5%'
            }}
          >
            <div className="parchment-card rounded-xl px-3 py-2 text-[10px] sm:text-[11px] italic leading-snug text-center shadow-xl border border-amber-800/40">
              {activeSpeech}
            </div>
            <div className="w-3 h-3 bg-[#e2ccad] border border-amber-800/40 rotate-45 mx-auto -mt-1.5 border-t-0 border-l-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advisor cards */}
      <div className={cn(
        "grid gap-3.5",
        compact ? "grid-cols-4" : "grid-cols-2"
      )}>
        {ADVISORS.map((advisor, i) => {
          const level = Number(localStorage.getItem(`hero_${advisor.id}_level`) || '0');
          const shards = Number(localStorage.getItem(`hero_${advisor.id}_shards`) || '0');
          const shardsNeeded = (level + 1) * 10;
          const shardPercent = Math.min((shards / shardsNeeded) * 100, 100);
          const isActive = activeId === advisor.id;

          return (
            <motion.button
              key={advisor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTap(advisor)}
              className={cn(
                "relative flex flex-col items-center rounded-2xl overflow-hidden transition-all duration-300",
                compact ? "p-3" : "p-4",
                "iron-frame",
                isActive && "ring-2 ring-amber-500/50"
              )}
              style={{ background: `linear-gradient(180deg, hsl(28 15% 11%) 0%, hsl(25 18% 8%) 100%)` }}
            >
              {/* Ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(circle at 50% 30%, ${advisor.glowColor}, transparent 70%)` }}
              />

              {/* Portrait */}
              <div className={cn(
                "relative z-10 rounded-xl overflow-hidden border-2 shadow-lg",
                advisor.borderColor,
                compact ? "w-16 h-16" : "w-20 h-20"
              )}>
                <img
                  src={advisor.portrait}
                  alt={advisor.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Level badge */}
                <div className="absolute -bottom-0.5 inset-x-0 bg-black/70 text-center">
                  <span className="text-[8px] font-black text-yellow-400 tracking-wider">
                    LV.{level}
                  </span>
                </div>
              </div>

              {/* Name & title */}
              <div className={cn("relative z-10 text-center", compact ? "mt-1.5" : "mt-2.5")}>
                <p className={cn(
                  "font-black text-amber-100 leading-tight font-serif",
                  compact ? "text-[10px]" : "text-[12px]"
                )}>
                  {advisor.name}
                </p>
                {!compact && (
                  <p className="text-[10px] text-stone-400 mt-0.5 italic">
                    {advisor.title}
                  </p>
                )}
              </div>

              {/* Shard progress bar */}
              {!compact && (
                <div className="relative z-10 w-full mt-2">
                  <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full bg-gradient-to-r", advisor.accentColor)}
                      initial={{ width: 0 }}
                      animate={{ width: `${shardPercent}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                    />
                  </div>
                  <p className="text-[8px] text-muted-foreground mt-0.5 text-center">
                    {shards}/{shardsNeeded} shards
                  </p>
                </div>
              )}

              {/* Ability tag */}
              {!compact && (
                <div className={cn(
                  "relative z-10 mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase",
                  "bg-primary/10 text-primary border border-primary/20"
                )}>
                  {advisor.ability}
                </div>
              )}

              {/* Breathing animation */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ opacity: [0, 0.05, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
                style={{ background: `radial-gradient(circle, ${advisor.glowColor}, transparent)` }}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
