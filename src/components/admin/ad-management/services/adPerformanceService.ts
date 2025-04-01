
import { supabase } from '@/integrations/supabase/client';
import { ImpressionData, ClickData, SlotData } from '../hooks/types/adPerformanceTypes';

/**
 * Fetches performance data from the ad_performance_reports view
 */
export const fetchPerformanceReports = async () => {
  console.log('Fetching ad performance data from reports view...');
  return await supabase.from('ad_performance_reports').select('*');
};

/**
 * Fetches ad slots data for mapping names
 */
export const fetchAdSlots = async () => {
  console.log('Fetching ad slots for performance data...');
  return await supabase.from('ad_slots').select('id, name') as unknown as { 
    data: SlotData[] | null, 
    error: any 
  };
};

/**
 * Fetches and aggregates impression data
 */
export const fetchImpressionData = async () => {
  console.log('Fetching ad impression data...');
  
  return await supabase
    .from('ad_views')
    .select('ad_id, ad_position, slot_id, page_section')
    .then(({ data, error }) => {
      if (error) throw error;
      
      // Manually aggregate the data
      const grouped: Record<string, ImpressionData> = {};
      data?.forEach(impression => {
        const key = `${impression.ad_id}-${impression.ad_position}-${impression.slot_id}-${impression.page_section}`;
        if (!grouped[key]) {
          grouped[key] = {
            ad_id: impression.ad_id,
            ad_position: impression.ad_position,
            slot_id: impression.slot_id,
            page_section: impression.page_section,
            count: '1'
          };
        } else {
          grouped[key].count = (parseInt(grouped[key].count) + 1).toString();
        }
      });
      
      return { data: Object.values(grouped), error: null };
    });
};

/**
 * Fetches and aggregates click data
 */
export const fetchClickData = async () => {
  console.log('Fetching ad click data...');
  
  return await supabase
    .from('ad_clicks')
    .select('ad_id, ad_position, slot_id, page_section')
    .then(({ data, error }) => {
      if (error) throw error;
      
      // Manually aggregate the data
      const grouped: Record<string, ClickData> = {};
      data?.forEach(click => {
        const key = `${click.ad_id}-${click.ad_position}-${click.slot_id}-${click.page_section}`;
        if (!grouped[key]) {
          grouped[key] = {
            ad_id: click.ad_id,
            ad_position: click.ad_position,
            slot_id: click.slot_id,
            page_section: click.page_section,
            count: '1'
          };
        } else {
          grouped[key].count = (parseInt(grouped[key].count) + 1).toString();
        }
      });
      
      return { data: Object.values(grouped), error: null };
    });
};
