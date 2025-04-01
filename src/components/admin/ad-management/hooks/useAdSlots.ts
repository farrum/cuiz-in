
import { useState, useEffect, useRef } from 'react';
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

export const useAdSlots = () => {
  const { toast } = useToast();
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Set up realtime subscription to ad_slots table with debouncing
  const { isConnected } = useSupabaseRealtime('ad_slots', {
    updateLocalStorage: true,
    showToasts: true,
    debounceMs: 500, // Debounce events by 500ms
    skipDuplicates: true
  });
  
  const fetchAdSlots = async () => {
    // Rate limiting: Don't fetch more than once every 5 seconds
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000) {
      console.log(`Skipping ad slots fetch, throttled (last fetch ${now - lastFetchTimeRef.current}ms ago)`);
      return;
    }
    
    lastFetchTimeRef.current = now;
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
      
      if (data) {
        console.log(`Successfully fetched ${data.length} ad slots`);
        localStorage.setItem('quiz_app_ad_slots', JSON.stringify(data));
        setAdSlots(data as AdSlot[]);
        
        // Dispatch a custom event to notify other components that ad slots have been updated
        // Pass the updated slots in the event detail
        window.dispatchEvent(new CustomEvent('adSlotsUpdated', { detail: data }));
      }
    } catch (error) {
      console.error('Error fetching ad slots:', error);
      const savedSlots = localStorage.getItem('quiz_app_ad_slots');
      if (savedSlots) {
        setAdSlots(JSON.parse(savedSlots));
      }
      
      toast({
        title: "Error Loading Ad Slots",
        description: "Could not load ad slots from the database. Using local data instead.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleActive = async (id: string) => {
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
      
      const updatedSlots = adSlots.map(slot => {
        if (slot.id === id) {
          return { ...slot, active: newActiveState, last_updated: new Date().toISOString() };
        }
        return slot;
      });
      
      setAdSlots(updatedSlots);
      localStorage.setItem('quiz_app_ad_slots', JSON.stringify(updatedSlots));
      
      // Dispatch a custom event to notify other components that ad slots have been updated
      // Only include the updated slots that are relevant
      window.dispatchEvent(new CustomEvent('adSlotsUpdated', { 
        detail: updatedSlots.filter(slot => slot.id === id)
      }));
      
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
  };
  
  // This effect only runs once on component mount to fetch ad slots
  useEffect(() => {
    fetchAdSlots();
    
    // Setup a debounced event listener for when ad slots are updated from elsewhere
    let debounceTimeout: NodeJS.Timeout | null = null;
    
    const handleAdSlotsUpdated = () => {
      // Avoid duplicate fetches by debouncing
      if (debounceTimeout) clearTimeout(debounceTimeout);
      
      debounceTimeout = setTimeout(() => {
        console.log('Ad slots updated event detected, refreshing...');
        fetchAdSlots();
      }, 300);
    };
    
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    
    return () => {
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, []);
  
  // This effect refreshes ad slots when realtime connection status changes
  useEffect(() => {
    if (isConnected) {
      console.log('Realtime connection established, refreshing ad slots...');
      fetchAdSlots();
    }
  }, [isConnected]);
  
  return {
    adSlots,
    setAdSlots,
    isLoading,
    fetchAdSlots,
    handleToggleActive
  };
};
