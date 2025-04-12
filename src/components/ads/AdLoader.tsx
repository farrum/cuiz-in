
import React from 'react';

interface AdLoaderProps {
  error?: string | null;
  isDevelopment: boolean;
}

const AdLoader: React.FC<AdLoaderProps> = ({ error, isDevelopment }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
      <p className="text-sm text-muted-foreground">Loading advertisement...</p>
      {error && isDevelopment && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

export default AdLoader;
