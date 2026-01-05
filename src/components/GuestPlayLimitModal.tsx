import React from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Users, Zap, Gift } from 'lucide-react';
import { getGuestSessionPoints, getMaxGuestQuestions } from '@/utils/guestPlayService';

interface GuestPlayLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuestPlayLimitModal: React.FC<GuestPlayLimitModalProps> = ({ isOpen, onClose }) => {
  const sessionPoints = getGuestSessionPoints();
  const maxQuestions = getMaxGuestQuestions();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Great Start!
          </DialogTitle>
          <DialogDescription className="text-base">
            You've played {maxQuestions} questions as a guest!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session Points Display */}
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Session Points Earned</span>
            </div>
            <div className="text-3xl font-bold text-primary">{sessionPoints.toFixed(1)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Register now to save these points!
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Why Register?</h4>
            
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-full">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Unlimited Questions</p>
                <p className="text-xs text-muted-foreground">Play as many quizzes as you want</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Trophy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Save Your Progress</p>
                <p className="text-xs text-muted-foreground">Track your points and compete on leaderboards</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Earn Real Rewards</p>
                <p className="text-xs text-muted-foreground">Convert your points to cash withdrawals</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Join Daily Challenges</p>
                <p className="text-xs text-muted-foreground">Compete with others for bonus points</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/register">
              <Star className="h-4 w-4 mr-2" />
              Register Now - It's Free!
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/login">
              Already have an account? Login
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestPlayLimitModal;
