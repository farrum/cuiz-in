
import React from 'react';
import { UserPlus, Brain, Trophy, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface HowItWorksSectionProps {
  className?: string;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ className }) => {
  const navigate = useNavigate();

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
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          How It Works
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Start playing in 4 simple steps. It's completely free!
        </p>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Connection line - desktop only */}
        <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary via-[hsl(var(--quiz-purple))] to-accent opacity-20" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.title}
              className="relative text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Step number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-card border-2 border-primary flex items-center justify-center text-xs font-bold text-primary z-10">
                {index + 1}
              </div>

              {/* Icon */}
              <div className={cn(
                "w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
                step.color
              )}>
                <step.icon className="w-10 h-10 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Arrow for mobile */}
              {index < steps.length - 1 && (
                <ArrowRight className="w-6 h-6 text-muted-foreground/30 mx-auto mt-4 lg:hidden" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-12">
        <Button 
          size="lg"
          onClick={() => navigate('/register')}
          className="gradient-primary text-white px-8 py-6 text-lg btn-shine"
        >
          Get Started Now — It's Free!
        </Button>
      </div>
    </section>
  );
};

export default HowItWorksSection;
