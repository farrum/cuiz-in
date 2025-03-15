
import { useState, useEffect } from 'react';
import { fetchAllAppData } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFetchSupabaseData = (autoFetch = true) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await fetchAllAppData();
      setLastFetched(new Date());
      
      toast({
        title: "Data Refreshed",
        description: "App data has been refreshed from the database.",
      });
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
  
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch]);
  
  return {
    isLoading,
    lastFetched,
    error,
    fetchData
  };
};
