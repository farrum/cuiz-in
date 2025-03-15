
import { useState, useEffect } from 'react';
import { fetchAllAppData, syncLocalStorageToSupabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFetchSupabaseData = (autoFetch = true) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();
  
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await fetchAllAppData();
      
      if (success) {
        setLastFetched(new Date());
        
        toast({
          title: "Data Refreshed",
          description: "App data has been refreshed from the database.",
        });
      } else {
        throw new Error("Failed to fetch some app data");
      }
    } catch (err) {
      console.error('Failed to fetch app data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      toast({
        title: "Data Refresh Failed",
        description: "Failed to refresh app data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncToSupabase = async () => {
    setIsSyncing(true);
    setError(null);
    
    try {
      const success = await syncLocalStorageToSupabase();
      
      if (success) {
        setLastSynced(new Date());
        
        toast({
          title: "Data Synced",
          description: "Local data has been synced to the database.",
        });
      } else {
        throw new Error("Failed to sync some app data");
      }
    } catch (err) {
      console.error('Failed to sync app data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      toast({
        title: "Data Sync Failed",
        description: "Failed to sync local data to database. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch]);
  
  return {
    isLoading,
    lastFetched,
    error,
    fetchData,
    isSyncing,
    lastSynced,
    syncToSupabase
  };
};
