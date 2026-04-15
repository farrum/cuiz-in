import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Star, Trophy, Zap, Users, Clock, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isUserLoggedIn, getGuestQuestionsPlayed } from '@/utils/guestPlayService';

interface RegistrationIncentiveModalProps {
  triggerAfterQuestions?: number;
}

const RegistrationIncentiveModal: React.FC<RegistrationIncentiveModalProps> = ({ 
  triggerAfterQuestions = 3 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isUserLoggedIn()) return;
    
    const modalShownKey = 'registration_modal_shown_session';
    const alreadyShown = sessionStorage.getItem(modalShownKey);
    if (alreadyShown) return;

    const checkQuestions = () => {
      const questionsPlayed = getGuestQuestionsPlayed();
      
      if (questionsPlayed >= triggerAfterQuestions && !hasShown) {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem(modalShownKey, 'true');
      }
    };

    checkQuestions();

    const handleQuestionComplete = () => {
      setTimeout(checkQuestions, 500);
    };

    window.addEventListener('guestQuestionCompleted', handleQuestionComplete);
    const intervalId = setInterval(checkQuestions, 2000);

    return () => {
      window.removeEventListener('guestQuestionCompleted', handleQuestionComplete);
      clearInterval(intervalId);
    };
  }, [triggerAfterQuestions, hasShown]);

  const handleRegister = () => {
    setIsOpen(false);
    navigate('/register');
  };

  const handleContinueAsGuest = () => {
    setIsOpen(false);
  };

  const benefits = [
    {
      icon: Zap,
      title: 'Unlimited Questions',
      description: 'Play as many quizzes as you want, anytime'
    },
    {
      icon: Trophy,
      title: 'Compete on Leaderboards',
      description: 'Rise through the ranks and become a champion'
    },
    {
      icon: Star,
      title: 'Track Your Progress',
      description: 'See your stats, streaks, and achievements'
    },
    {
      icon: Users,
      title: 'Compete & Win',
      description: 'Join leaderboards and earn recognition monthly'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-b from-card to-card/95">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground relative">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <Gift className="w-7 h-7" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-primary-foreground">
                You're Doing Great! 🎉
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 mt-1">
                Register now to unlock exclusive benefits
              </DialogDescription>
            </div>
          </div>

          {/* Bonus offer */}
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">Bonus: +50 Points on Registration!</p>
              <p className="text-sm text-primary-foreground/80">Limited time offer</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefits list */}
          <div className="space-y-4 mb-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2">Guest</p>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  30 plays/day
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                  No leaderboard
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                  No progress saved
                </li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border-2 border-primary/30 relative">
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                FREE
              </div>
              <p className="text-sm font-medium text-primary mb-2">Member</p>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  Unlimited plays
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  Leaderboard access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  Track progress
                </li>
              </ul>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRegister}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            >
              Register Now - Get 50 Bonus Points
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={handleContinueAsGuest}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            🔒 Your data is secure. No spam, ever.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationIncentiveModal;
