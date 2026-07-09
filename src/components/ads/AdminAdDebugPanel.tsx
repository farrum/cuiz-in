
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bug, RefreshCw, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { STORAGE_KEYS } from '@/utils/quizData';

interface AdSlotInfo {
  id: string;
  name: string;
  position: string;
  active: boolean;
  code: string;
}

interface DebugLog {
  time: string;
  type: 'info' | 'error' | 'success';
  message: string;
}

const AdminAdDebugPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adSlots, setAdSlots] = useState<AdSlotInfo[]>([]);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [providerInfo, setProviderInfo] = useState<Record<string, string>>({});
  
  // Check if user is admin
  useEffect(() => {
    let active = true;
    const checkAdmin = async () => {
      // Verify admin status from the Supabase session + database, never localStorage.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) setIsAdmin(false);
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();
      if (active) setIsAdmin(!!profile?.is_admin);
    };
    
    checkAdmin();
    return () => { active = false; };
  }, []);
  
  // Load ad slots and detect provider
  useEffect(() => {
    if (!isAdmin) return;
    
    const loadAdSlots = () => {
      try {
        const storedSlots = localStorage.getItem('quiz_app_ad_slots');
        if (storedSlots) {
          const slots: AdSlotInfo[] = JSON.parse(storedSlots);
          setAdSlots(slots);
          
          // Detect provider from code
          const providers: Record<string, string> = {};
          slots.forEach(slot => {
            if (slot.code.includes('aclib')) {
              providers[slot.position] = 'AdCash (aclib)';
            } else if (slot.code.includes('adsbygoogle')) {
              providers[slot.position] = 'Google AdSense';
            } else if (slot.code.includes('monetag') || slot.code.includes('highperformanceformat')) {
              providers[slot.position] = 'Monetag';
            } else if (slot.code.includes('propellerads')) {
              providers[slot.position] = 'PropellerAds';
            } else {
              providers[slot.position] = 'Custom/Unknown';
            }
          });
          setProviderInfo(providers);
          
          addLog('info', `Loaded ${slots.length} ad slots from cache`);
        } else {
          addLog('error', 'No ad slots in cache');
        }
      } catch (err) {
        addLog('error', `Failed to load ad slots: ${err}`);
      }
    };
    
    loadAdSlots();
    
    // Check for ad blocker
    const testScript = document.createElement('script');
    testScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    testScript.onerror = () => {
      setAdBlockDetected(true);
      addLog('error', 'Ad blocker detected');
    };
    testScript.onload = () => {
      addLog('success', 'No ad blocker detected');
    };
    document.head.appendChild(testScript);
    
    return () => {
      if (document.head.contains(testScript)) {
        document.head.removeChild(testScript);
      }
    };
  }, [isAdmin]);
  
  const addLog = (type: DebugLog['type'], message: string) => {
    setDebugLogs(prev => [
      { time: new Date().toLocaleTimeString(), type, message },
      ...prev.slice(0, 19) // Keep last 20 logs
    ]);
  };
  
  const handleRefresh = () => {
    addLog('info', 'Refreshing ad slots...');
    window.dispatchEvent(new CustomEvent('adSlotsUpdated'));
    
    // Re-sync from Supabase
    const event = new CustomEvent('forceAdSync');
    window.dispatchEvent(event);
  };
  
  // Don't render anything for non-admins
  if (!isAdmin) return null;
  
  return (
    <Card className={`${className} border-dashed border-orange-500/50 bg-orange-50/5`}>
      <CardHeader 
        className="py-2 px-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-orange-500" />
            <CardTitle className="text-sm text-orange-500">Ad Debug Panel</CardTitle>
            <Badge variant="outline" className="text-xs">Admin Only</Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        {!isExpanded && (
          <CardDescription className="text-xs">
            {adSlots.length} slots loaded • {adBlockDetected ? '⚠️ Blocker detected' : '✓ No blocker'}
          </CardDescription>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 pb-3 px-3 space-y-3">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={adBlockDetected ? 'destructive' : 'default'}>
              {adBlockDetected ? <XCircle className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              {adBlockDetected ? 'Blocker Detected' : 'No Blocker'}
            </Badge>
            <Badge variant="outline">{adSlots.length} Slots</Badge>
            <Badge variant="outline">{adSlots.filter(s => s.active).length} Active</Badge>
          </div>
          
          {/* Ad Slots */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Loaded Slots:</p>
            {adSlots.length === 0 ? (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                No ad slots loaded
              </p>
            ) : (
              <div className="grid gap-1.5">
                {adSlots.map(slot => (
                  <div 
                    key={slot.id} 
                    className="flex items-center justify-between text-xs p-2 rounded bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${slot.active ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium">{slot.position}</span>
                      <span className="text-muted-foreground">({slot.name})</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {providerInfo[slot.position] || 'Unknown'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Debug Logs */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recent Logs:</p>
            <div className="max-h-32 overflow-y-auto space-y-1 text-[10px] font-mono bg-muted/30 rounded p-2">
              {debugLogs.length === 0 ? (
                <p className="text-muted-foreground">No logs yet</p>
              ) : (
                debugLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-muted-foreground shrink-0">{log.time}</span>
                    <span className={
                      log.type === 'error' ? 'text-destructive' : 
                      log.type === 'success' ? 'text-green-600' : 
                      'text-foreground'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Actions */}
          <Button size="sm" variant="outline" onClick={handleRefresh} className="w-full text-xs">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh Ad Slots
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

export default AdminAdDebugPanel;
