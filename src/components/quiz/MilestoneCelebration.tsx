import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Trophy, Star, Sparkles, PartyPopper, Rocket, Crown } from 'lucide-react';
import { 
  getUncelabratedMilestone, 
  markMilestoneCelebrated,
  getGuestSessionPoints 
} from '@/utils/guestPlayService';
import confetti from 'canvas-confetti';
import SocialShareButtons from './SocialShareButtons';

interface MilestoneCelebrationProps {
  triggerCheck?: number; // Change this to trigger a check
}

const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({ triggerCheck }) => {
  const [milestone, setMilestone] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const uncelebrated = getUncelabratedMilestone();
    if (uncelebrated) {
      setMilestone(uncelebrated);
      setIsOpen(true);
      
      // Fire confetti!
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [triggerCheck]);

  const handleClose = () => {
    if (milestone) {
      markMilestoneCelebrated(milestone);
    }
    setIsOpen(false);
    setMilestone(null);
  };

  const getMilestoneIcon = () => {
    if (!milestone) return Trophy;
    if (milestone >= 500) return Crown;
    if (milestone >= 200) return Rocket;
    if (milestone >= 100) return Star;
    return PartyPopper;
  };

  const getMilestoneMessage = () => {
    if (!milestone) return '';
    if (milestone >= 500) return "You're a quiz legend!";
    if (milestone >= 200) return "You're on fire!";
    if (milestone >= 100) return "Triple digits!";
    return "Great start!";
  };

  const getMilestoneColor = () => {
    if (!milestone) return 'text-primary';
    if (milestone >= 500) return 'text-purple-500';
    if (milestone >= 200) return 'text-orange-500';
    if (milestone >= 100) return 'text-yellow-500';
    return 'text-green-500';
  };

  const Icon = getMilestoneIcon();
  const sessionPoints = getGuestSessionPoints();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
        <div className="relative text-center py-4">
          {/* Milestone Icon with animation */}
          <div className="relative inline-block mb-4">
            <div className={`p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-scale-in`}>
              <Icon className={`w-16 h-16 ${getMilestoneColor()} animate-bounce`} />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-2 w-5 h-5 text-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Celebration text */}
          <h2 className="text-2xl font-bold mb-1 animate-fade-in">
            🎉 {getMilestoneMessage()}
          </h2>
          <p className="text-lg text-muted-foreground mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            You've reached <span className={`font-bold ${getMilestoneColor()}`}>{milestone}</span> points!
          </p>

          {/* Current points display */}
          <div className="bg-primary/10 rounded-xl p-4 mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Total Session Points</span>
            </div>
            <div className="text-4xl font-bold text-primary">{sessionPoints.toFixed(1)}</div>
          </div>

          {/* Social sharing */}
          <div className="mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <SocialShareButtons points={sessionPoints} className="justify-center" />
          </div>

          {/* Registration CTA */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm text-muted-foreground">
              Register now to save your points forever!
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild size="lg" className="group">
                <Link to="/register">
                  <Star className="w-4 h-4 mr-2" />
                  Register & Save Points
                </Link>
              </Button>
              <Button variant="outline" size="lg" onClick={handleClose}>
                Keep Playing
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneCelebration;
