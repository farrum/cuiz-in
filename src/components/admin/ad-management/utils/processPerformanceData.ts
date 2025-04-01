
import { 
  AdPerformance, 
  SlotData, 
  ImpressionData, 
  ClickData 
} from '../hooks/types/adPerformanceTypes';

/**
 * Processes raw performance data into formatted AdPerformance records
 */
export const processPerformanceData = (
  adSlots: SlotData[] | null, 
  impressions: ImpressionData[], 
  clicks: ClickData[]
): AdPerformance[] => {
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
  return manualPerformance;
};
