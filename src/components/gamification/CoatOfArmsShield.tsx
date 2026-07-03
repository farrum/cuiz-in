import React from 'react';
import { cn } from '@/lib/utils';

interface CoatOfArmsShieldProps {
  crestString: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CoatOfArmsShield: React.FC<CoatOfArmsShieldProps> = ({
  crestString,
  className,
  size = 'md'
}) => {
  // Parse crest string: "pattern|colorCombination|chargeEmoji"
  // Default fallback: solid|sable-or|🦁
  const defaultCrest = 'solid|sable-or|🦁';
  const parts = (crestString || defaultCrest).split('|');
  const pattern = parts[0] || 'solid';
  const colorCombo = parts[1] || 'sable-or';
  const charge = parts[2] || '🦁';

  const [colorA, colorB] = colorCombo.split('-');
  
  // Resolve hex colors for SVG
  const colorsMap: Record<string, { main: string; dark: string }> = {
    gules: { main: '#b91c1c', dark: '#7f1d1d' }, // Crimson
    azure: { main: '#1d4ed8', dark: '#1e3a8a' }, // Sapphire
    or: { main: '#eab308', dark: '#78350f' },    // Gold
    sable: { main: '#1f2937', dark: '#030712' }   // Obsidian
  };

  const getTheme = (name: string) => colorsMap[name] || colorsMap.sable;

  const themeA = getTheme(colorA);
  const themeB = getTheme(colorB || colorA);

  const dimensions = {
    sm: { width: 'w-10', height: 'h-10', text: 'text-lg' },
    md: { width: 'w-14', height: 'h-14', text: 'text-2xl' },
    lg: { width: 'w-20', height: 'h-20', text: 'text-4xl' }
  }[size];

  return (
    <div className={cn("relative flex items-center justify-center select-none drop-shadow-md animate-wind", dimensions.width, dimensions.height, className)}>
      {/* Dynamic SVG heater shield shape */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id={`grad-A-${crestString}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={themeA.main} />
            <stop offset="100%" stopColor={themeA.dark} />
          </linearGradient>
          <linearGradient id={`grad-B-${crestString}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={themeB.main} />
            <stop offset="100%" stopColor={themeB.dark} />
          </linearGradient>

          {/* Clip path of the shield inside area */}
          <clipPath id={`shield-clip-${crestString}`}>
            <path d="M 50 2 C 82 2, 98 18, 98 48 C 98 75, 75 92, 50 98 C 25 92, 2 75, 2 48 C 2 18, 18 2, 50 2 Z" />
          </clipPath>
        </defs>

        {/* Outer Gold Border */}
        <path
          d="M 50 0 C 85 0, 100 16, 100 48 C 100 78, 75 95, 50 100 C 25 95, 0 78, 0 48 C 0 16, 15 0, 50 0 Z"
          fill="#d97706"
          stroke="#fef08a"
          strokeWidth="1.5"
        />

        {/* Inner Gold Line */}
        <path
          d="M 50 3 C 81 3, 96 18, 96 48 C 96 74, 74 91, 50 97 C 26 91, 4 74, 4 48 C 4 18, 19 3, 50 3 Z"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="0.8"
        />

        {/* Shield Pattern Fills (Clipped to inside area) */}
        <g clipPath={`url(#shield-clip-${crestString})`}>
          {pattern === 'solid' && (
            <rect width="100" height="100" fill={`url(#grad-A-${crestString})`} />
          )}

          {pattern === 'vertical' && (
            <>
              <rect x="0" y="0" width="50" height="100" fill={`url(#grad-A-${crestString})`} />
              <rect x="50" y="0" width="50" height="100" fill={`url(#grad-B-${crestString})`} />
            </>
          )}

          {pattern === 'diagonal' && (
            <>
              <polygon points="0,0 100,0 0,100" fill={`url(#grad-A-${crestString})`} />
              <polygon points="100,0 100,100 0,100" fill={`url(#grad-B-${crestString})`} />
            </>
          )}

          {pattern === 'cross' && (
            <>
              {/* Quadrant 1 (Top Left) & 4 (Bottom Right) */}
              <rect x="0" y="0" width="50" height="50" fill={`url(#grad-A-${crestString})`} />
              <rect x="50" y="50" width="50" height="50" fill={`url(#grad-A-${crestString})`} />
              {/* Quadrant 2 (Top Right) & 3 (Bottom Left) */}
              <rect x="50" y="0" width="50" height="50" fill={`url(#grad-B-${crestString})`} />
              <rect x="0" y="50" width="50" height="50" fill={`url(#grad-B-${crestString})`} />
            </>
          )}
        </g>
      </svg>

      {/* Charge/Emoji Center Layer */}
      <span className={cn("absolute z-10 select-none animate-[pulse_6s_ease-in-out_infinite]", dimensions.text)}>
        {charge}
      </span>
    </div>
  );
};
