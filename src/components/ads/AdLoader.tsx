
import React from 'react';

interface AdLoaderProps {
  error?: string | null;
  isDevelopment: boolean;
}

const AdLoader: React.FC<AdLoaderProps> = ({ error, isDevelopment }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[80px] bg-secondary/10 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading advertisement...</p>
      </div>
      {error && isDevelopment && (
        <p className="text-xs text-destructive mt-2">{error}</p>
      )}
    </div>
  );
};

export default AdLoader;
