
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award, Calendar, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginBonusPopupProps {
  bonusPoints: number;
  streakDays: number;
  isOpen: boolean;
  onClose: () => void;
}

const LoginBonusPopup: React.FC<LoginBonusPopupProps> = ({
  bonusPoints,
  streakDays,
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti effect when the popup is displayed
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            Daily Login Bonus!
            <Award className="h-6 w-6 text-yellow-500" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">+{bonusPoints}</span>
            </div>
            
            <p className="text-lg text-center">
              You've earned <span className="font-bold text-primary">{bonusPoints} bonus points</span> today!
            </p>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Login streak: {streakDays} day{streakDays !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="text-sm text-center text-muted-foreground">
              Log in tomorrow to increase your streak and earn even more points!
              {streakDays < 30 && (
                <div className="mt-2 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Next bonus: {Math.min(streakDays + 1, 30)} points</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button onClick={onClose}>Awesome!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginBonusPopup;
