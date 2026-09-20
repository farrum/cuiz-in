import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Sparkles, ChevronRight, Play } from 'lucide-react';
import { minigames } from '@/components/gamification/minigamesData';
import { useHaptics } from '@/mobile/hooks/useHaptics';

export const MiniGamesPavilion: React.FC = () => {
  const navigate = useNavigate();
  const haptics = useHaptics();

  const handlePlayGame = (gameId: string) => {
    haptics('medium');
    navigate(`/minigames/${gameId}`);
  };

  return (
    <section className="py-6" aria-labelledby="minigames-pavilion-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 section-divider-shimmer rounded-full" />
          <div className="text-center px-3">
            <span className="text-xs font-black tracking-[0.2em] uppercase text-amber-900/70 block font-cinzel">
              🎮 Arcade Pavilion
            </span>
            <h2 id="minigames-pavilion-heading" className="text-lg md:text-xl font-black text-amber-950 font-cinzel">
              Speed Challenges & Mini-Games
            </h2>
          </div>
          <span className="h-px flex-1 section-divider-shimmer rounded-full" />
        </div>

        {/* 4 Games Grid for Desktop Web */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {minigames.slice(0, 4).map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.35 }}
              whileHover={{ y: -5, scale: 1.01 }}
              className="scroll-paper rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 border-2 border-amber-600/35 shadow-lg hover:shadow-2xl hover:border-amber-500"
            >
              {/* Subtle top shimmer banner */}
              <div 
                className="absolute -top-12 -right-12 w-28 h-28 rounded-full opacity-25 blur-xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }}
              />

              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-3.5xl drop-shadow-md p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">{game.emoji}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30">
                    {game.playCount || '1.8k'} plays
                  </span>
                </div>

                <h3 className="font-cinzel font-black text-base text-amber-950 mb-1.5">
                  {game.name}
                </h3>
                <p className="text-xs text-amber-900/75 line-clamp-2 mb-5 leading-relaxed font-semibold">
                  {game.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handlePlayGame(game.id)}
                className="btn-royal-gold w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Play Challenge
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
