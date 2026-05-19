import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarConfig {
  baseColor: string;
  eyes: 'normal' | 'happy' | 'cool' | 'smart';
  mouth: 'smile' | 'smirk' | 'open';
  headwear: 'none' | 'cap' | 'crown' | 'graduation';
  accessory: 'none' | 'glasses' | 'necklace';
}

interface ModularAvatarProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

export const ModularAvatar: React.FC<ModularAvatarProps> = ({
  config,
  size = 120,
  className
}) => {
  return (
    <div 
      className={cn("relative inline-block rounded-full overflow-hidden bg-slate-100", className)}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 100 100" 
        width={size} 
        height={size} 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base Face */}
        <circle cx="50" cy="50" r="45" fill={config.baseColor} />

        {/* Eyes */}
        {config.eyes === 'normal' && (
          <>
            <circle cx="35" cy="40" r="5" fill="#1e293b" />
            <circle cx="65" cy="40" r="5" fill="#1e293b" />
          </>
        )}
        {config.eyes === 'happy' && (
          <>
            <path d="M 30 40 Q 35 32 40 40" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 60 40 Q 65 32 70 40" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        {config.eyes === 'cool' && (
          <>
            <rect x="25" y="35" width="20" height="8" rx="2" fill="#1e293b" />
            <rect x="55" y="35" width="20" height="8" rx="2" fill="#1e293b" />
            <path d="M 45 35 L 55 35" stroke="#1e293b" strokeWidth="2" />
          </>
        )}
        {config.eyes === 'smart' && (
          <>
            <circle cx="35" cy="40" r="8" stroke="#1e293b" strokeWidth="2" fill="none" />
            <circle cx="35" cy="40" r="3" fill="#1e293b" />
            <circle cx="65" cy="40" r="8" stroke="#1e293b" strokeWidth="2" fill="none" />
            <circle cx="65" cy="40" r="3" fill="#1e293b" />
            <path d="M 43 40 L 57 40" stroke="#1e293b" strokeWidth="2" />
          </>
        )}

        {/* Mouth */}
        {config.mouth === 'smile' && (
          <path d="M 35 65 Q 50 80 65 65" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
        {config.mouth === 'smirk' && (
          <path d="M 40 65 Q 50 65 65 60" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
        {config.mouth === 'open' && (
          <ellipse cx="50" cy="70" rx="10" ry="12" fill="#1e293b" />
        )}

        {/* Headwear */}
        {config.headwear === 'cap' && (
          <>
            <path d="M 15 35 Q 50 15 85 35 L 85 25 Q 50 5 15 25 Z" fill="#ef4444" />
            <path d="M 85 35 L 100 35 L 90 25 Z" fill="#ef4444" />
          </>
        )}
        {config.headwear === 'crown' && (
          <path d="M 25 35 L 20 10 L 35 20 L 50 5 L 65 20 L 80 10 L 75 35 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
        )}
        {config.headwear === 'graduation' && (
          <>
            <polygon gems="50,5 90,20 50,35 10,20" fill="#1e293b" />
            <rect x="35" y="25" width="30" height="15" fill="#1e293b" />
            <path d="M 85 20 L 85 45" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="85" cy="45" r="3" fill="#fbbf24" />
          </>
        )}

        {/* Accessories */}
        {config.accessory === 'glasses' && (
          <>
            <rect x="25" y="32" width="22" height="16" rx="4" stroke="#ef4444" strokeWidth="3" fill="rgba(255,255,255,0.3)" />
            <rect x="53" y="32" width="22" height="16" rx="4" stroke="#ef4444" strokeWidth="3" fill="rgba(255,255,255,0.3)" />
            <path d="M 47 40 L 53 40" stroke="#ef4444" strokeWidth="3" />
            <path d="M 10 38 L 25 38" stroke="#ef4444" strokeWidth="3" />
            <path d="M 75 38 L 90 38" stroke="#ef4444" strokeWidth="3" />
          </>
        )}
        {config.accessory === 'necklace' && (
          <path d="M 30 80 Q 50 95 70 80" stroke="#fbbf24" strokeWidth="3" fill="none" />
        )}
      </svg>
    </div>
  );
};
