
import React from 'react';
import AdLoader from './AdLoader';
import AdIframe from './AdIframe';

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
  adBlockDetected?: boolean;
  topicsError?: boolean;
  skipTopics?: boolean;
}

const AdContent: React.FC<AdContentProps> = ({
  adLoaded,
  adContent,
  adDebug,
  adError,
  isDevelopment,
  position,
  slotId,
  skipTopics = false,
  adBlockDetected = false,
  topicsError = false
}) => {
  // Log for debugging
  if (isDevelopment) {
    console.log(`AdContent rendering for ${position}/${slotId || position}:`, {
      adLoaded,
      contentLength: adContent ? adContent.length : 0,
      hasError: !!adError,
      hasDebug: !!adDebug,
      adBlockDetected,
      topicsError,
      skipTopics
    });
  }
  
  if (!adLoaded) {
    return <AdLoader error={adError} isDevelopment={isDevelopment} />;
  }

  // Check if ad content is empty or invalid
  const hasValidContent = adContent && adContent.trim().length > 0;
  if (!hasValidContent && isDevelopment) {
    return (
      <div className="w-full">
        <p className="text-xs text-muted-foreground mb-2 text-center">Advertisement</p>
        <div className="p-4 border border-red-300 rounded bg-red-50 text-red-700 text-xs">
          <p>Empty or invalid ad content for {position}/{slotId || position}</p>
          {adError && <p className="mt-1">Error: {adError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground mb-2 text-center">Advertisement</p>
      {isDevelopment && (adDebug || adError || adBlockDetected || topicsError) && (
        <div className="mb-2 text-center">
          {adDebug && <p className="text-xs text-blue-500">{adDebug}</p>}
          {adError && <p className="text-xs text-red-500">{adError}</p>}
          {adBlockDetected && <p className="text-xs text-amber-500">Ad blocker detected</p>}
          {topicsError && <p className="text-xs text-red-500">Topics API attestation failed</p>}
          {skipTopics && <p className="text-xs text-green-500">Topics API skipped</p>}
          <p className="text-xs text-muted-foreground">
            Position: {position} / Slot: {slotId || position}
          </p>
        </div>
      )}
      
      <AdIframe
        content={adContent}
        position={position}
        slotId={slotId}
        skipTopics={skipTopics}
      />
    </div>
  );
};

export default AdContent;
