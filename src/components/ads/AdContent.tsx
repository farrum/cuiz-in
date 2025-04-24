
import React, { useEffect, useRef, useState } from 'react';
import { useScriptExecution } from '@/hooks/useScriptExecution';
import AdLoader from './AdLoader';
import { toast } from 'sonner';

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
  pageSection,
  containerId,
  adBlockDetected = false,
  topicsError = false,
  skipTopics = true
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerReady, setContainerReady] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [contentVersion, setContentVersion] = useState<number>(0);
  const [containerRecoveryAttempt, setContainerRecoveryAttempt] = useState(0);
  
  // Set up container before executing scripts
  useEffect(() => {
    const initContainer = () => {
      if (contentRef.current) {
        // Ensure the container has an ID attribute
        if (contentRef.current.id !== containerId) {
          contentRef.current.id = containerId;
        }
        
        // Set a data attribute to mark the container as initialized
        contentRef.current.setAttribute('data-initialized', 'true');
        contentRef.current.setAttribute('data-position', position);
        contentRef.current.setAttribute('data-slot-id', slotId || 'default');
        contentRef.current.setAttribute('data-skip-topics', String(skipTopics));
        
        // Set container as ready
        setContainerReady(true);
        console.log(`Container initialized with ID: ${containerId}`);
        return true;
      }
      return false;
    };
    
    // Try to initialize container
    const initialized = initContainer();
    
    // If initialization failed, try again in 100ms
    if (!initialized) {
      const timer = setTimeout(() => {
        const retrySucceeded = initContainer();
        if (!retrySucceeded) {
          console.error(`Failed to initialize container for ${position} after retry`);
          setContainerRecoveryAttempt(prev => prev + 1);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [containerId, position, slotId, skipTopics, containerRecoveryAttempt]);
  
  // Attempt container recovery if it failed to initialize
  useEffect(() => {
    if (containerRecoveryAttempt > 0 && containerRecoveryAttempt < 5 && !containerReady) {
      console.log(`Attempting container recovery for ${position}, attempt ${containerRecoveryAttempt}`);
      
      const recoveryTimer = setTimeout(() => {
        // Force DOM refresh by incrementing content version
        setContentVersion(prev => prev + 1);
      }, 500 * containerRecoveryAttempt); // Increasing backoff
      
      return () => clearTimeout(recoveryTimer);
    }
  }, [containerRecoveryAttempt, containerReady, position]);
  
  // Clean content of problematic scripts
  const cleanedContent = React.useMemo(() => {
    if (!adContent) return '';
    
    // Remove TCPusher and problematic scripts
    const blockedScripts = [
      'onclickpsh.com',
      'mrtnsvr.com',
      'TCPusher',
      'push.js',
      'vo2pn0.js',
      'sdk/push',
      'serviceWorker.register',
      'ServiceWorker.register',
      'Notification.requestPermission',
      'Va3pn0.js',
      'push.m.js',
      'facebook.com'
    ];

    // Always block Topics API related things
    blockedScripts.push(
      'document.browsingTopics',
      'navigator.runAdAuction',
      'adspector.io',
      'cuiz.in/topics',
      'Topics',
      'attestation'
    );
    
    let content = adContent;
    
    // Remove script tags containing blocked domains
    blockedScripts.forEach(domain => {
      const regex = new RegExp(`<script[^>]*${domain}[^>]*>[\\s\\S]*?<\\/script>`, 'gi');
      content = content.replace(regex, '<!-- Problematic script removed -->');
    });
    
    // Remove service worker registrations more aggressively
    const swRegex = /<script[^>]*>[^<]*(serviceWorker|ServiceWorker)[^<]*(register)[^<]*<\/script>/gi;
    content = content.replace(swRegex, '<!-- Service worker registration removed -->');
    
    // Remove Topics API-related code
    content = content.replace(/document\.browsingTopics\([^)]*\)/g, 
                            "console.log('Topics API call blocked')");
    
    // Remove Privacy Sandbox / Topics API calls
    content = content.replace(/navigator\.runAdAuction/g, "console.log");
    
    // Remove adspector.io scripts completely
    content = content.replace(/<script[^>]*adspector\.io[^>]*>[^<]*<\/script>/gi, 
                            '<!-- adspector.io script removed -->');
                            
    // Remove cuiz.in/topics requests
    content = content.replace(/<script[^>]*cuiz\.in\/topics[^>]*>[^<]*<\/script>/gi, 
                            '<!-- Topics API script removed -->');
    
    // Remove notification requests
    content = content.replace(/Notification\.requestPermission\([^)]*\)/g, 
                              "console.log('Notification permission request blocked')");
    
    // Remove TCPusher specific code snippets
    content = content.replace(/new\s+TCPusher\([^)]*\)/g, 
                              "console.log('TCPusher initialization blocked')");
    
    // Safe-guard AAB requests
    content = content.replace(/(fetch|XMLHttpRequest)([^;]*AAB[^;]*)/gi, 
                              "console.log('AAB request blocked',$2)");
    
    // Block service worker registration
    content = content.replace(/navigator\.serviceWorker\.register\([^)]*\)/g,
                             "console.log('Service worker registration blocked')");
                             
    // Block Va3pn0.js script which causes TCPusher error
    content = content.replace(/Va3pn0\.js/g, "blocked-script.js");
    
    // Remove Facebook scripts causing errors
    content = content.replace(/<script[^>]*facebook\.com[^>]*>[^<]*<\/script>/gi,
                             '<!-- Facebook script removed -->');

    // Flag the container with data attributes to help with debugging
    content = `<div data-ad-content="true" data-position="${position}" data-slot="${slotId || position}" data-cleaned="true">${content}</div>`;
    
    return content;
  }, [adContent, position, slotId]);
  
  // Execute scripts in the ad content only after container is ready
  const scriptStatus = useScriptExecution(
    containerReady ? cleanedContent : '', 
    containerId, 
    true // Always skip Topics API
  );
  
  // Effect to monitor script errors
  useEffect(() => {
    const handleScriptError = (event: ErrorEvent) => {
      // Only capture errors from this container
      const container = document.getElementById(containerId);
      if (container && event.target && container.contains(event.target as Node)) {
        console.error(`Script error in ${position} ad:`, event.message);
        setScriptError(event.message);
        event.preventDefault();
        event.stopPropagation();
      }
    };
    
    window.addEventListener('error', handleScriptError, true);
    
    // Add a global error handler for TCPusher errors
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message && (
        event.message.includes('TCPusher') || 
        event.message.includes('ServiceWorker') ||
        event.message.includes('register') ||
        event.message.includes('Attestation check for Topics')
      )) {
        console.warn('Intercepted problematic global error:', event.message);
        event.preventDefault();
        event.stopPropagation();
      }
    };
    
    window.addEventListener('error', handleGlobalError, true);
    
    // Handle unhandled promise rejections
    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && 
          (typeof event.reason === 'string' || event.reason.message) && 
          ((typeof event.reason === 'string' && 
            (event.reason.includes('TCPusher') || 
             event.reason.includes('ServiceWorker') || 
             event.reason.includes('register') ||
             event.reason.includes('Topics') ||
             event.reason.includes('Attestation')
            )) || 
           (event.reason.message && 
            (event.reason.message.includes('TCPusher') || 
             event.reason.message.includes('ServiceWorker') || 
             event.reason.message.includes('register') ||
             event.reason.message.includes('Topics') ||
             event.reason.message.includes('Attestation')
            )))) {
        console.warn('Intercepted unhandled promise rejection:', 
                    typeof event.reason === 'string' ? event.reason : event.reason.message);
        event.preventDefault();
      }
    };
    
    window.addEventListener('unhandledrejection', handlePromiseRejection);
    
    return () => {
      window.removeEventListener('error', handleScriptError, true);
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, [containerId, position]);
  
  // Effect to monitor content changes and container status
  useEffect(() => {
    if (adLoaded && cleanedContent && containerReady && contentRef.current) {
      console.log(`Ad container ready for ${position}/${slotId || 'default'}, content length: ${cleanedContent.length}`);
      
      // Log the content for debugging, truncated to avoid console overflow
      if (isDevelopment) {
        console.log(`Ad content sample: ${cleanedContent.substring(0, 100)}...`);
        
        // Check if the content contains script tags
        const hasScriptTags = /<script[\s\S]*?>[\s\S]*?<\/script>/i.test(cleanedContent);
        console.log(`Content contains script tags: ${hasScriptTags}`);
        
        // Add data attributes for easier debugging
        if (contentRef.current) {
          contentRef.current.setAttribute('data-has-scripts', hasScriptTags.toString());
          contentRef.current.setAttribute('data-content-length', cleanedContent.length.toString());
          contentRef.current.setAttribute('data-position', position);
          contentRef.current.setAttribute('data-skip-topics', 'true');
          contentRef.current.setAttribute('data-container-version', contentVersion.toString());
        }
      }
    } else if (adLoaded && cleanedContent && !containerReady && isDevelopment) {
      // Warning for development environment when container isn't ready
      console.warn(`Container not ready yet for ${position}/${slotId || 'default'}`);
      
      // After 5 seconds, if container is still not ready, show a toast warning in dev mode
      if (containerRecoveryAttempt >= 3 && isDevelopment) {
        toast.warning(`Ad container not initializing properly for ${position}`, {
          description: "Check the DOM structure and container references"
        });
      }
    }
  }, [adLoaded, cleanedContent, containerReady, containerId, position, slotId, isDevelopment, contentVersion, containerRecoveryAttempt]);
  
  if (!adLoaded) {
    return <AdLoader error={adError} isDevelopment={isDevelopment} />;
  }
  
  // Determine min-height based on position
  const getMinHeight = () => {
    if (position === 'sidebar') return 'min-h-[600px]';
    if (position === 'top' || position === 'bottom') return 'min-h-[120px]';
    return 'min-h-[250px]';
  };
  
  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground mb-2 text-center">Advertisement</p>
      {isDevelopment && (adDebug || scriptError || adBlockDetected || topicsError) && (
        <div className="mb-2 text-center">
          {adDebug && <p className="text-xs text-blue-500">{adDebug}</p>}
          {scriptError && <p className="text-xs text-red-500">Script error: {scriptError}</p>}
          {adBlockDetected && <p className="text-xs text-amber-500">Ad blocker detected</p>}
          {topicsError && <p className="text-xs text-red-500">Topics API attestation failed</p>}
          <p className="text-xs text-green-500">Topics API skipped (forced)</p>
          <p className="text-xs text-muted-foreground">
            Position: {position} / Slot: {slotId || position} / Section: {pageSection || 'default'}
          </p>
          {scriptStatus && (
            <p className={`text-xs ${
              scriptStatus === 'No scripts found' ? 'text-yellow-500' : 
              scriptStatus === 'Container not ready' ? 'text-red-500' :
              'text-green-500'
            }`}>
              Scripts executed: {scriptStatus}
            </p>
          )}
          {containerReady ? (
            <p className="text-xs text-green-500">Container initialized: Yes (v{contentVersion})</p>
          ) : (
            <p className="text-xs text-red-500">Container initialized: No (recovery attempt: {containerRecoveryAttempt})</p>
          )}
        </div>
      )}
      <div 
        id={containerId} 
        ref={contentRef}
        data-ad-position={position}
        data-ad-slot={slotId || position}
        data-ad-ready={containerReady.toString()}
        data-skip-topics="true"
        data-content-version={contentVersion}
        className={`${getMinHeight()} flex items-center justify-center overflow-hidden bg-secondary/10`}
        dangerouslySetInnerHTML={{ __html: cleanedContent }}
      ></div>
    </div>
  );
};

export default AdContent;
