
import React from 'react';
import { Loader2 } from 'lucide-react';

interface AdLoaderProps {
  error?: string | null;
  isDevelopment: boolean;
  isRetrying?: boolean;
  retryAttempt?: number;
}

const AdLoader: React.FC<AdLoaderProps> = ({ 
  error, 
  isDevelopment, 
  isRetrying = false,
  retryAttempt = 0
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[80px] bg-secondary/10 rounded-lg">
      <div className="flex items-center space-x-2">
        {isRetrying ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-primary/20 animate-pulse" />
        )}
        <p className="text-sm text-muted-foreground">
          {isRetrying ? `Retrying (${retryAttempt}/3)...` : 'Loading advertisement...'}
        </p>
      </div>
      {error && isDevelopment && (
        <p className="text-xs text-destructive mt-2">{error}</p>
      )}
    </div>
  );
};

export default AdLoader;
