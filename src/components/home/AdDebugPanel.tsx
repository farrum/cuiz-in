
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { debugAdCache, debugAvailableAds } from '@/services/adCacheService';
import { AlertCircle, Bug, Loader2 } from 'lucide-react';

const AdDebugPanel: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [adNetworkStatus, setAdNetworkStatus] = useState<Record<string, boolean>>({});
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  
  const checkAdNetworks = async () => {
    setIsChecking(true);
    
    // Debug the local ad cache
    debugAdCache();
    debugAvailableAds();
    
    // Check common ad network domains
    const networks = {
      'Google Ads': 'pagead2.googlesyndication.com',
      'Ezoic': 'g.ezoic.net',
      'Taboola': 'cdn.taboola.com',
    };
    
    const networkStatus: Record<string, boolean> = {};
    
    for (const [name, domain] of Object.entries(networks)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`https://${domain}/status-check`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
        }).catch(() => ({ok: false}));
        
        clearTimeout(timeoutId);
        networkStatus[name] = true; // If we get here without error, domain is reachable
        console.log(`Ad network check: ${name} is reachable`);
      } catch (error) {
        networkStatus[name] = false;
        console.error(`Ad network check: ${name} is NOT reachable`, error);
      }
    }
    
    setAdNetworkStatus(networkStatus);
    setLastChecked(new Date().toLocaleTimeString());
    setIsChecking(false);
  };
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm"
        >
          <Bug className="h-4 w-4 mr-2" />
          Ad Debug
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Advertisement Debugging</SheetTitle>
          <SheetDescription>
            Troubleshoot issues with your ad display
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-4">
          <div className="bg-secondary/20 p-4 rounded-md">
            <h3 className="font-medium mb-2">Ad Network Status</h3>
            <Button 
              onClick={checkAdNetworks} 
              disabled={isChecking}
              variant="outline"
              className="mb-3"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Ad Networks'
              )}
            </Button>
            
            {lastChecked && (
              <p className="text-xs text-muted-foreground mb-3">
                Last checked: {lastChecked}
              </p>
            )}
            
            <div className="space-y-2">
              {Object.entries(adNetworkStatus).map(([network, isReachable]) => (
                <div key={network} className="flex items-center justify-between">
                  <span>{network}</span>
                  {isReachable ? (
                    <span className="text-green-500">Reachable</span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Reachable
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-secondary/20 p-4 rounded-md">
            <h3 className="font-medium mb-2">Common Ad Issues</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Ad blockers may be preventing ad display</li>
              <li>DNS settings might be blocking ad domains</li>
              <li>Network firewall or proxy settings</li>
              <li>Ad network geographic restrictions</li>
              <li>Slow network connections timing out requests</li>
            </ul>
          </div>
          
          <div className="bg-secondary/20 p-4 rounded-md">
            <h3 className="font-medium mb-2">Troubleshooting</h3>
            <p className="text-sm mb-3">Try these steps to fix ad display issues:</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Check your internet connection</li>
              <li>Try disabling ad blockers temporarily</li>
              <li>Clear browser cache and cookies</li>
              <li>Try a different browser or device</li>
              <li>Verify ads.txt is properly configured</li>
            </ol>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdDebugPanel;
