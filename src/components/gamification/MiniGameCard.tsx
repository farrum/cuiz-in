import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

export const MiniGameCard: React.FC<MiniGameCardProps> = ({ id, name, description, emoji, gradient, playCount }) => {
  const route = `/minigames/${id}`;
  const [isClaimed, setIsClaimed] = useState(false);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

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

  const handleOpenBox = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClaimed || isOpening) return;

    setIsOpening(true);

    // Random rewards
    const gemsReward = Math.floor(Math.random() * 21) + 10; // 10 to 30 Gems
    const starsReward = Math.floor(Math.random() * 5) + 2;   // 2 to 6 Stars

    setTimeout(() => {
      updateUserBalances(gemsReward, starsReward);
      
      const today = getTodayString();
      localStorage.setItem(`cuizin-box-claimed-${id}-${today}`, 'true');
      
      // Update Daily Bounty Board Quest Progress
      const questKey = `cuizin_quest_boxes_opened_${today}`;
      const currentProgress = parseInt(localStorage.getItem(questKey) || '0');
      localStorage.setItem(questKey, (currentProgress + 1).toString());

      setIsClaimed(true);
      setIsOpening(false);
      setRewardMessage(`+${gemsReward} 💎  +${starsReward} ⭐`);

      // Hide reward message after 3 seconds
      setTimeout(() => {
        setRewardMessage(null);
      }, 3000);
    }, 800);
  };

  return (
    <div className="mini-game-card relative">
      <div className="mini-game-gradient-header" style={{ background: gradient }}>
        <span className="mini-game-emoji" role="img" aria-label={name}>
          {emoji}
        </span>

        {/* Daily Mystery Box overlay indicator */}
        {!isClaimed && (
          <button 
            onClick={handleOpenBox}
            className={`absolute top-3 right-3 z-20 flex flex-col items-center justify-center bg-yellow-500/90 hover:bg-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-1.5 rounded-xl border border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.6)] cursor-pointer select-none transition-all duration-300 ${isOpening ? 'scale-125 rotate-12 animate-bounce' : 'animate-[float_3s_ease-in-out_infinite]'}`}
          >
            <span className="text-lg">🎁</span>
            <span>Open Box</span>
          </button>
        )}

        {isClaimed && !rewardMessage && (
          <div className="absolute top-3 right-3 z-20 bg-slate-900/60 border border-slate-700/50 backdrop-blur px-2.5 py-1 rounded-xl text-[9px] font-black tracking-widest text-slate-400 uppercase select-none">
            Opened Today
          </div>
        )}

        {/* Opening Reward Pop animation */}
        {rewardMessage && (
          <div className="absolute inset-0 bg-slate-950/85 z-30 flex flex-col items-center justify-center animate-[scale-in_0.3s_ease-out] text-center p-4">
            <span className="text-4xl mb-2 animate-bounce">🎉</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Mystery Rewards Found!</span>
            <span className="text-lg font-black text-white mt-1 select-none animate-[float_2s_ease-in-out_infinite]">{rewardMessage}</span>
          </div>
        )}
      </div>

      <div className="mini-game-content">
        <h3 className="mini-game-title">{name}</h3>
        <p className="mini-game-description">{description}</p>
        <div className="mini-game-meta">
          <span className="play-count">▶ {playCount} plays</span>
        </div>
        <Link to={route} className="play-button">
          Play Game
        </Link>
      </div>
    </div>
  );
};
