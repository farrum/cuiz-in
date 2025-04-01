
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AdPerformance } from './types/adPerformanceTypes';
import { 
  fetchPerformanceReports, 
  fetchAdSlots, 
  fetchImpressionData, 
  fetchClickData 
} from '../services/adPerformanceService';
import { processPerformanceData } from '../utils/processPerformanceData';

export { type AdPerformance };

export const useAdPerformance = () => {
  const { toast } = useToast();
  const [adPerformance, setAdPerformance] = useState<AdPerformance[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  
  const fetchAdPerformance = async () => {
    setIsLoadingReports(true);
    console.log('Fetching ad performance data...');
    
    try {
      // Try to fetch data directly from the ad_performance_reports view
      const { data, error } = await fetchPerformanceReports();
        
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
      const { data: adSlots, error: adSlotsError } = await fetchAdSlots();
      if (adSlotsError) throw adSlotsError;
      
      // Get impression data
      const { data: impressionsResult, error: impressionsError } = await fetchImpressionData();
      if (impressionsError) {
        console.error('Error fetching impression counts:', impressionsError);
        throw impressionsError;
      }
      
      // Get click data
      const { data: clicksResult, error: clicksError } = await fetchClickData();
      if (clicksError) {
        console.error('Error fetching click counts:', clicksError);
        throw clicksError;
      }
      
      // Process the performance data
      const processedData = processPerformanceData(
        adSlots,
        impressionsResult,
        clicksResult
      );
      
      setAdPerformance(processedData);
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
  
  return {
    adPerformance,
    isLoadingReports,
    fetchAdPerformance
  };
};
