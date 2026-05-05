import React from 'react';
import { cn } from '@/lib/utils';

interface AdPlaceholderProps {
  position: 'top' | 'middle' | 'bottom' | 'sidebar';
  className?: string;
  forceShow?: boolean;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ position, className, forceShow = false }) => {
  // Only show placeholder in development or if explicitly forced
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && !forceShow) {
    return <div className="h-0 w-0 overflow-hidden" aria-hidden="true" />;
  }

  const getHeight = () => {
    switch (position) {
      case 'sidebar':
        return 'min-h-[250px]';
      case 'top':
      case 'bottom':
        return 'min-h-[90px]';
      case 'middle':
        return 'min-h-[100px]';
      default:
        return 'min-h-[90px]';
    }
  };

  return (
    <div 
      className={cn(
        "w-full rounded-lg bg-muted/30 border border-dashed border-muted-foreground/20 flex items-center justify-center",
        getHeight(),
        className
      )}
    >
      <span className="text-xs text-muted-foreground/50">Ad Space ({position})</span>
    </div>
  );
};

export default AdPlaceholder;
