import { NavLink, useLocation } from 'react-router-dom';
import { Home, Trophy, User, Swords } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHaptics } from '../hooks/useHaptics';

type Tab = { to: string; label: string; icon: typeof Home; primary?: boolean };
const tabs: Tab[] = [
  { to: '/hub',           label: 'Keep',   icon: Home   },
  { to: '/empire-quests', label: 'Quest',  icon: Swords, primary: true },
  { to: '/leaderboard',   label: 'Hall',   icon: Trophy },
  { to: '/profile',       label: 'Herald', icon: User   },
];

export function BottomTabs() {
  const haptics  = useHaptics();
  const location = useLocation();

  return (
    <nav
      id="mobile-bottom-tabs"
      className="relative z-40 overflow-hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(255, 252, 245, 0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.70)',
        boxShadow: '0 -1px 0 rgba(180, 140, 60, 0.18), 0 -8px 24px rgba(0,0,0,0.08)',
      }}
    >
      {/* Ambient shimmer stripe along the top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,220,100,0.55) 50%, transparent 100%)',
        }}
      />

      <div className="flex items-center justify-around px-1 pt-1.5 pb-1.5">
        {tabs.map((tab) => {
          const active = location.pathname === tab.to;
          const Icon   = tab.icon;

          return (
          <NavLink
              key={tab.to}
              to={tab.to}
              onClick={() => haptics(tab.primary ? 'medium' : 'light')}
              className="flex flex-col items-center justify-center py-1 min-w-[64px] rounded-xl relative"
            >
              <motion.div
                whileTap={{ scale: tab.primary ? 0.9 : 0.82, y: 2 }}
                animate={active ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className={cn(
                  'flex items-center justify-center rounded-2xl relative',
                  tab.primary ? 'w-12 h-12' : 'w-12 h-12',
                )}
              >
                {active && !tab.primary && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: 'hsl(38 80% 90%)' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}

                {tab.primary ? (
                  <div
                    className={cn(
                      'w-11 h-11 flex items-center justify-center rounded-full border-2 border-white shadow-md',
                      active
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                        : 'bg-gradient-to-br from-amber-300 to-amber-500',
                    )}
                    style={{
                      boxShadow: active
                        ? '0 3px 0 hsl(35 85% 35%), 0 4px 12px hsl(45 90% 55% / 0.45)'
                        : '0 3px 0 hsl(35 85% 38%), 0 4px 10px hsl(45 70% 50% / 0.25)',
                    }}
                  >
                    <Icon className="w-6 h-6 text-white relative z-10 drop-shadow-md" strokeWidth={2.5} />
                  </div>
                ) : (
                  <Icon
                    className={cn(
                      'w-[22px] h-[22px] transition-colors relative z-10',
                      active ? 'text-amber-800' : 'text-slate-400',
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                )}

                {active && !tab.primary && (
                  <motion.div
                    layoutId="bottom-nav-dot"
                    className="absolute -bottom-1.5 h-1.5 rounded-full bg-amber-600 aurora-dot"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
              </motion.div>

              <span
                className={cn(
                  'text-[9px] mt-0.5 font-extrabold tracking-[0.12em] uppercase transition-colors',
                  active ? 'text-amber-800' : 'text-slate-400',
                )}
              >
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