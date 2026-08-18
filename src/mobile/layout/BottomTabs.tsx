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
              className={cn(
                'flex flex-col items-center justify-center py-1 min-w-[64px] rounded-xl relative',
                tab.primary && '-mt-9',
              )}
            >
              {tab.primary ? (
                <motion.div
                  whileTap={{ scale: 0.88, y: 5 }}
                  animate={
                    active
                      ? { scale: [1, 1.08, 1], y: [0, -5, 0] }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ duration: 0.45, type: 'spring', stiffness: 380, damping: 14 }}
                  className="relative"
                >
                  {/* Golden outer glow ring */}
                  <div
                    className="absolute -inset-1 rounded-full opacity-70"
                    style={{
                      background: 'radial-gradient(circle, hsl(45 95% 65% / 0.6) 0%, transparent 70%)',
                      filter: 'blur(6px)',
                    }}
                  />
                  <div
                    className="w-[62px] h-[62px] flex items-center justify-center relative rounded-full border-4 border-white"
                    style={{
                      background: 'linear-gradient(145deg, hsl(48 96% 55%), hsl(35 95% 48%))',
                      boxShadow: active
                        ? '0 4px 0 hsl(35 85% 35%), 0 6px 24px hsl(45 90% 55% / 0.55)'
                        : '0 4px 0 hsl(35 85% 38%), 0 6px 16px hsl(45 70% 50% / 0.35)',
                    }}
                  >
                    <Icon className="w-7 h-7 text-white relative z-10 drop-shadow-md" strokeWidth={2.5} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  whileTap={{ scale: 0.82, y: 2 }}
                  animate={active ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                  className="flex items-center justify-center w-12 h-12 rounded-2xl relative"
                >
                  {active && (
                    <motion.div
                      layoutId="tab-bg"
                      className="absolute inset-0 rounded-2xl"
                      style={{ background: 'hsl(38 80% 90%)' }}
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      'w-[22px] h-[22px] transition-colors relative z-10',
                      active ? 'text-amber-800' : 'text-slate-400',
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {active && (
                    <motion.div
                      layoutId="bottom-nav-dot"
                      className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-amber-700"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    />
                  )}
                </motion.div>
              )}

              <span
                className={cn(
                  'text-[9px] mt-0.5 font-extrabold tracking-[0.12em] uppercase transition-colors',
                  active ? 'text-amber-800' : 'text-slate-400',
                  tab.primary && 'mt-1',
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