import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, UserPlus } from 'lucide-react';
import { getGuestSessionGems, getRemainingGuestPlays, getMaxGuestQuestions, isUserLoggedIn } from '@/utils/guestPlayService';

interface GuestGemsDisplayProps {
  className?: string;
}

const GuestGemsDisplay: React.FC<GuestGemsDisplayProps> = ({ className = '' }) => {
  // Don't show for logged-in users
  if (isUserLoggedIn()) return null;

  const sessionGems = getGuestSessionGems();
  const remaining = getRemainingGuestPlays();
  const maxQuestions = getMaxGuestQuestions();
  const questionsPlayed = maxQuestions - remaining;

  // Don't show if no questions played yet
  if (questionsPlayed === 0) return null;

  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {sessionGems.toFixed(1)} pts
        </span>
        <span className="text-xs text-muted-foreground">
          ({remaining}/{maxQuestions} free left)
        </span>
      </div>
      
      <Link 
        to="/register" 
        className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Save Gems</span>
      </Link>
    </div>
  );
};

export default GuestGemsDisplay;
