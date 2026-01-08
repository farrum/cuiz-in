
import React, { useState, useEffect, useRef } from 'react';
import { Users, Trophy, DollarSign, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialProofStatsProps {
  className?: string;
}

const SocialProofStats: React.FC<SocialProofStatsProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    players: 0,
    questionsAnswered: 0,
    rewardsPaid: 0,
    activeToday: 0
  });

  const finalStats = {
    players: 12500,
    questionsAnswered: 1850000,
    rewardsPaid: 3400,
    activeToday: 2456
  };

  // Only animate when visible - reduces CPU on mobile
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  // Run animation only when visible
  useEffect(() => {
    if (!hasAnimated) {
      // Show final values immediately if reduced motion is preferred
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setAnimatedStats(finalStats);
      }
      return;
    }

    const duration = 1500; // Reduced from 2000ms
    const steps = 30; // Reduced from 60 steps
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        players: Math.floor(finalStats.players * easeOut),
        questionsAnswered: Math.floor(finalStats.questionsAnswered * easeOut),
        rewardsPaid: Math.floor(finalStats.rewardsPaid * easeOut),
        activeToday: Math.floor(finalStats.activeToday * easeOut)
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats(finalStats);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [hasAnimated]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
    }
    return num.toLocaleString();
  };

  const stats = [
    {
      icon: Users,
      value: formatNumber(animatedStats.players),
      label: 'Total Players',
      color: 'text-primary'
    },
    {
      icon: Zap,
      value: formatNumber(animatedStats.questionsAnswered),
      label: 'Questions Answered',
      color: 'text-[hsl(var(--quiz-purple))]'
    },
    {
      icon: DollarSign,
      value: '$' + formatNumber(animatedStats.rewardsPaid),
      label: 'Rewards Paid',
      color: 'text-accent'
    },
    {
      icon: Trophy,
      value: formatNumber(animatedStats.activeToday),
      label: 'Active Today',
      color: 'text-[hsl(var(--quiz-gold))]'
    }
  ];

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      {/* Fixed height container to prevent CLS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-h-[100px]">
        {stats.map((stat, index) => (
          <div 
            key={stat.label}
            className="stats-card"
            style={{ 
              opacity: hasAnimated ? 1 : 0,
              transform: hasAnimated ? 'translateY(0)' : 'translateY(10px)',
              transition: `opacity 0.3s ease ${index * 0.1}s, transform 0.3s ease ${index * 0.1}s`
            }}
          >
            <stat.icon className={cn("w-6 h-6 mb-2", stat.color)} />
            <span className="stats-value">{stat.value}</span>
            <span className="stats-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialProofStats;
