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
      className="relative z-40 bg-white"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        borderTop: '3px solid hsl(var(--border))',
        boxShadow: '0 -4px 10px rgba(0,0,0,0.05)'
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
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
                tab.primary && '-mt-8'
              )}
            >
              {tab.primary ? (
                <motion.div
                  whileTap={{ scale: 0.9, y: 4 }}
                  animate={active ? { scale: [1, 1.1, 1], y: [0, -4, 0] } : { scale: 1, y: 0 }}
                  transition={{ duration: 0.4, type: 'spring', stiffness: 400, damping: 15 }}
                  className="relative"
                >
                  <div className="w-16 h-16 flex items-center justify-center relative rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 border-4 border-white shadow-[0_4px_0_hsl(45,95%,45%)]">
                    <Icon className="w-8 h-8 text-white relative z-10 drop-shadow-md" strokeWidth={2.5} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  whileTap={{ scale: 0.85, y: 2 }}
                  animate={active ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="flex items-center justify-center w-10 h-10 rounded-xl relative"
                >
                  <Icon className={cn(
                    'w-6 h-6 transition-colors',
                    active ? 'text-primary drop-shadow-sm' : 'text-slate-400'
                  )} strokeWidth={active ? 2.5 : 2} />
                  {active && (
                    <motion.div 
                      layoutId="bottom-nav-indicator"
                      className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  )}
                </motion.div>
              )}
              <span className={cn(
                'text-[10px] mt-1 font-bold tracking-wide uppercase',
                active ? 'text-primary' : 'text-slate-400',
                'font-sans'
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