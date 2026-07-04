
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Play, UserPlus, Zap, CheckCircle2 } from 'lucide-react';
import { getRemainingGuestPlays, getMaxGuestQuestions } from '@/utils/guestPlayService';
import InteractiveQuizPreview from './InteractiveQuizPreview';
import SocialProofStats from './SocialProofStats';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

interface HeroSectionEnhancedProps {
  isLoggedIn: boolean;
  hasStarted: boolean;
  navigateToRegister: () => void;
  navigateToLogin: () => void;
}

const HeroSectionEnhanced: React.FC<HeroSectionEnhancedProps> = ({
  isLoggedIn,
  hasStarted,
  navigateToRegister,
  navigateToLogin,
}) => {
  const navigate = useNavigate();
  const remainingPlays = getRemainingGuestPlays();
  const maxQuestions = getMaxGuestQuestions();

  const handlePlayNow = () => {
    navigate('/quiz');
  };

  const benefits = [
    "No deposits required",
    "Learn while you play",
    "Play anytime, anywhere"
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-labelledby="hero-heading">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Column - Text & CTA */}
        <div className="text-center lg:text-left space-y-4" role="main">
          {/* Social proof badge */}
          <div className="inline-flex items-center gap-2 social-proof-badge">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-pulse"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span>2,400+ players online now</span>
          </div>

          {/* Main heading */}
          <div className="space-y-3" id="hero-heading">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight font-serif text-white" style={{ fontFamily: "'Cinzel', serif" }}>
              Swear Your Allegiance,<br />
              <span className="text-amber-500">
                Test Your Knowledge
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-stone-300 max-w-xl mx-auto lg:mx-0">
              Complete historic quests, recruit legendary advisors, and conquer the intellectual empires of CuizIN.
            </p>
          </div>

          {/* Benefits list */}
          <ul className="flex flex-wrap justify-center lg:justify-start gap-4">
            <li className="flex items-center gap-2 text-sm text-stone-400">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Unlock Legendary Advisors</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-stone-400">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Conquer Historic Empires</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-stone-400">
              <CheckCircle2 className="w-4 h-4 text-amber-500" />
              <span>Assemble Your Alliance</span>
            </li>
          </ul>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button 
              size="lg" 
              onClick={handlePlayNow}
              className="text-lg px-8 py-6 medieval-btn text-stone-950 hover:scale-105 active:scale-95 transition-transform border-0 font-black"
            >
              <Play className="mr-2 w-5 h-5 fill-current" />
              {isLoggedIn || hasStarted ? 'Continue Quest' : 'Embark Quest'}
            </Button>
            
            {!isLoggedIn && (
              <Button 
                size="lg" 
                variant="outline" 
                onClick={navigateToRegister}
                className="text-lg px-8 py-6 border-2 border-amber-800 bg-stone-950/40 text-amber-500 hover:bg-stone-900"
              >
                <UserPlus className="mr-2 w-5 h-5" />
                Forge Covenant
              </Button>
            )}
          </div>

          {/* Banner ad below CTA */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <SimpleAdBanner 
              position="content" 
              slotId="hero-left-banner" 
              pageSection="hero-left"
              className="rounded-xl overflow-hidden" 
            />
          </div>

          {/* Guest plays info */}
          {!isLoggedIn && remainingPlays > 0 && (
            <p className="text-sm text-muted-foreground flex items-center justify-center lg:justify-start gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span>{remainingPlays} of {maxQuestions} free plays remaining today</span>
              <button onClick={navigateToLogin} className="text-primary hover:underline ml-1">
                Login
              </button>
            </p>
          )}
        </div>

        {/* Right Column - Interactive Quiz Preview */}
        <div className="relative">
          <InteractiveQuizPreview />
          
          {/* Decorative elements - hidden on mobile for performance */}
          <div className="hidden md:block absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-[hsl(var(--quiz-purple))]/20 blur-2xl" />
          <div className="hidden md:block absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-gradient-to-br from-accent/20 to-[hsl(var(--quiz-gold))]/20 blur-2xl" />
        </div>
      </div>

      {/* Social Proof Stats */}
      <SocialProofStats className="mt-16" />
    </section>
  );
};

export default HeroSectionEnhanced;
