import React from 'react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Gift, UserPlus } from 'lucide-react';
import { 
  getRemainingGuestPlays, 
  getMaxGuestQuestions, 
  getGuestSessionPoints,
  isUserLoggedIn 
} from '@/utils/guestPlayService';
import ResetCountdown from './ResetCountdown';

interface GuestPlayProgressBarProps {
  className?: string;
}

const GuestPlayProgressBar: React.FC<GuestPlayProgressBarProps> = ({ className = '' }) => {
  // Don't show for logged-in users
  if (isUserLoggedIn()) return null;

  const remaining = getRemainingGuestPlays();
  const maxQuestions = getMaxGuestQuestions();
  const questionsPlayed = maxQuestions - remaining;
  const progressPercent = (questionsPlayed / maxQuestions) * 100;
  const sessionPoints = getGuestSessionPoints();

  return (
    <div className={`bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Free Play Progress</span>
        </div>
        <ResetCountdown compact />
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {questionsPlayed} of {maxQuestions} free questions used
          </span>
          <span className="font-medium text-primary">
            {remaining} left
          </span>
        </div>
        <Progress value={progressPercent} className="h-2.5" />
      </div>

      {/* Points & CTA */}
      {questionsPlayed > 0 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary/10">
          <div className="text-sm">
            <span className="text-muted-foreground">Points earned: </span>
            <span className="font-bold text-primary">{sessionPoints.toFixed(1)}</span>
          </div>
          <Link 
            to="/register" 
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register to Save</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default GuestPlayProgressBar;
