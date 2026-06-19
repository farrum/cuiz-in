import React from 'react';
import { Link } from 'react-router-dom';
import './MiniGameCard.css';

interface MiniGameCardProps {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  playCount: number;
}

export const MiniGameCard: React.FC<MiniGameCardProps> = ({ id, name, description, thumbnail, playCount }) => {
  const route = `/minigames/${id}`;
  return (
    <div className="mini-game-card">
      <img src={thumbnail} alt={`${name} thumbnail`} className="mini-game-thumbnail" />
      <div className="mini-game-content">
        <h3 className="mini-game-title">{name}</h3>
        <p className="mini-game-description">{description}</p>
        <div className="mini-game-meta">
          <span className="play-count">▶ {playCount} played</span>
        </div>
        <Link to={route} className="play-button">
          Play
        </Link>
      </div>
    </div>
  );
};
