
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AdIframeProps {
  content: string;
  position: string;
  slotId?: string;
  className?: string;
  skipTopics?: boolean;
}

const AdIframe: React.FC<AdIframeProps> = ({
  content,
  position,
  slotId,
  className,
  skipTopics = false
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (iframeRef.current && content) {
      try {
        const iframe = iframeRef.current;
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;

        if (iframeDocument) {
          // Create a clean HTML document with necessary meta tags
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                ${skipTopics ? '<meta name="browsing-topics" content="none">' : ''}
                <meta http-equiv="Content-Security-Policy" content="frame-ancestors 'self'">
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: transparent;
                    overflow: hidden;
                  }
                  .ad-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                  }
                  img {
                    max-width: 100%;
                    height: auto;
                  }
                </style>
                <script>
                  // Error handling for the iframe
                  window.onerror = function(message, source, lineno, colno, error) {
                    console.log('Ad iframe error:', message);
                    // Don't propagate errors to parent window
                    return true;
                  };
                  
                  // Log when content is loaded
                  window.onload = function() {
                    console.log('Ad iframe content loaded for ${position}/${slotId || 'default'}');
                    window.parent.postMessage({ type: 'adLoaded', position: '${position}', slotId: '${slotId || 'default'}' }, '*');
                  };
                </script>
              </head>
              <body>
                <div class="ad-container">${content}</div>
              </body>
            </html>
          `;

          setIframeError(null);
          iframeDocument.open();
          iframeDocument.write(html);
          iframeDocument.close();
          setIframeLoaded(true);
          
          // Add a message listener to receive messages from the iframe
          const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'adLoaded') {
              console.log(`Ad iframe reported content loaded: ${event.data.position}/${event.data.slotId}`);
            }
          };
          
          window.addEventListener('message', handleMessage);
          return () => {
            window.removeEventListener('message', handleMessage);
          };
        } else {
          console.error('Could not access iframe document');
          setIframeError('Could not access iframe document');
        }
      } catch (err) {
        console.error('Error loading ad into iframe:', err);
        setIframeError(err instanceof Error ? err.message : 'Error loading ad content');
      }
    }
  }, [content, position, slotId, skipTopics]);

  // Determine min-height based on position
  const getMinHeight = () => {
    if (position === 'sidebar') return 'min-h-[600px]';
    if (position === 'top' || position === 'bottom') return 'min-h-[120px]';
    return 'min-h-[250px]';
  };

  return (
    <>
      <iframe
        ref={iframeRef}
        className={cn(
          'w-full border-0 overflow-hidden bg-transparent',
          getMinHeight(),
          className
        )}
        sandbox="allow-scripts allow-same-origin allow-popups"
        loading="lazy"
        data-ad-position={position}
        data-ad-slot={slotId || position}
        data-skip-topics={skipTopics.toString()}
        data-iframe-loaded={iframeLoaded.toString()}
      />
      {iframeError && (
        <div className="text-xs text-red-500 mt-1 text-center">
          Error: {iframeError}
        </div>
      )}
    </>
  );
};

export default AdIframe;
