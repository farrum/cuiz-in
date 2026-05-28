import { NavLink, useLocation } from 'react-router-dom';
import { Home, Trophy, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHaptics } from '../hooks/useHaptics';

const tabs = [
  { to: '/hub', label: 'Home', icon: Home },
  { to: '/quiz', label: 'Play', icon: Zap, primary: true },
  { to: '/leaderboard', label: 'Ranks', icon: Trophy },
  { to: '/profile', label: 'Me', icon: User },
] as const;

export function BottomTabs() {
  const haptics = useHaptics();
  const location = useLocation();
  return (
    <nav
      className="relative z-40 border-t border-border bg-card/95 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const active = location.pathname === tab.to;
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              onClick={() => haptics(tab.primary ? 'medium' : 'light')}
              className={cn(
                'flex flex-col items-center justify-center py-1 min-w-[60px] rounded-xl transition-colors',
                tab.primary && '-mt-6'
              )}
            >
              {tab.primary ? (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-primary-foreground shadow-lg bg-gradient-to-br from-primary via-purple-500 to-pink-500"
                >
                  <Icon className="w-7 h-7" />
                </motion.div>
              ) : (
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={cn('flex items-center justify-center w-9 h-9 rounded-lg', active && 'text-primary')}
                >
                  <Icon className={cn('w-5 h-5', active ? 'text-primary' : 'text-muted-foreground')} />
                </motion.div>
              )}
              <span className={cn(
                'text-[10px] mt-0.5 font-semibold',
                active ? 'text-primary' : 'text-muted-foreground'
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