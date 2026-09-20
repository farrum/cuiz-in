
import React from 'react';
import { UserPlus, Brain, Trophy, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface HowItWorksSectionProps {
  className?: string;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ className }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setIsLoggedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const steps = [
    {
      icon: UserPlus,
      title: 'Sign Up Free',
      description: 'Create your account in seconds. No payment or credit card required.',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Brain,
      title: 'Answer Questions',
      description: 'Play quizzes across multiple categories. Each correct answer earns you gems.',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: Trophy,
      title: 'Climb Leaderboard',
      description: 'Compete with other players and rise through the rankings each month.',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: Star,
      title: 'Unlock Badges',
      description: 'Collect achievement badges and showcase your quiz mastery to the community.',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <section className={cn("w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-10 max-w-3xl mx-auto">
        <span className="h-px flex-1 section-divider-shimmer rounded-full" />
        <div className="text-center px-4">
          <span className="text-xs font-black tracking-[0.25em] uppercase text-amber-900/70 block font-cinzel">
            ⚔️ Path to Sovereignty
          </span>
          <h2 className="text-xl md:text-2xl font-black text-amber-950 font-cinzel">
            How The Grand Citadel Works
          </h2>
          <p className="text-xs text-amber-800/70 font-semibold mt-0.5">
            Begin thy ascension in 4 honorable steps. 100% free to play.
          </p>
        </div>
        <span className="h-px flex-1 section-divider-shimmer rounded-full" />
      </div>

      {/* Steps */}
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div 
              key={step.title}
              className="scroll-paper rounded-2xl p-6 text-center border-2 border-amber-600/30 shadow-md relative hover:shadow-xl hover:border-amber-500 transition-all duration-300 flex flex-col items-center justify-between"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Step number badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-white flex items-center justify-center text-xs font-black text-stone-950 z-10 shadow-sm">
                {index + 1}
              </div>

              {/* Icon */}
              <div className={cn(
                "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 mt-2 shadow-md border border-white/30",
                step.color
              )}>
                <step.icon className="w-8 h-8 text-white drop-shadow-sm" />
              </div>

              {/* Content */}
              <div>
                <h3 className="text-base font-black mb-2 text-amber-950 font-cinzel">{step.title}</h3>
                <p className="text-xs text-amber-900/75 leading-relaxed font-semibold">
                  {step.description}
                </p>
              </div>

              {/* Arrow for mobile */}
              {index < steps.length - 1 && (
                <ArrowRight className="w-5 h-5 text-amber-600/40 mt-3 lg:hidden" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <button 
          type="button"
          onClick={() => navigate(isLoggedIn ? '/quiz' : '/register')}
          className="btn-royal-gold px-9 py-4 rounded-xl text-sm font-black uppercase tracking-wider cursor-pointer shadow-xl inline-flex items-center"
        >
          {isLoggedIn ? 'Embark On Imperial Quest' : "Forge Thy Account — Play Free"}
        </button>
      </div>
    </section>
  );
};

export default HowItWorksSection;
