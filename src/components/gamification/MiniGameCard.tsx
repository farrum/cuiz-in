import React from 'react';
import { Link } from 'react-router-dom';
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
  return (
    <div className="mini-game-card">
      <div className="mini-game-gradient-header" style={{ background: gradient }}>
        <span className="mini-game-emoji" role="img" aria-label={name}>
          {emoji}
        </span>
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
