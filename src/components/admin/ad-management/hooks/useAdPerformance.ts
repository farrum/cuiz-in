
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
      const { data: viewCheck, error: viewCheckError } = await supabase
        .from('ad_performance_reports')
        .select('*')
        .limit(1);
        
      if (viewCheckError) {
        // If the view doesn't exist, we'll calculate the metrics ourselves
        // First get impressions data
        const { data: impressionsData, error: impressionsError } = await supabase
          .from('ad_views')
          .select('ad_id, ad_position, slot_id, page_section, count(*)')
          .is('slot_id', null)
          .not('slot_id', 'eq', '')
          .is('page_section', null)
          .not('page_section', 'eq', '');
          
        if (impressionsError) {
          throw impressionsError;
        }
        
        // Get impressions with specific slot_id and page_section
        const { data: impressionsWithSlotData, error: impressionsWithSlotError } = await supabase
          .from('ad_views')
          .select('ad_id, ad_position, slot_id, page_section, count(*)')
          .not('slot_id', 'is', null)
          .not('page_section', 'is', null);
          
        if (impressionsWithSlotError) {
          throw impressionsWithSlotError;
        }
        
        // Safely cast and merge the impression datasets
        const allImpressions: ImpressionData[] = [];
        
        // Add impressions without slot data
        if (impressionsData) {
          impressionsData.forEach((item: any) => {
            allImpressions.push({
              ad_id: item.ad_id,
              ad_position: item.ad_position,
              slot_id: item.slot_id,
              page_section: item.page_section,
              count: item.count
            });
          });
        }
        
        // Add impressions with slot data
        if (impressionsWithSlotData) {
          impressionsWithSlotData.forEach((item: any) => {
            allImpressions.push({
              ad_id: item.ad_id,
              ad_position: item.ad_position,
              slot_id: item.slot_id,
              page_section: item.page_section,
              count: item.count
            });
          });
        }
        
        // Then get clicks data
        const { data: clicksData, error: clicksError } = await supabase
          .from('ad_clicks')
          .select('ad_id, ad_position, slot_id, page_section, count(*)')
          .is('slot_id', null)
          .not('slot_id', 'eq', '')
          .is('page_section', null)
          .not('page_section', 'eq', '');
          
        if (clicksError) {
          throw clicksError;
        }
        
        // Get clicks with specific slot_id and page_section
        const { data: clicksWithSlotData, error: clicksWithSlotError } = await supabase
          .from('ad_clicks')
          .select('ad_id, ad_position, slot_id, page_section, count(*)')
          .not('slot_id', 'is', null)
          .not('page_section', 'is', null);
          
        if (clicksWithSlotError) {
          throw clicksWithSlotError;
        }
        
        // Safely cast and merge the clicks datasets
        const allClicks: ClickData[] = [];
        
        // Add clicks without slot data
        if (clicksData) {
          clicksData.forEach((item: any) => {
            allClicks.push({
              ad_id: item.ad_id,
              ad_position: item.ad_position,
              slot_id: item.slot_id,
              page_section: item.page_section,
              count: item.count
            });
          });
        }
        
        // Add clicks with slot data
        if (clicksWithSlotData) {
          clicksWithSlotData.forEach((item: any) => {
            allClicks.push({
              ad_id: item.ad_id,
              ad_position: item.ad_position,
              slot_id: item.slot_id,
              page_section: item.page_section,
              count: item.count
            });
          });
        }
        
        // Get ad slots data for names
        const { data: slotsData } = await supabase
          .from('ad_slots')
          .select('id, name');
        
        // Safely create a map of slot IDs to names
        const slotsMap = new Map<string, string>();
        if (slotsData) {
          (slotsData as SlotData[]).forEach(slot => {
            slotsMap.set(slot.id, slot.name);
          });
        }
        
        // Process and combine the data
        const combinedData: AdPerformance[] = [];
        
        for (const imp of allImpressions) {
          const clickData = allClicks.find(click => 
            click.ad_id === imp.ad_id && 
            click.ad_position === imp.ad_position &&
            click.slot_id === imp.slot_id &&
            click.page_section === imp.page_section
          );
          
          const clickCount = clickData ? parseInt(clickData.count) : 0;
          const impressionCount = parseInt(imp.count);
          const ctr = impressionCount > 0 ? (clickCount / impressionCount) * 100 : 0;
          
          combinedData.push({
            ad_id: imp.ad_id,
            ad_name: slotsMap.get(imp.ad_id) || 'Unknown Ad',
            ad_position: imp.ad_position,
            impressions: impressionCount,
            clicks: clickCount,
            ctr: parseFloat(ctr.toFixed(2)),
            slot_id: imp.slot_id || imp.ad_position,
            page_section: imp.page_section || imp.ad_position
          });
        }
        
        setAdPerformance(combinedData);
      } else {
        // If the view exists, just use it
        const { data, error } = await supabase
          .from('ad_performance_reports')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setAdPerformance(data as AdPerformance[]);
        }
      }
    } catch (error) {
      console.error('Error fetching ad performance:', error);
      toast({
        title: "Error Loading Ad Reports",
        description: "Could not load ad performance data.",
        variant: "destructive"
      });
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
