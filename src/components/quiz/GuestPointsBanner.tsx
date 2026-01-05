import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Trophy, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  getGuestSessionPoints, 
  getRemainingGuestPlays, 
  getMaxGuestQuestions,
  isUserLoggedIn 
} from '@/utils/guestPlayService';

interface GuestPointsBannerProps {
  className?: string;
}

const GuestPointsBanner: React.FC<GuestPointsBannerProps> = ({ className = '' }) => {
  // Don't show for logged-in users
  if (isUserLoggedIn()) return null;

  const sessionPoints = getGuestSessionPoints();
  const remaining = getRemainingGuestPlays();
  const maxQuestions = getMaxGuestQuestions();
  const questionsPlayed = maxQuestions - remaining;

  // Don't show if no questions played yet
  if (questionsPlayed === 0) return null;

  const isLowOnPlays = remaining <= 5;
  const isOutOfPlays = remaining === 0;

  return (
    <div className={`relative overflow-hidden rounded-xl border ${
      isOutOfPlays 
        ? 'bg-gradient-to-r from-destructive/10 to-orange-500/10 border-destructive/30' 
        : isLowOnPlays 
          ? 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/30'
          : 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20'
    } ${className}`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Points Display */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/20 rounded-full">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">
                  {isOutOfPlays ? "You've used all free plays!" : "Playing as Guest"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isOutOfPlays 
                    ? "Register to continue playing and save your points"
                    : "Register to save your progress"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-lg font-bold text-foreground">{sessionPoints.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">points earned</span>
              </div>
              
              {!isOutOfPlays && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{remaining} free plays left</span>
                </div>
              )}
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="flex-shrink-0">
            <Button asChild size="lg" className="w-full sm:w-auto group">
              <Link to="/register">
                Register Free
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Warning message when low on plays */}
        {isLowOnPlays && !isOutOfPlays && (
          <div className="mt-3 pt-3 border-t border-orange-500/20 text-sm text-orange-600 dark:text-orange-400">
            ⚠️ Running low on free plays! Register now to keep playing unlimited.
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestPointsBanner;
