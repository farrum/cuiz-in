import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { minigames } from '@/components/gamification/minigamesData';
import { MiniGameCard } from '@/components/gamification/MiniGameCard';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import './MiniGamesList.css';

export const MiniGamesList: React.FC = () => {
  // Construct list of cards and interleaved ads
  const items: React.ReactNode[] = [];
  minigames.forEach((game, index) => {
    items.push(
      <MiniGameCard
        key={game.id}
        id={game.id}
        name={game.name}
        description={game.description}
        emoji={game.emoji}
        gradient={game.gradient}
        playCount={game.playCount}
      />
    );
    
    // Insert an ad card after every 2 games
    if ((index + 1) % 2 === 0) {
      items.push(
        <div key={`ad-${index}`} className="ad-slot-card">
          <div className="ad-slot-label">Sponsored Ad</div>
          <SimpleAdBanner position="middle" />
        </div>
      );
    }
  });

  return (
    <PageLayout showNewsTicker={true}>
      <div className="mini-games-list-container">
        <div className="gallery-header">
          <span className="gallery-badge">Cuiz.in Minis</span>
          <h1 className="page-title">Mini Games Gallery</h1>
          <p className="page-subtitle">
            Play quick, fun games, test your luck, and earn extra reward gems!
          </p>
        </div>
        <div className="cards-masonry">
          {items}
        </div>
      </div>
    </PageLayout>
  );
};
