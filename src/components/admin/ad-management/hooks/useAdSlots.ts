import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  last_updated: string;
  version_number: number; // Added version_number field
}

export const useAdSlots = () => {
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdSlots();
  }, []);

  const fetchAdSlots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_slots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setAdSlots(data as AdSlot[]);
      }
    } catch (error: any) {
      console.error('Error fetching ad slots:', error);
      toast({
        title: "Error",
        description: "Could not load ad slots",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string) => {
    const slot = adSlots.find(slot => slot.id === id);
    if (!slot) return;

    try {
      const { error } = await supabase
        .from('ad_slots')
        .update({ active: !slot.active })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Optimistically update the state
      setAdSlots(adSlots.map(slot =>
        slot.id === id ? { ...slot, active: !slot.active } : slot
      ));

      toast({
        title: "Success",
        description: `Ad slot ${slot.name} ${slot.active ? 'deactivated' : 'activated'}`,
      });
    } catch (error: any) {
      console.error('Error toggling active state:', error);
      toast({
        title: "Error",
        description: "Could not update ad slot",
        variant: "destructive"
      });
    }
  };

  return {
    adSlots,
    loading,
    fetchAdSlots,
    toggleActive,
  };
};
