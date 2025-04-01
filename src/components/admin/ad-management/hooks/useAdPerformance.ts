
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
    console.log('Fetching ad performance data...');
    
    try {
      // Try to fetch data directly from the ad_performance_reports view
      const { data, error } = await supabase
        .from('ad_performance_reports')
        .select('*');
        
      if (error) {
        console.error('Error fetching from ad_performance_reports view:', error);
        console.log('Falling back to manual performance calculation...');
        await calculatePerformanceManually();
      } else if (data && data.length > 0) {
        console.log(`Successfully fetched ${data.length} performance records from view`);
        setAdPerformance(data as AdPerformance[]);
      } else {
        // If no data is returned, we'll calculate manually
        console.log('No data in ad_performance_reports view, calculating manually...');
        await calculatePerformanceManually();
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
  
  // Manual calculation if the view doesn't work
  const calculatePerformanceManually = async () => {
    try {
      // Get ad slots data for names
      const { data: adSlots, error: adSlotsError } = await supabase
        .from('ad_slots')
        .select('id, name');
        
      if (adSlotsError) throw adSlotsError;
      
      // Get impression data using custom SQL function
      const { data: impressionsResult, error: impressionsError } = await supabase
        .rpc('get_ad_impressions_count');
        
      if (impressionsError) {
        console.error('Error fetching impression counts:', impressionsError);
        // Fallback to simple count method
        const { data: fallbackImpressions, error: fallbackError } = await supabase
          .from('ad_views')
          .select('*');
          
        if (fallbackError) throw fallbackError;
        
        // Group the impressions manually in JS
        const impressionGroups: Record<string, ImpressionData> = {};
        fallbackImpressions?.forEach(impression => {
          const key = `${impression.ad_id}-${impression.ad_position}-${impression.slot_id}-${impression.page_section}`;
          if (!impressionGroups[key]) {
            impressionGroups[key] = {
              ad_id: impression.ad_id,
              ad_position: impression.ad_position,
              slot_id: impression.slot_id,
              page_section: impression.page_section,
              count: '1'
            };
          } else {
            impressionGroups[key].count = (parseInt(impressionGroups[key].count) + 1).toString();
          }
        });
        
        const groupedImpressions = Object.values(impressionGroups);
        console.log(`Manually grouped ${groupedImpressions.length} impression records`);
        
        // Get click data - manually group clicks too
        const { data: fallbackClicks, error: fallbackClicksError } = await supabase
          .from('ad_clicks')
          .select('*');
          
        if (fallbackClicksError) throw fallbackClicksError;
        
        // Group the clicks manually
        const clickGroups: Record<string, ClickData> = {};
        fallbackClicks?.forEach(click => {
          const key = `${click.ad_id}-${click.ad_position}-${click.slot_id}-${click.page_section}`;
          if (!clickGroups[key]) {
            clickGroups[key] = {
              ad_id: click.ad_id,
              ad_position: click.ad_position,
              slot_id: click.slot_id,
              page_section: click.page_section,
              count: '1'
            };
          } else {
            clickGroups[key].count = (parseInt(clickGroups[key].count) + 1).toString();
          }
        });
        
        const groupedClicks = Object.values(clickGroups);
        console.log(`Manually grouped ${groupedClicks.length} click records`);
        
        processPerformanceData(adSlots, groupedImpressions, groupedClicks);
        return;
      }
      
      // Get click data using custom SQL function
      const { data: clicksResult, error: clicksError } = await supabase
        .rpc('get_ad_clicks_count');
        
      if (clicksError) {
        console.error('Error fetching click counts:', clicksError);
        throw clicksError;
      }
      
      // Since we are using rpc, the returned data should already be in the correct format
      const impressions = impressionsResult as ImpressionData[];
      const clicks = clicksResult as ClickData[];
      
      processPerformanceData(adSlots, impressions, clicks);
      
    } catch (error) {
      console.error('Error calculating performance manually:', error);
      toast({
        title: "Error Calculating Reports",
        description: "Could not manually calculate ad performance.",
        variant: "destructive"
      });
      setAdPerformance([]);
    }
  };
  
  // Helper function to process the performance data
  const processPerformanceData = (
    adSlots: SlotData[] | null, 
    impressions: ImpressionData[], 
    clicks: ClickData[]
  ) => {
    console.log(`Processing performance data from ${impressions.length} impressions and ${clicks.length} clicks`);
    
    // Convert to the expected format
    const manualPerformance: AdPerformance[] = [];
    
    for (const impression of impressions) {
      const adSlot = adSlots?.find((slot: SlotData) => slot.id === impression.ad_id);
      const clickData = clicks.find((click: ClickData) => 
        click.ad_id === impression.ad_id && 
        click.ad_position === impression.ad_position &&
        click.slot_id === impression.slot_id &&
        click.page_section === impression.page_section
      );
      
      const clickCount = clickData ? parseInt(clickData.count) : 0;
      const impressionCount = parseInt(impression.count);
      
      manualPerformance.push({
        ad_id: impression.ad_id,
        ad_name: adSlot ? adSlot.name : 'Unknown Ad',
        ad_position: impression.ad_position,
        slot_id: impression.slot_id || undefined,
        page_section: impression.page_section || undefined,
        impressions: impressionCount,
        clicks: clickCount,
        ctr: impressionCount > 0 ? (clickCount / impressionCount) * 100 : 0
      });
    }
    
    console.log(`Generated ${manualPerformance.length} manual performance records`);
    setAdPerformance(manualPerformance);
  };
  
  return {
    adPerformance,
    isLoadingReports,
    fetchAdPerformance
  };
};
