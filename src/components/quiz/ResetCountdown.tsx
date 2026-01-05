import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getTimeUntilReset, isUserLoggedIn } from '@/utils/guestPlayService';

interface ResetCountdownProps {
  className?: string;
  compact?: boolean;
}

const ResetCountdown: React.FC<ResetCountdownProps> = ({ className = '', compact = false }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReset());

  useEffect(() => {
    // Don't run timer for logged-in users
    if (isUserLoggedIn()) return;

    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilReset());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't show for logged-in users
  if (isUserLoggedIn()) return null;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className}`}>
        <Clock className="w-3.5 h-3.5" />
        <span>Resets in {formatTime(hours)}:{formatTime(minutes)}:{formatTime(seconds)}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Free plays reset in:</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="bg-primary/10 rounded px-2 py-1 min-w-[2.5rem] text-center">
          <span className="font-mono font-bold text-primary">{formatTime(hours)}</span>
        </div>
        <span className="text-muted-foreground">:</span>
        <div className="bg-primary/10 rounded px-2 py-1 min-w-[2.5rem] text-center">
          <span className="font-mono font-bold text-primary">{formatTime(minutes)}</span>
        </div>
        <span className="text-muted-foreground">:</span>
        <div className="bg-primary/10 rounded px-2 py-1 min-w-[2.5rem] text-center">
          <span className="font-mono font-bold text-primary">{formatTime(seconds)}</span>
        </div>
      </div>
    </div>
  );
};

export default ResetCountdown;
