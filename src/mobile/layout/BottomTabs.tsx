import { NavLink, useLocation } from 'react-router-dom';
import { Home, Trophy, User, Swords, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHaptics } from '../hooks/useHaptics';

type Tab = { to: string; label: string; icon: typeof Home; primary?: boolean };
const tabs: Tab[] = [
  { to: '/hub', label: 'Keep', icon: Home },
  { to: '/empire-quests', label: 'Quest', icon: Swords, primary: true },
  { to: '/leaderboard', label: 'Hall', icon: Trophy },
  { to: '/profile', label: 'Herald', icon: User },
];

export function BottomTabs() {
  const haptics = useHaptics();
  const location = useLocation();
  return (
    <nav
      className="relative z-40 wooden-door"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        borderTop: '2px solid hsl(35 20% 28%)',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
      }}
    >
      {/* Iron rivets across the top edge */}
      <div className="absolute top-1 left-4 right-4 flex justify-between pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="iron-rivet" />
        ))}
      </div>

      <div className="flex items-center justify-around px-2 pt-3 pb-1">
        {tabs.map((tab) => {
          const active = location.pathname === tab.to;
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              onClick={() => haptics(tab.primary ? 'medium' : 'light')}
              className={cn(
                'flex flex-col items-center justify-center py-1 min-w-[60px] rounded-xl transition-colors relative',
                tab.primary && '-mt-7'
              )}
            >
              {tab.primary ? (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  {/* Shield shape */}
                  <div className="w-14 h-14 flex items-center justify-center relative">
                    <Shield
                      className="absolute inset-0 w-14 h-14 text-amber-600 fill-amber-900/80 drop-shadow-lg"
                    />
                    <Icon className="w-6 h-6 text-yellow-300 relative z-10 drop-shadow-sm" />
                  </div>
                  {/* Glowing torch indicator when active */}
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                      <div className="torch-glow" style={{ width: 14, height: 18 }} />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex items-center justify-center w-9 h-9 rounded-lg relative"
                >
                  <Icon className={cn(
                    'w-5 h-5 transition-colors',
                    active ? 'text-yellow-500' : 'text-stone-500'
                  )} />
                  {/* Torch flame under active tab */}
                  {active && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
                      <div className="torch-glow" style={{ width: 10, height: 12 }} />
                    </div>
                  )}
                </motion.div>
              )}
              <span className={cn(
                'text-[9px] mt-0.5 font-black tracking-widest uppercase',
                active ? 'text-yellow-500' : 'text-stone-500',
                'font-serif'
              )}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomTabs;