/**
 * DailyTributeModal — extracted from HubScreen to its own focused component.
 *
 * Fixes:
 *  - No 800 ms delay: shows immediately when canClaim is true (user already
 *    waited for the profile fetch)
 *  - Only shows once per calendar day (enforced by dailyTributeService)
 *  - Never produces a white background — renders on top of an already-painted Hub
 *  - Premium tribute-modal-in entrance animation from index.css
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Flame, Crown, X, Sparkles } from 'lucide-react';
import { Mascot } from '@/mobile/components/Mascot';

interface DailyTributeModalProps {
  show: boolean;
  streak: number;
  rewardStars: number;
  onClaim: () => void;
  onDismiss: () => void;
}

const DAY_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export function DailyTributeModal({ show, streak, rewardStars, onClaim, onDismiss }: DailyTributeModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            key="tribute-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[800] bg-black/55"
            onClick={onDismiss}
          />

          {/* Modal card */}
          <motion.div
            key="tribute-modal"
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed z-[801] inset-x-5"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            <div
              className="rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(160deg, hsl(38 75% 97%) 0%, hsl(36 60% 92%) 100%)',
                border: '1px solid rgba(180,140,60,0.28)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.8) inset, 0 20px 60px rgba(120,80,20,0.25)',
              }}
            >
              {/* Header band */}
              <div
                className="relative px-5 pt-5 pb-3 text-center"
                style={{
                  background: 'linear-gradient(135deg, hsl(38 85% 50%) 0%, hsl(30 90% 45%) 100%)',
                }}
              >
                <button
                  onClick={onDismiss}
                  aria-label="Dismiss"
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/20 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>

                <Crown className="w-7 h-7 text-amber-100 mx-auto mb-1.5 drop-shadow" />
                <h2 className="text-base font-black uppercase tracking-widest text-white drop-shadow-sm">
                  Daily Royal Tribute
                </h2>
                <p className="text-amber-100/80 text-[11px] font-semibold tracking-wide mt-0.5">
                  Your loyalty has been recorded
                </p>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                {/* Mascot */}
                <div className="flex justify-center mb-3">
                  <Mascot mood="celebrating" size={80} />
                </div>

                {/* Streak row */}
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  {DAY_LABELS.map((label, i) => {
                    const filled = i < streak;
                    const isToday = i === streak - 1;
                    return (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-0.5"
                        style={{
                          animationDelay: `${i * 60}ms`,
                        }}
                      >
                        <div
                          className={[
                            'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                            isToday ? 'star-burst' : '',
                            filled
                              ? 'bg-amber-400 shadow-md shadow-amber-400/40'
                              : 'bg-amber-100 border border-amber-200',
                          ].join(' ')}
                        >
                          {filled ? (
                            <Star
                              className={['w-4 h-4', isToday ? 'text-white' : 'text-amber-600'].join(' ')}
                              fill="currentColor"
                            />
                          ) : (
                            <Star className="w-4 h-4 text-amber-300" />
                          )}
                        </div>
                        <span className="text-[9px] font-black text-amber-700/60 tracking-wider">{label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Reward display */}
                <div
                  className="rounded-2xl p-3 mb-4 text-center"
                  style={{
                    background: 'linear-gradient(135deg, hsl(45 95% 96%) 0%, hsl(38 80% 92%) 100%)',
                    border: '1px solid rgba(180,140,60,0.2)',
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-3xl font-black text-amber-700">+{rewardStars}</span>
                    <Star className="w-5 h-5 text-amber-500" fill="currentColor" />
                  </div>
                  <p className="text-[11px] font-semibold text-amber-700/70 mt-0.5">
                    Day {streak} Streak Reward
                    {streak === 7 ? ' — GRAND BONUS! 🎉' : ''}
                  </p>
                </div>

                {/* Claim button */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onClaim}
                  className="w-full rounded-2xl py-3.5 font-black text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, hsl(45 95% 55%) 0%, hsl(30 90% 48%) 100%)',
                    boxShadow: '0 4px 0 hsl(30 80% 35%), 0 6px 20px hsl(45 70% 50% / 0.35)',
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Claim Tribute
                </motion.button>

                <button
                  onClick={onDismiss}
                  className="w-full mt-2.5 py-2 text-[11px] font-bold text-amber-700/50 tracking-widest uppercase"
                >
                  Claim Later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
