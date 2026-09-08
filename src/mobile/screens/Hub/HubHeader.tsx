/**
 * HubHeader — compact currency + streak display for the Hub sticky top bar.
 * Data reads from localStorage immediately and receives synced props from HubScreen.
 */
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { GemCounter } from '@/mobile/components/GemCounter';
import { StarCounter } from '@/mobile/components/StarCounter';
import { StreakFlame } from '@/mobile/components/StreakFlame';

interface HubHeaderProps {
  name: string;
  gems: number;
  stars: number;
  streak: number;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'High Sovereign',
  team_leader: 'Grand Commander',
  junior_team_leader: 'Knight Captain',
  player: 'Realm Scholar',
};

export function HubHeader({ name, gems, stars, streak, role }: HubHeaderProps) {
  const title = ROLE_LABELS[role] ?? ROLE_LABELS.player;

  return (
    <div className="flex items-center gap-3">
      {/* Name + title */}
      <div>
        <div className="flex items-center gap-1 mb-0.5">
          <Crown className="w-2.5 h-2.5 text-amber-600" />
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700/55">
            {title}
          </span>
        </div>
        <p className="text-sm font-black leading-tight" style={{ color: 'hsl(30 60% 18%)' }}>
          {name}
        </p>
      </div>

      {/* Divider */}
      <div className="w-px h-7 bg-amber-200/60 rounded-full" />

      {/* Currency counters */}
      <div className="flex items-center gap-2">
        <GemCounter value={gems} />
        <StarCounter value={stars} />
      </div>

      {/* Divider */}
      <div className="w-px h-7 bg-amber-200/60 rounded-full" />

      {/* Streak */}
      <StreakFlame streak={streak} />
    </div>
  );
}
