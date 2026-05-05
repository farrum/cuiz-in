import React from 'react';
import { cn } from '@/lib/utils';

interface AdPlaceholderProps {
  position: 'top' | 'middle' | 'bottom' | 'sidebar';
  className?: string;
  forceShow?: boolean;
  size?: '728x90' | '300x250' | '320x50';
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ 
  position, 
  className, 
  forceShow = false,
  size = '728x90'
}) => {
  const getDimensions = () => {
    if (size) {
      const [w, h] = size.split('x').map(Number);
      return { width: w, height: h };
    }
    
    switch (position) {
      case 'sidebar':
        return { width: 300, height: 250 };
      case 'top':
      case 'bottom':
      case 'middle':
      default:
        return { width: 728, height: 90 };
    }
  };

  const { width, height } = getDimensions();

  return (
    <div 
      className={cn(
        "w-full flex items-center justify-center bg-muted/10 border border-muted-foreground/10 overflow-hidden",
        className
      )}
      style={{ minHeight: `${height}px` }}
    >
      <img 
        src={`https://placehold.co/${width}x${height}?text=Advertisement+(${width}x${height})`}
        alt="Advertisement Placeholder"
        className="max-w-full h-auto opacity-70 grayscale hover:grayscale-0 transition-all"
        width={width}
        height={height}
      />
    </div>
  );
};

export default AdPlaceholder;
