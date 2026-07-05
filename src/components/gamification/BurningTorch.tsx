import React from 'react';
import { cn } from '@/lib/utils';

interface BurningTorchProps {
  className?: string;
  glowColor?: string;
}

export function BurningTorch({ className, glowColor = 'rgba(245, 158, 11, 0.25)' }: BurningTorchProps) {
  return (
    <div className={cn("relative flex flex-col items-center select-none pointer-events-none w-12 h-24", className)}>
      {/* Self-contained CSS styles for portability */}
      <style>{`
        @keyframes flame-wave {
          0%, 100% { transform: scale(1) rotate(-1deg); }
          50% { transform: scale(1.06) rotate(2deg) skewX(2deg); }
        }
        @keyframes flame-inner-wave {
          0%, 100% { transform: scale(1) rotate(1deg); }
          50% { transform: scale(0.95) rotate(-2deg); }
        }
        @keyframes torch-flicker-ambient {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          20% { opacity: 0.95; transform: scale(1.04); }
          40% { opacity: 0.8; transform: scale(0.98); }
          60% { opacity: 0.92; transform: scale(1.02); }
          80% { opacity: 0.87; transform: scale(0.99); }
        }
        @keyframes ember-rise-1 {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-40px) translateX(-5px) scale(0.2); opacity: 0; }
        }
        @keyframes ember-rise-2 {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-35px) translateX(6px) scale(0.3); opacity: 0; }
        }
        .flame-outer {
          animation: flame-wave 1.6s infinite ease-in-out;
          transform-origin: bottom center;
        }
        .flame-inner {
          animation: flame-inner-wave 1.2s infinite ease-in-out;
          transform-origin: bottom center;
        }
        .glow-sphere {
          animation: torch-flicker-ambient 2.5s infinite ease-in-out;
        }
        .ember-p1 {
          animation: ember-rise-1 1.8s infinite linear;
        }
        .ember-p2 {
          animation: ember-rise-2 1.4s infinite linear;
          animation-delay: 0.5s;
        }
      `}</style>

      {/* Ambient warm radial glow */}
      <div 
        className="glow-sphere absolute -top-8 w-24 h-24 rounded-full blur-xl mix-blend-screen"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />

      {/* Flame SVG Assembly */}
      <svg className="w-8 h-12 overflow-visible" viewBox="0 0 100 150">
        {/* Outer Flame (Orange) */}
        <path 
          className="flame-outer fill-amber-600/90 filter drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" 
          d="M50 140 C10 140 10 90 50 20 C90 90 90 140 50 140 Z" 
        />
        
        {/* Mid Flame (Yellow) */}
        <path 
          className="flame-inner fill-yellow-500/90 filter drop-shadow-[0_0_6px_rgba(234,179,8,0.7)]" 
          d="M50 140 C20 140 25 100 50 40 C75 100 80 140 50 140 Z" 
        />
        
        {/* Inner core (White-hot) */}
        <path 
          className="flame-outer fill-yellow-100 filter drop-shadow-[0_0_3px_#fff]" 
          d="M50 135 C35 135 35 110 50 70 C65 110 65 135 50 135 Z" 
        />

        {/* Embers */}
        <circle className="ember-p1 fill-amber-400" cx="45" cy="50" r="2.5" />
        <circle className="ember-p2 fill-yellow-400" cx="55" cy="65" r="2" />
        <circle className="ember-p1 fill-orange-400" cx="50" cy="80" r="1.5" style={{ animationDelay: '0.9s' }} />
      </svg>

      {/* Wall Bracket Holder (Dark Bronze Metal) */}
      <div className="w-2.5 h-6 bg-gradient-to-b from-amber-900 to-stone-950 rounded-b-sm border-t border-amber-800/40 relative z-10 shadow-md">
        {/* Bracket metal ring */}
        <div className="absolute top-0.5 inset-x-0.5 h-1 bg-stone-850 rounded-full" />
      </div>
    </div>
  );
}
