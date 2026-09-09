import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Sparkles, Swords, Landmark, Users,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/mobile/hooks/useHaptics';

interface PlayNode {
  id: string;
  label: string;
  subtitle: string;
  to: string;
  icon: any;
  color: string;
  glow: string;
  badge?: string;
  badgeClass?: string;
}

const PLAY_NODES: PlayNode[] = [
  {
    id: 'daily',
    label: 'Daily Challenge',
    subtitle: 'Complete for 2× rewards & double stars',
    to: '/daily',
    icon: Calendar,
    color: 'from-rose-500 to-red-600',
    glow: 'rgba(239, 68, 68, 0.35)',
    badge: 'HOT',
    badgeClass: 'bg-rose-500 text-white shadow-sm',
  },
  {
    id: 'quiz',
    label: 'Quick Quiz',
    subtitle: 'Answer timed trivia & forge streaks',
    to: '/quiz',
    icon: Sparkles,
    color: 'from-violet-500 to-pink-600',
    glow: 'rgba(168, 85, 247, 0.35)',
  },
  {
    id: 'quests',
    label: 'Quest Board',
    subtitle: 'Conquer imperial campaign stages',
    to: '/empire-quests',
    icon: Swords,
    color: 'from-amber-500 to-orange-600',
    glow: 'rgba(245, 158, 11, 0.35)',
  },
  {
    id: 'kingdoms',
    label: 'Kingdoms Dynasty',
    subtitle: 'Establish your faction & realm dominance',
    to: '/kingdoms',
    icon: Landmark,
    color: 'from-blue-600 to-indigo-700',
    glow: 'rgba(79, 70, 229, 0.35)',
  },
  {
    id: 'team',
    label: 'Team & Squad',
    subtitle: 'Assemble allies & earn recurring gems',
    to: '/team-dashboard',
    icon: Users,
    color: 'from-indigo-500 to-purple-700',
    glow: 'rgba(139, 92, 246, 0.35)',
    badge: 'Squad',
    badgeClass: 'bg-indigo-500 text-white shadow-sm',
  },
];

export const RoyalChambersDesktop: React.FC = () => {
  const navigate = useNavigate();
  const haptics = useHaptics();

  const go = (to: string) => {
    haptics('medium');
    navigate(to);
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <span className="h-px flex-1 section-divider-shimmer rounded-full" />
        <div className="text-center px-2">
          <span className="text-xs font-black tracking-[0.2em] uppercase text-amber-900/70 block font-cinzel">
            Royal Chambers
          </span>
          <span className="text-[9px] font-semibold tracking-wider text-amber-800/40 uppercase block">
            Imperial Quests & Expeditions
          </span>
        </div>
        <span className="h-px flex-1 section-divider-shimmer rounded-full" />
      </div>

      {/* Cards Stack */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        {PLAY_NODES.map((node, idx) => {
          const Icon = node.icon;
          return (
            <motion.button
              key={node.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.015, x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => go(node.to)}
              className="w-full flex items-center gap-3.5 rounded-2xl p-3.5 text-left game-card-glow cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(145deg, hsl(40 70% 97%) 0%, hsl(36 55% 93%) 100%)',
                border: '1px solid rgba(180,140,60,0.22)',
                boxShadow: `0 1px 0 rgba(255,255,255,0.95) inset, 0 4px 14px rgba(120,80,20,0.08)`,
              }}
            >
              {/* Icon Bubble */}
              <div
                className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-md', node.color)}
                style={{ boxShadow: `0 4px 12px ${node.glow}` }}
              >
                <Icon className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.2} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm font-cinzel text-amber-950">
                    {node.label}
                  </span>
                  {node.badge && (
                    <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide', node.badgeClass)}>
                      {node.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-800/60 font-semibold mt-0.5 truncate">
                  {node.subtitle}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-amber-700/40 flex-shrink-0 transition-transform group-hover:translate-x-1" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
