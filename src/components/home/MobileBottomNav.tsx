
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Brain, Trophy, User, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STORAGE_KEYS } from '@/utils/quizData';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem(STORAGE_KEYS.USER_ID);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Grid3X3, label: 'Categories', path: '/categories' },
    { icon: Brain, label: 'Play', path: '/quiz', primary: true },
    { icon: Trophy, label: 'Leaderboard', path: '/referral' },
    { icon: User, label: isLoggedIn ? 'Profile' : 'Login', path: isLoggedIn ? '/profile' : '/login' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-lg border-t border-border" />
      
      <div className="relative flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isPrimary = item.primary;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center min-w-[64px] py-1 px-3 rounded-xl transition-all",
                isActive && !isPrimary && "text-primary",
                !isActive && !isPrimary && "text-muted-foreground",
                isPrimary && "relative -mt-6"
              )}
            >
              {isPrimary ? (
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform",
                    "gradient-primary text-white",
                    isActive && "scale-110"
                  )}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    "text-xs mt-1 font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
              ) : (
                <>
                  <item.icon className={cn(
                    "w-5 h-5 mb-1 transition-transform",
                    isActive && "scale-110"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 w-1 h-1 rounded-full bg-primary" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
