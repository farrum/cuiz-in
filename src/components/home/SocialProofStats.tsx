
import React from 'react';
import { Users, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialProofStatsProps {
  className?: string;
}

// Static stats - no animation overhead for mobile performance
const stats = [
  { icon: Users, value: '12.5K', label: 'Total Players', color: 'text-primary' },
  { icon: Zap, value: '1.8M', label: 'Questions Answered', color: 'text-[hsl(var(--quiz-purple))]' },
  { icon: Zap, value: '850+', label: 'Categories', color: 'text-accent' },
  { icon: Trophy, value: '2.4K', label: 'Active Today', color: 'text-[hsl(var(--quiz-gold))]' }
];

const SocialProofStats: React.FC<SocialProofStatsProps> = ({ className }) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stats-card">
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
