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
            className="fixed inset-0 z-[800] bg-black/60 backdrop-blur-sm"
            onClick={onDismiss}
          />

          {/* Centered Modal Container */}
          <div 
            className="fixed inset-0 z-[801] flex items-center justify-center p-4 pointer-events-none"
            style={{
              paddingBottom: 'calc(var(--safe-bottom, 0px) + 64px)',
              paddingTop: 'calc(var(--safe-top, 0px) + 12px)',
            }}
          >
            <motion.div
              key="tribute-modal"
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              className="pointer-events-auto w-full max-w-[316px]"
            >
              <div
                className="rounded-3xl overflow-hidden shadow-2xl"
                style={{
                  background: 'linear-gradient(160deg, hsl(38 75% 98%) 0%, hsl(36 60% 93%) 100%)',
                  border: '1px solid rgba(180,140,60,0.32)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.85) inset, 0 16px 48px rgba(120,80,20,0.3)',
                }}
              >
                {/* Header band */}
                <div
                  className="relative px-4 pt-4 pb-2.5 text-center"
                  style={{
                    background: 'linear-gradient(135deg, hsl(38 88% 50%) 0%, hsl(30 92% 44%) 100%)',
                  }}
                >
                  <button
                    onClick={onDismiss}
                    aria-label="Dismiss"
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/25 active:scale-95 flex items-center justify-center transition-transform"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>

                  <Crown className="w-5 h-5 text-amber-100 mx-auto mb-1 drop-shadow" />
                  <h2 className="text-[13px] font-black uppercase tracking-widest text-white drop-shadow-sm">
                    Daily Royal Tribute
                  </h2>
                  <p className="text-amber-100/85 text-[10px] font-semibold tracking-wide">
                    Your loyalty has been recorded
                  </p>
                </div>

                {/* Body */}
                <div className="px-4 py-3">
                  {/* Mascot */}
                  <div className="flex justify-center mb-2">
                    <Mascot mood="celebrating" size={54} />
                  </div>

                  {/* Streak row */}
                  <div className="flex items-center justify-center gap-1 mb-2.5">
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
                              'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                              isToday ? 'star-burst' : '',
                              filled
                                ? 'bg-amber-400 shadow-sm shadow-amber-400/40 ring-1 ring-amber-500/50'
                                : 'bg-amber-100/70 border border-amber-200/80',
                            ].join(' ')}
                          >
                            {filled ? (
                              <Star
                                className={['w-3.5 h-3.5', isToday ? 'text-white' : 'text-amber-700'].join(' ')}
                                fill="currentColor"
                              />
                            ) : (
                              <Star className="w-3.5 h-3.5 text-amber-300" />
                            )}
                          </div>
                          <span className="text-[8px] font-black text-amber-800/60 tracking-wider">{label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reward display */}
                  <div
                    className="rounded-xl px-3 py-2 mb-3 text-center"
                    style={{
                      background: 'linear-gradient(135deg, hsl(45 95% 96%) 0%, hsl(38 80% 92%) 100%)',
                      border: '1px solid rgba(180,140,60,0.22)',
                    }}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-2xl font-black text-amber-700">+{rewardStars}</span>
                      <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                    </div>
                    <p className="text-[10px] font-bold text-amber-800/70 mt-0.5">
                      Day {streak} Streak Reward
                      {streak === 7 ? ' — GRAND BONUS! 🎉' : ''}
                    </p>
                  </div>

                  {/* Claim button */}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={onClaim}
                    className="w-full rounded-xl py-2.5 font-black text-xs uppercase tracking-wider text-white flex items-center justify-center gap-1.5"
                    style={{
                      background: 'linear-gradient(135deg, hsl(45 95% 54%) 0%, hsl(30 90% 46%) 100%)',
                      boxShadow: '0 3px 0 hsl(30 80% 32%), 0 5px 16px hsl(45 70% 50% / 0.3)',
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Claim Tribute
                  </motion.button>

                  <button
                    onClick={onDismiss}
                    className="w-full mt-1.5 py-1 text-[10px] font-bold text-amber-800/50 hover:text-amber-800/80 tracking-widest uppercase transition-colors"
                  >
                    Claim Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
