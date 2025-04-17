
import React from 'react';
import { Loader2 } from 'lucide-react';

interface AdContentProps {
  adLoaded: boolean;
  adContent: string;
  adDebug: string | null;
  adError: string | null;
  isDevelopment: boolean;
  position: string;
  slotId?: string;
  pageSection?: string;
  containerId: string;
}

const AdContent: React.FC<AdContentProps> = ({ 
  adLoaded,
  adContent,
  adDebug,
  adError,
  isDevelopment,
  position,
  slotId,
  pageSection,
  containerId
}) => {
  // If no content and not in development mode, return nothing
  if (!adLoaded && !isDevelopment) {
    return null;
  }
  
  if (!adLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground mt-2">Loading advertisement...</p>
        {isDevelopment && adDebug && (
          <div className="text-xs text-muted-foreground mt-2">{adDebug}</div>
        )}
      </div>
    );
  }
  
  return (
    <>
      {/* Render the ad content */}
      <div 
        id={containerId} 
        dangerouslySetInnerHTML={{ __html: adContent }}
        className="ad-content"
      />
      
      {/* Show debug info only in development */}
      {isDevelopment && (
        <div className="text-[8px] text-muted-foreground mt-1 opacity-50 truncate">
          {adDebug ? adDebug : `Ad: ${position}/${slotId || 'default'}`}
        </div>
      )}
    </>
  );
};

export default AdContent;
