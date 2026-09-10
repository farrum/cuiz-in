
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Play, UserPlus, Zap, CheckCircle2, Crown, Shield } from 'lucide-react';
import { getRemainingGuestPlays, getMaxGuestQuestions } from '@/utils/guestPlayService';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { GooglePlayBadge } from '@/components/app-promo/GooglePlay';
import { MedievalCharacterBanner } from '@/mobile/components/MedievalCharacterBanner';
import { RoyalChambersDesktop } from './RoyalChambersDesktop';

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

  return (
    <div className="w-full" aria-labelledby="hero-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Portrait-first leader panel: the square source stays fully visible. */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <MedievalCharacterBanner
            compact={false}
            className="rounded-t-[5rem] rounded-b-2xl border-[6px] border-amber-700/60 bg-stone-950 shadow-2xl ring-2 ring-amber-500/50 ring-offset-4 ring-offset-background [&>div:first-child]:h-auto [&>div:first-child]:aspect-square [&_img]:scale-100 [&_img]:object-contain"
          />
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-8 gap-8 items-start">
        {/* Main quest introduction */}
        <div className="xl:col-span-5 space-y-5 xl:pt-5">
          {/* Headline & Description */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-600/30 text-amber-900 text-xs font-bold font-cinzel">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Conquer The Realm of Knowledge</span>
            </div>

            <h1 id="hero-heading" className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-amber-950 font-cinzel tracking-tight">
              Speed Quizzing,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700">
                Unmatched Trivia
              </span>
            </h1>

            <p className="text-sm sm:text-base text-amber-900/75 max-w-xl leading-relaxed font-medium">
              Join thousands of scholars in the Royal Citadel. Complete historic daily challenges, recruit the 4 legendary councillors of the Curia Regis, and earn gems to rise from Infantry to Sovereign King.
            </p>
          </div>

          {/* Quick perks */}
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-amber-950/80">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Curia Regis Shard Forging</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>50/50 & Skip Lifelines</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Realtime Squad Bounties</span>
            </li>
          </ul>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button 
              size="lg" 
              onClick={handlePlayNow}
              className="btn-3d text-sm font-black px-7 py-5 uppercase tracking-wider text-stone-950 border-0 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, hsl(42 90% 50%) 0%, hsl(34 92% 44%) 100%)',
                boxShadow: '0 3px 0 hsl(34 92% 26%), 0 6px 18px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Play className="mr-2 w-4 h-4 fill-current" />
              {isLoggedIn || hasStarted ? 'Continue Quest' : 'Embark Quest'}
            </Button>
            
            {!isLoggedIn && (
              <Button 
                size="lg" 
                variant="outline" 
                onClick={navigateToRegister}
                className="btn-3d text-sm font-black px-6 py-5 border-2 border-amber-800/40 bg-white/60 text-amber-950 hover:bg-white"
              >
                <UserPlus className="mr-2 w-4 h-4 text-amber-700" />
                Forge Covenant
              </Button>
            )}

            <GooglePlayBadge size="sm" className="ml-auto hidden sm:inline-flex" />
          </div>

          {/* Guest plays counter */}
          {!isLoggedIn && remainingPlays > 0 && (
            <p className="text-xs text-amber-900/60 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>{remainingPlays} of {maxQuestions} free guest trials remaining today.</span>
              <button onClick={navigateToLogin} className="text-amber-800 font-bold underline ml-1 hover:text-amber-950">
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Royal Chambers Action Stack */}
        <div className="xl:col-span-3">
          <div className="scroll-paper rounded-2xl p-4 shadow-xl">
            <RoyalChambersDesktop />
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* Restored horizontal network placement below the complete hero. */}
      <div className="w-full pt-8">
        <SimpleAdBanner
          position="content"
          slotId="hero-left-banner"
          pageSection="hero-left"
          className="overflow-hidden rounded-lg"
        />
      </div>
      </div>
    </div>
  );
};

export default HeroSectionEnhanced;
