
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bug, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { debugAdCache, clearAdCache } from '@/services/adCacheService';

interface AdDebuggerProps {
  position: string;
  slotId?: string;
  pageSection?: string;
  className?: string;
}

const AdDebugger: React.FC<AdDebuggerProps> = ({
  position,
  slotId,
  pageSection,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [topicsSupported, setTopicsSupported] = useState<boolean | null>(null);
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [browserInfo, setBrowserInfo] = useState('');
  
  useEffect(() => {
    // Get browser information
    const browser = getBrowserInfo();
    setBrowserInfo(browser);
    
    // Check if Topics API is supported
    checkTopicsSupport();
    
    // Check for ad blockers
    checkForAdBlocker();
    
    // Gather debugging information
    gatherDebugInfo();
  }, []);
  
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    
    if (userAgent.indexOf("Chrome") != -1) {
      browser = "Chrome";
    } else if (userAgent.indexOf("Safari") != -1) {
      browser = "Safari";
    } else if (userAgent.indexOf("Firefox") != -1) {
      browser = "Firefox";
    } else if (userAgent.indexOf("MSIE") != -1 || userAgent.indexOf("Trident") != -1) {
      browser = "Internet Explorer";
    } else if (userAgent.indexOf("Edge") != -1) {
      browser = "Edge";
    }
    
    return `${browser} on ${navigator.platform}`;
  };
  
  const checkTopicsSupport = () => {
    // Check if document.browsingTopics is available
    if ('browsingTopics' in document) {
      setTopicsSupported(true);
    } else {
      setTopicsSupported(false);
    }
  };
  
  const checkForAdBlocker = () => {
    // Try to load a test ad script
    const testScript = document.createElement('script');
    testScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    testScript.onerror = () => {
      setAdBlockDetected(true);
    };
    document.body.appendChild(testScript);
    setTimeout(() => {
      if (document.body.contains(testScript)) {
        document.body.removeChild(testScript);
      }
    }, 1000);
  };
  
  const gatherDebugInfo = () => {
    const info = {
      adPosition: position,
      adSlotId: slotId || 'default',
      pageSection: pageSection || 'default',
      cachedAds: localStorage.getItem('quiz_app_ad_slots') ? 
                 JSON.parse(localStorage.getItem('quiz_app_ad_slots') || '[]').length : 0,
      sessionId: localStorage.getItem('ad_tracking_session_id') || 'Not set'
    };
    
    setDebugInfo(info);
  };
  
  const handleRefreshAds = () => {
    setIsLoading(true);
    
    // Clear ad cache for this position
    clearAdCache(position);
    
    // Dispatch event to refresh ads
    window.dispatchEvent(new CustomEvent('adSlotsUpdated', {
      detail: { slots: [{ position }] }
    }));
    
    toast.success("Ad refresh triggered", {
      description: `Refreshing ads for position: ${position}`
    });
    
    // Log debug information
    console.log(`Ad debugging info for ${position}:`, debugInfo);
    debugAdCache();
    
    setTimeout(() => {
      setIsLoading(false);
      gatherDebugInfo();
    }, 2000);
  };
  
  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center">
              <Bug className="w-4 h-4 mr-2" /> Ad Debugger
            </CardTitle>
            <CardDescription>
              Position: {position} / Slot: {slotId || position}
            </CardDescription>
          </div>
          <Badge variant={adBlockDetected ? "destructive" : "outline"}>
            {adBlockDetected ? "Ad Blocker Detected" : "Ad Blocker Not Detected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-xs space-y-2 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-semibold">Browser:</div>
          <div>{browserInfo}</div>
          
          <div className="font-semibold">Topics API Support:</div>
          <div>
            {topicsSupported === null ? 'Checking...' : 
             topicsSupported ? 'Supported' : 'Not Supported'}
          </div>
          
          <div className="font-semibold">Cached Ads:</div>
          <div>{debugInfo.cachedAds || 0}</div>
          
          <div className="font-semibold">Session ID:</div>
          <div className="truncate">{debugInfo.sessionId || 'Not set'}</div>
        </div>
        
        {adBlockDetected && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md flex items-start mt-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-yellow-800 dark:text-yellow-300">
              Ad blocker detected, which may prevent advertisements from loading correctly.
            </div>
          </div>
        )}
        
        {topicsSupported === false && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md flex items-start">
            <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-blue-800 dark:text-blue-300">
              Topics API not supported in this browser. Ads will load without targeting.
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/10 pt-3">
        <Button 
          onClick={handleRefreshAds} 
          variant="outline" 
          size="sm" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh Ads
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdDebugger;
