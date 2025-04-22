
import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (iframeRef.current && content) {
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
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: transparent;
                }
                .ad-container {
                  width: 100%;
                  height: 100%;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
              </style>
            </head>
            <body>
              <div class="ad-container">${content}</div>
            </body>
          </html>
        `;

        iframeDocument.open();
        iframeDocument.write(html);
        iframeDocument.close();
      }
    }
  }, [content, skipTopics]);

  // Determine min-height based on position
  const getMinHeight = () => {
    if (position === 'sidebar') return 'min-h-[600px]';
    if (position === 'top' || position === 'bottom') return 'min-h-[120px]';
    return 'min-h-[250px]';
  };

  return (
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
    />
  );
};

export default AdIframe;
