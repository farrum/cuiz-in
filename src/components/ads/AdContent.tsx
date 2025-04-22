
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
  if (!adLoaded) {
    return <AdLoader error={adError} isDevelopment={isDevelopment} />;
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
