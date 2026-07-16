import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserBalances } from '@/utils/shopData';
import './MiniGameCard.css';

interface MiniGameCardProps {
  id: string;
  name: string;
  description: string;
  emoji: string;
  gradient: string;
  playCount: number;
}

const Particle = ({ emoji, index }: { emoji: string; index: number }) => {
  const randomX = (Math.random() - 0.5) * 200;
  const randomY = -50 - Math.random() * 150;
  const randomRotate = (Math.random() - 0.5) * 360;
  const delay = Math.random() * 0.2;

  return (
    <motion.div
      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
      animate={{
        x: [0, randomX],
        y: [0, randomY, randomY + 50],
        scale: [0, 1.5, 1],
        opacity: [0, 1, 0],
        rotate: [0, randomRotate]
      }}
      transition={{ duration: 1.2, delay, ease: "easeOut" }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl z-40 pointer-events-none"
    >
      {emoji}
    </motion.div>
  );
};

export const MiniGameCard: React.FC<MiniGameCardProps> = ({ id, name, description, emoji, gradient, playCount }) => {
  const route = `/minigames/${id}`;
  const [isClaimed, setIsClaimed] = useState(false);
  const [animationState, setAnimationState] = useState<'idle' | 'shaking' | 'bursting' | 'revealed'>('idle');
  const [reward, setReward] = useState<{ gems: number; stars: number } | null>(null);

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    const today = getTodayString();
    const claimed = localStorage.getItem(`cuizin-box-claimed-${id}-${today}`);
    if (claimed === 'true') {
      setIsClaimed(true);
    }
  }, [id]);

  const handleOpenChest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClaimed || animationState !== 'idle') return;

    // Start shaking
    setAnimationState('shaking');

    // Random rewards
    const gemsReward = Math.floor(Math.random() * 21) + 10; // 10 to 30 Gems
    const starsReward = Math.floor(Math.random() * 5) + 2;   // 2 to 6 Stars
    setReward({ gems: gemsReward, stars: starsReward });

    // After 1s shake, burst open
    setTimeout(() => {
      setAnimationState('bursting');
      
      // Play sound
      import('@/utils/audioManager').then(({ audioManager }) => {
        audioManager.playSound('win');
      });

      // After particles finish (1.2s), show reveal message
      setTimeout(() => {
        setAnimationState('revealed');
        updateUserBalances(gemsReward, starsReward);
        
        const today = getTodayString();
        localStorage.setItem(`cuizin-box-claimed-${id}-${today}`, 'true');
        
        // Update Daily Bounty Board Quest Progress
        const questKey = `cuizin_quest_boxes_opened_${today}`;
        const currentProgress = parseInt(localStorage.getItem(questKey) || '0');
        localStorage.setItem(questKey, (currentProgress + 1).toString());

        // Cleanup and close overlay after 2.5s
        setTimeout(() => {
          setIsClaimed(true);
          setAnimationState('idle');
          setReward(null);
        }, 2500);
      }, 1200);
    }, 1000);
  };

  const particles = Array.from({ length: 15 }).map((_, i) => (
    <Particle key={i} index={i} emoji={i % 2 === 0 ? '💎' : '⭐'} />
  ));

  return (
    <div className="mini-game-card relative panel-3d border-2 border-primary/20 bg-white shadow-sm overflow-hidden rounded-3xl flex flex-col group">
      <div className="mini-game-gradient-header relative" style={{ background: gradient }}>
        <span className="mini-game-emoji" role="img" aria-label={name}>
          {emoji}
        </span>

        {/* Daily Mystery Chest Indicator */}
        {!isClaimed && animationState === 'idle' && (
          <button 
            onClick={handleOpenChest}
            className="absolute top-3 right-3 z-20 flex flex-col items-center justify-center bg-amber-500 hover:bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-2xl border-2 border-amber-300 shadow-md cursor-pointer select-none transition-all duration-300 animate-[float_3s_ease-in-out_infinite] hover:scale-110"
          >
            <div className="text-lg leading-none mb-0.5 filter drop-shadow-sm">🧰</div>
            <span>Daily Chest</span>
          </button>
        )}

        {isClaimed && animationState === 'idle' && (
          <div className="absolute top-3 right-3 z-20 bg-slate-900/60 border-2 border-slate-700/50 backdrop-blur px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest text-slate-300 uppercase select-none shadow-inner">
            Opened Today
          </div>
        )}
      </div>

      <div className="mini-game-content p-6 flex flex-col gap-4 flex-1">
        <h3 className="text-xl font-black text-primary tracking-widest uppercase">{name}</h3>
        <p className="text-sm font-bold text-muted-foreground leading-relaxed flex-1">{description}</p>
        <div className="mini-game-meta mt-1">
          <span className="play-count text-xs font-black uppercase tracking-widest text-muted-foreground">▶ {playCount} plays</span>
        </div>
        <Link to={route} className="play-button btn-3d btn-3d-primary font-black py-4 rounded-xl text-sm uppercase tracking-widest mt-2 block w-full text-center">
          Play Game
        </Link>
      </div>

      {/* Full Card Overlay Animation Sequence */}
      <AnimatePresence>
        {animationState !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center overflow-hidden rounded-3xl"
          >
            {/* The 3D CSS Chest */}
            <motion.div 
              animate={
                animationState === 'shaking' ? { 
                  rotate: [0, -10, 10, -10, 10, -5, 5, 0],
                  scale: [1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1]
                } : animationState === 'bursting' ? {
                  scale: 0, opacity: 0
                } : {}
              }
              transition={{ duration: 1, ease: "easeInOut" }}
              className="relative w-24 h-20 perspective-[1000px] z-30"
            >
              {/* Chest Body */}
              <div className="absolute bottom-0 w-full h-12 bg-amber-700 border-4 border-amber-900 rounded-b-xl shadow-[inset_0_-8px_16px_rgba(0,0,0,0.4)] flex items-center justify-center">
                <div className="w-16 h-2 bg-amber-900/50 rounded-full" />
              </div>
              
              {/* Chest Lid (Opens up) */}
              <motion.div 
                initial={{ rotateX: 0 }}
                animate={{ rotateX: animationState === 'bursting' || animationState === 'revealed' ? -120 : 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                className="absolute top-0 w-full h-10 bg-amber-600 border-4 border-amber-900 rounded-t-2xl shadow-[inset_0_8px_16px_rgba(255,255,255,0.2)] origin-bottom z-10"
              >
                {/* Golden Lock */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-yellow-400 border-2 border-yellow-600 rounded-md shadow-md flex items-center justify-center">
                  <div className="w-2 h-2 bg-yellow-700 rounded-full" />
                </div>
              </motion.div>
            </motion.div>

            {/* Bursting Particles */}
            {(animationState === 'bursting' || animationState === 'revealed') && particles}

            {/* Revealed Text */}
            <AnimatePresence>
              {animationState === 'revealed' && reward && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="absolute z-50 flex flex-col items-center justify-center w-full px-4 text-center"
                >
                  <span className="text-5xl mb-3 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">🏆</span>
                  <h3 className="text-sm font-black uppercase tracking-widest text-amber-400 mb-2 drop-shadow-md">Daily Chest Opened!</h3>
                  <div className="panel-3d bg-white/10 backdrop-blur-md border border-white/20 p-4 w-full flex items-center justify-center gap-6 shadow-2xl">
                    <div className="text-center">
                      <span className="block text-2xl font-black text-blue-400 drop-shadow-md">+{reward.gems}</span>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Gems</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-2xl font-black text-amber-400 drop-shadow-md">+{reward.stars}</span>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Stars</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

