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

        {/* 3 Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {minigames.slice(0, 3).map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.35 }}
              whileHover={{ y: -4 }}
              className="scroll-paper rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
            >
              {/* Subtle top shimmer banner */}
              <div 
                className="absolute -top-12 -right-12 w-28 h-28 rounded-full opacity-20 blur-xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }}
              />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl drop-shadow-md">{game.emoji}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/25">
                    {game.playCount || '1.2k'} plays
                  </span>
                </div>

                <h3 className="font-cinzel font-black text-base text-amber-950 mb-1">
                  {game.name}
                </h3>
                <p className="text-xs text-amber-900/70 line-clamp-2 mb-4 leading-relaxed font-medium">
                  {game.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handlePlayGame(game.id)}
                className="btn-3d w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-stone-950 flex items-center justify-center gap-1.5 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, hsl(42 90% 50%) 0%, hsl(34 92% 44%) 100%)',
                  boxShadow: '0 2px 0 hsl(34 92% 28%), 0 4px 12px rgba(245, 158, 11, 0.2)',
                }}
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
