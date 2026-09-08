/**
 * HubPlayCards — "Play" tab panel.
 * Contains the Royal Chambers quick-action cards + an in-feed ad.
 */
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Sparkles, Swords, Landmark, Users,
  ChevronRight, Flame, Star,
} from 'lucide-react';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { ScrollAdBanner } from '@/mobile/ads/ScrollAdBanner';
import { cn } from '@/lib/utils';

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
    subtitle: 'Complete for 2× rewards',
    to: '/daily',
    icon: Calendar,
    color: 'from-rose-500 to-red-600',
    glow: 'rgba(239, 68, 68, 0.35)',
    badge: 'HOT',
    badgeClass: 'bg-rose-400 text-white',
  },
  {
    id: 'quiz',
    label: 'Quick Quiz',
    subtitle: 'Answer & build streaks',
    to: '/quiz',
    icon: Sparkles,
    color: 'from-violet-500 to-pink-600',
    glow: 'rgba(168, 85, 247, 0.35)',
  },
  {
    id: 'quests',
    label: 'Quest Board',
    subtitle: 'Conquer campaign stages',
    to: '/empire-quests',
    icon: Swords,
    color: 'from-amber-500 to-orange-600',
    glow: 'rgba(245, 158, 11, 0.35)',
  },
  {
    id: 'kingdoms',
    label: 'Kingdoms Dynasty',
    subtitle: 'Establish your faction',
    to: '/kingdoms',
    icon: Landmark,
    color: 'from-blue-600 to-indigo-700',
    glow: 'rgba(79, 70, 229, 0.35)',
  },
  {
    id: 'team',
    label: 'Team & Squad',
    subtitle: 'Earn recurring gems',
    to: '/team-dashboard',
    icon: Users,
    color: 'from-indigo-500 to-purple-700',
    glow: 'rgba(139, 92, 246, 0.35)',
    badge: 'Squad',
    badgeClass: 'bg-indigo-400 text-white',
  },
];

interface Props {
  onNavigate?: (to: string) => void;
}

export function HubPlayCards({ onNavigate }: Props) {
  const navigate = useNavigate();
  const haptics = useHaptics();

  const go = (to: string) => {
    haptics('medium');
    onNavigate?.(to);
    navigate(to);
  };

  return (
    <div className="hub-tab-panel px-4 py-3 space-y-2.5 pb-4">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-1">
        <span className="h-px flex-1 section-divider-shimmer rounded-full" />
        <span className="text-[10px] font-black tracking-[0.18em] uppercase text-amber-900/50">
          Royal Chambers
        </span>
        <span className="h-px flex-1 section-divider-shimmer rounded-full" />
      </div>

      {PLAY_NODES.map((node, idx) => {
        const Icon = node.icon;
        return (
          <motion.button
            key={node.id}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={() => go(node.to)}
            className="w-full flex items-center gap-3.5 rounded-2xl p-3.5 text-left game-card-glow"
            style={{
              background: 'linear-gradient(145deg, hsl(40 70% 97%) 0%, hsl(36 55% 93%) 100%)',
              border: '1px solid rgba(180,140,60,0.18)',
              boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 14px rgba(120,80,20,0.09)`,
            }}
          >
            {/* Icon bubble */}
            <div
              className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br', node.color)}
              style={{ boxShadow: `0 4px 12px ${node.glow}` }}
            >
              <Icon className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.2} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm" style={{ color: 'hsl(30 55% 20%)' }}>
                  {node.label}
                </span>
                {node.badge && (
                  <span className={cn('text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide', node.badgeClass)}>
                    {node.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800/50 font-semibold mt-0.5 truncate">
                {node.subtitle}
              </p>
            </div>

            <ChevronRight className="w-4 h-4 text-amber-700/30 flex-shrink-0" />
          </motion.button>
        );
      })}

      {/* In-tab ad banner */}
      <div className="pt-2">
        <ScrollAdBanner slotId="hub-play-tab" position="hub-play" fallbackIndex={0} />
      </div>
    </div>
  );
}
