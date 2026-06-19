import React from 'react';
import { minigames } from '@/components/gamification/minigamesData';
import { MiniGameCard } from '@/components/gamification/MiniGameCard';
import './MiniGamesList.css';

export const MiniGamesList: React.FC = () => {
  return (
    <div className="mini-games-list-container">
      <h1 className="page-title">Mini Games Gallery</h1>
      <div className="cards-masonry">
        {minigames.map(game => (
          <MiniGameCard
            key={game.id}
            id={game.id}
            name={game.name}
            description={game.description}
            thumbnail={game.thumbnail}
            playCount={game.playCount}
          />
        ))}
      </div>
    </div>
  );
};
