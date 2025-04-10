
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

export interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  last_updated: string;
}

// Using a module-level variable to track last fetch time across hook instances
let lastGlobalFetchTime = 0;
const FETCH_COOLDOWN = 5000; // 5 seconds cooldown between fetches

export const useAdSlots = () => {
  const { toast } = useToast();
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  
  // Set up realtime subscription to ad_slots table with stable channel
  const { isConnected } = useSupabaseRealtime('ad_slots', {
    updateLocalStorage: true,
    showToasts: false, // Disable automatic toasts
    debounceMs: 500, // Debounce events by 500ms
    skipDuplicates: true,
    stableChannel: true // Use stable channel that persists between renders
  });
  
  const fetchAdSlots = useCallback(async (force = false) => {
    // Skip if component is unmounted
    if (!isMountedRef.current) return;
    
    // Global rate limiting: Don't fetch more than once every 5 seconds across all components
    const now = Date.now();
    if (!force && now - lastGlobalFetchTime < FETCH_COOLDOWN) {
      console.log(`Skipping ad slots fetch, globally throttled (last fetch ${now - lastGlobalFetchTime}ms ago)`);
      return;
    }
    
    // Local rate limiting for this hook instance
    if (!force && now - lastFetchTimeRef.current < FETCH_COOLDOWN) {
      console.log(`Skipping ad slots fetch, locally throttled (last fetch ${now - lastFetchTimeRef.current}ms ago)`);
      return;
    }
    
    lastFetchTimeRef.current = now;
    lastGlobalFetchTime = now;
    setIsLoading(true);
    
    try {
      console.log('Fetching ad slots from database...');
      const { data, error } = await supabase
        .from('ad_slots')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      if (data && isMountedRef.current) {
        console.log(`Successfully fetched ${data.length} ad slots`);
        localStorage.setItem('quiz_app_ad_slots', JSON.stringify(data));
        setAdSlots(data as AdSlot[]);
        
        // Only dispatch event if this is a forced refresh or the component initiated the fetch
        if (force) {
          console.log('Dispatching adSlotsUpdated event (forced refresh)');
          // This is a controlled dispatch with specific purpose and content
          window.dispatchEvent(new CustomEvent('adSlotsUpdated', { 
            detail: { source: 'fetch', slots: data }
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching ad slots:', error);
      if (!isMountedRef.current) return;
      
      const savedSlots = localStorage.getItem('quiz_app_ad_slots');
      if (savedSlots) {
        try {
          const parsedSlots = JSON.parse(savedSlots);
          setAdSlots(parsedSlots);
          console.log('Using cached ad slots from localStorage');
        } catch (parseError) {
          console.error('Error parsing cached ad slots:', parseError);
        }
      }
      
      toast({
        title: "Error Loading Ad Slots",
        description: "Could not load ad slots from the database. Using local data instead.",
        variant: "destructive"
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [toast]);
  
  const handleToggleActive = useCallback(async (id: string) => {
    const slotToUpdate = adSlots.find(slot => slot.id === id);
    if (!slotToUpdate) return;
    
    const newActiveState = !slotToUpdate.active;
    
    try {
      const { error } = await supabase
        .from('ad_slots')
        .update({ 
          active: newActiveState,
          last_updated: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // Optimistically update the local state
      const updatedSlots = adSlots.map(slot => {
        if (slot.id === id) {
          return { ...slot, active: newActiveState, last_updated: new Date().toISOString() };
        }
        return slot;
      });
      
      setAdSlots(updatedSlots);
      localStorage.setItem('quiz_app_ad_slots', JSON.stringify(updatedSlots));
      
      // Realtime will handle the update notification, no need to dispatch event here
      
      toast({
        title: "Ad Slot Updated",
        description: `The ad slot has been ${newActiveState ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      console.error('Error updating ad slot:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the ad slot status.",
        variant: "destructive"
      });
    }
  }, [adSlots, toast]);
  
  // This effect only runs once on component mount to fetch ad slots
  useEffect(() => {
    isMountedRef.current = true;
    fetchAdSlots();
    
    // Set up a listener for ad slots updates that only triggers a refresh if needed
    const handleAdSlotsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      
      // Avoid refreshing if this component initiated the update
      if (detail && detail.source === 'fetch') {
        console.log('Ignoring adSlotsUpdated event from fetch operation');
        return;
      }
      
      // Schedule a fetch with a short delay
      console.log('Ad slots updated event detected, scheduling refresh...');
      setTimeout(() => {
        if (isMountedRef.current) {
          fetchAdSlots(true);
        }
      }, 300);
    };
    
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    };
  }, [fetchAdSlots]);
  
  // This effect refreshes ad slots when realtime connection status changes
  useEffect(() => {
    if (isConnected && isMountedRef.current) {
      console.log('Realtime connection established, refreshing ad slots...');
      fetchAdSlots(true);
    }
  }, [isConnected, fetchAdSlots]);
  
  return {
    adSlots,
    setAdSlots,
    isLoading,
    fetchAdSlots,
    handleToggleActive
  };
};
