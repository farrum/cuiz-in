
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Play, UserPlus, LogIn, Trophy, Zap, Users, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { getRemainingGuestPlays, getMaxGuestQuestions } from '@/utils/guestPlayService';
import InteractiveQuizPreview from './InteractiveQuizPreview';
import SocialProofStats from './SocialProofStats';

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
    "Earn real rewards",
    "Play anytime, anywhere"
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-labelledby="hero-heading">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Column - Text & CTA */}
        <div className="text-center lg:text-left space-y-6 animate-fade-in" role="main">
          {/* Social proof badge */}
          <div className="inline-flex items-center gap-2 social-proof-badge">
            <span className="relative flex h-2 w-2">
              {/* Use CSS animation instead of animate-ping to reduce repaints on mobile */}
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-pulse"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span>2,400+ players online now</span>
          </div>

          {/* Main heading */}
          <div className="space-y-4" id="hero-heading">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Play Quizzes,{' '}
              <span className="bg-gradient-to-r from-primary via-[hsl(var(--quiz-purple))] to-accent bg-clip-text text-transparent">
                Earn Real Rewards
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Join thousands of players earning money daily. Answer questions, climb the leaderboard, and cash out your winnings.
            </p>
          </div>

          {/* Benefits list */}
          <ul className="flex flex-wrap justify-center lg:justify-start gap-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button 
              size="lg" 
              onClick={handlePlayNow}
              className="text-lg px-8 py-6 gradient-primary text-white btn-shine pulse-glow group"
            >
              <Play className="mr-2 w-5 h-5 transition-transform group-hover:scale-110" />
              {isLoggedIn || hasStarted ? 'Continue Playing' : 'Play Free Now'}
            </Button>
            
            {!isLoggedIn && (
              <Button 
                size="lg" 
                variant="outline" 
                onClick={navigateToRegister}
                className="text-lg px-8 py-6 border-2 hover:bg-primary/5 group"
              >
                <UserPlus className="mr-2 w-5 h-5 transition-transform group-hover:scale-110" />
                Create Account
              </Button>
            )}
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
