
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdPerformance {
  ad_id: string;
  ad_name: string;
  ad_position: string;
  impressions: number;
  clicks: number;
  ctr: number;
  slot_id?: string;
  page_section?: string;
}

// Define types for Supabase query responses
export interface ImpressionData {
  ad_id: string;
  ad_position: string;
  slot_id: string | null;
  page_section: string | null;
  count: string;
}

export interface ClickData {
  ad_id: string;
  ad_position: string;
  slot_id: string | null;
  page_section: string | null;
  count: string;
}

export interface SlotData {
  id: string;
  name: string;
}

export const useAdPerformance = () => {
  const { toast } = useToast();
  const [adPerformance, setAdPerformance] = useState<AdPerformance[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  
  const fetchAdPerformance = async () => {
    setIsLoadingReports(true);
    try {
      // Try to fetch data directly from the ad_performance_reports view
      const { data, error } = await supabase
        .from('ad_performance_reports')
        .select('*');
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setAdPerformance(data as AdPerformance[]);
      } else {
        // If no data is returned, we'll show a message
        toast({
          title: "No Ad Performance Data",
          description: "There is no ad performance data available yet."
        });
        setAdPerformance([]);
      }
    } catch (error) {
      console.error('Error fetching ad performance:', error);
      toast({
        title: "Error Loading Ad Reports",
        description: "Could not load ad performance data.",
        variant: "destructive"
      });
      setAdPerformance([]);
    } finally {
      setIsLoadingReports(false);
    }
  };
  
  return {
    adPerformance,
    isLoadingReports,
    fetchAdPerformance
  };
};
