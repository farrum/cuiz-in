
import { useState } from 'react';
import { useScheduledSync } from '@/hooks/useScheduledSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Upload, Clock } from "lucide-react";
import { useFetchSupabaseData } from '@/hooks/useFetchSupabaseData';
import { format } from 'date-fns';

export function SyncSettings() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const { 
    isAutoSyncEnabled, 
    lastFetchTime, 
    lastSyncTime, 
    toggleAutoSync,
    fetchIntervalMs,
    syncIntervalMs
  } = useScheduledSync();
  
  const { fetchData, syncToSupabase } = useFetchSupabaseData(false);
  
  const handleManualFetch = async () => {
    setIsFetching(true);
    try {
      await fetchData();
    } finally {
      setIsFetching(false);
    }
  };
  
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncToSupabase();
    } finally {
      setIsSyncing(false);
    }
  };
  
  const formatTime = (time: Date | null) => {
    if (!time) return 'Never';
    return format(time, 'MMM d, yyyy h:mm a');
  };
  
  const formatInterval = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Synchronization</CardTitle>
        <CardDescription>
          Configure how your data is synchronized with the Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Automatic Synchronization</h3>
              <p className="text-sm text-muted-foreground">
                Enable automatic data syncing between local storage and Supabase
              </p>
            </div>
            <Switch 
              checked={isAutoSyncEnabled} 
              onCheckedChange={toggleAutoSync} 
            />
          </div>
          
          {isAutoSyncEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Fetch every {formatInterval(fetchIntervalMs)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sync every {formatInterval(syncIntervalMs)}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Manual Synchronization</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              variant="outline"
              onClick={handleManualFetch}
              disabled={isFetching}
              className="gap-2"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isFetching ? 'Fetching...' : 'Fetch from Supabase'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="gap-2"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isSyncing ? 'Syncing...' : 'Sync to Supabase'}
            </Button>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Last Synchronization</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Last fetch: </span>
              <span>{formatTime(lastFetchTime)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last sync: </span>
              <span>{formatTime(lastSyncTime)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
