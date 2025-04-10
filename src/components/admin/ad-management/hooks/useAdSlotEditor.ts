
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdSlot } from './useAdSlots';

export const useAdSlotEditor = (adSlots: AdSlot[], setAdSlots: (slots: AdSlot[]) => void) => {
  const { toast } = useToast();
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  const form = useForm<AdSlot>();
  
  const startEditing = (slot: AdSlot) => {
    setIsCreatingNew(false);
    setEditingSlot({ ...slot });
    form.reset(slot);
  };
  
  const startCreatingNew = () => {
    setIsCreatingNew(true);
    setEditingSlot({
      id: '',
      name: '',
      position: 'top',
      code: '',
      active: true,
      last_updated: new Date().toISOString()
    });
    form.reset({
      id: '',
      name: '',
      position: 'top',
      code: '',
      active: true,
      last_updated: new Date().toISOString()
    });
  };
  
  const cancelEditing = () => {
    setEditingSlot(null);
    setIsCreatingNew(false);
    form.reset();
  };
  
  const saveAdSlot = async () => {
    try {
      const values = form.getValues();
      
      if (isCreatingNew) {
        const { data, error } = await supabase
          .from('ad_slots')
          .insert({
            name: values.name,
            position: values.position,
            code: values.code,
            active: values.active,
            last_updated: new Date().toISOString()
          })
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const updatedSlots = [...adSlots, data[0] as AdSlot];
          setAdSlots(updatedSlots);
          localStorage.setItem('quiz_app_ad_slots', JSON.stringify(updatedSlots));
          
          // Dispatch event to notify other components of the update
          window.dispatchEvent(new CustomEvent('adSlotsUpdated', { detail: updatedSlots }));
          
          toast({
            title: "Ad Slot Created",
            description: "New ad slot has been created successfully.",
          });
        }
      } else {
        const { error } = await supabase
          .from('ad_slots')
          .update({
            name: values.name,
            position: values.position,
            code: values.code,
            active: values.active,
            last_updated: new Date().toISOString()
          })
          .eq('id', values.id);
          
        if (error) throw error;
        
        const updatedSlots = adSlots.map(slot => {
          if (slot.id === values.id) {
            return { 
              ...values, 
              last_updated: new Date().toISOString() 
            };
          }
          return slot;
        });
        
        setAdSlots(updatedSlots);
        localStorage.setItem('quiz_app_ad_slots', JSON.stringify(updatedSlots));
        
        // Dispatch event to notify other components of the update
        window.dispatchEvent(new CustomEvent('adSlotsUpdated', { detail: updatedSlots }));
        
        toast({
          title: "Ad Slot Updated",
          description: "Your changes have been saved successfully.",
        });
      }
      
      setEditingSlot(null);
      setIsCreatingNew(false);
      
    } catch (error) {
      console.error('Error saving ad slot:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your changes.",
        variant: "destructive"
      });
    }
  };
  
  return {
    editingSlot,
    isCreatingNew,
    form,
    startEditing,
    startCreatingNew,
    cancelEditing,
    saveAdSlot
  };
};
