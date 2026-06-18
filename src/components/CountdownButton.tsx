
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface CountdownButtonProps {
  onCountdownComplete: () => void;
  initialSeconds: number;
  children: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const CountdownButton: React.FC<CountdownButtonProps> = ({
  onCountdownComplete,
  initialSeconds,
  children,
  icon,
  disabled = false,
  className = "",
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Reset immediately so a parent re-render (e.g. points update changing
      // the onCountdownComplete reference) can't re-trigger this effect and
      // fire the completion handler multiple times.
      setCountdown(null);
      onCountdownComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const handleClick = () => {
    setCountdown(initialSeconds);
  };

  return (
    <Button 
      onClick={handleClick}
      className={`${className}`}
      disabled={disabled || countdown !== null}
    >
      {countdown !== null ? (
        <span className="flex items-center gap-2">
          <Clock className="h-5 w-5 animate-pulse" />
          {children} in {countdown}s
        </span>
      ) : (
        <>
          {children}
          {icon && <span className="ml-2">{icon}</span>}
        </>
      )}
    </Button>
  );
};

export default CountdownButton;
