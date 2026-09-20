
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Play, UserPlus, Zap, CheckCircle2, Crown, Shield } from 'lucide-react';
import { getRemainingGuestPlays, getMaxGuestQuestions } from '@/utils/guestPlayService';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { GooglePlayBadge } from '@/components/app-promo/GooglePlay';
import { MedievalCharacterBanner } from '@/mobile/components/MedievalCharacterBanner';
import { EmberBackground } from '@/mobile/components/EmberBackground';
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
    <div className="w-full relative overflow-hidden" aria-labelledby="hero-heading">
      {/* Dynamic ambient ember particles for desktop web */}
      <EmberBackground count={18} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Portrait-first leader panel: the square source stays fully visible. */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <MedievalCharacterBanner
            compact={false}
            className="rounded-t-[5rem] rounded-b-2xl border-[6px] border-amber-600/70 bg-stone-950 shadow-2xl ring-4 ring-amber-500/40 ring-offset-4 ring-offset-background [&>div:first-child]:h-auto [&>div:first-child]:aspect-square [&_img]:scale-100 [&_img]:object-contain"
          />
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-8 gap-8 items-start">
        {/* Main quest introduction */}
        <div className="xl:col-span-5 space-y-5 xl:pt-5">
          {/* Headline & Description */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-950 text-xs font-black tracking-wide font-cinzel shadow-sm">
              <Crown className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Conquer The Realm of Knowledge</span>
            </div>

            <h1 id="hero-heading" className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-amber-950 font-cinzel tracking-tight drop-shadow-sm">
              Speed Quizzing,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600">
                Unmatched Trivia
              </span>
            </h1>

            <p className="text-sm sm:text-base text-amber-950/80 max-w-xl leading-relaxed font-medium">
              Join thousands of scholars in the Royal Citadel. Complete historic daily challenges, recruit the 4 legendary councillors of the Curia Regis, and earn gems to rise from Infantry to Sovereign King.
            </p>
          </div>

          {/* Quick perks */}
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-amber-950/85">
            <li className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-600/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Curia Regis Shards</span>
            </li>
            <li className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-600/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>50/50 & Skip Lifelines</span>
            </li>
            <li className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-600/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daily Gem Bounties</span>
            </li>
          </ul>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button 
              type="button"
              onClick={handlePlayNow}
              className="btn-royal-gold text-sm font-black px-8 py-4 rounded-xl uppercase tracking-wider flex items-center justify-center cursor-pointer"
            >
              <Play className="mr-2 w-4 h-4 fill-current" />
              {isLoggedIn || hasStarted ? 'Continue Quest' : 'Embark Quest'}
            </button>
            
            {!isLoggedIn && (
              <button 
                type="button"
                onClick={navigateToRegister}
                className="btn-3d text-sm font-black px-6 py-4 rounded-xl border-2 border-amber-700/40 bg-white/80 text-amber-950 hover:bg-white shadow-md flex items-center justify-center cursor-pointer transition-all"
              >
                <UserPlus className="mr-2 w-4 h-4 text-amber-700" />
                Forge Covenant
              </button>
            )}

            <GooglePlayBadge size="sm" className="ml-auto hidden sm:inline-flex" />
          </div>

          {/* Guest plays counter */}
          {!isLoggedIn && remainingPlays > 0 && (
            <p className="text-xs text-amber-900/70 font-medium flex items-center gap-1.5">
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
