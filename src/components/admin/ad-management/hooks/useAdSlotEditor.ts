
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdSlot } from './useAdSlots';
import { ExtendedDatabase } from '@/types/database-extensions';

export const useAdSlotEditor = (adSlots: AdSlot[], setAdSlots: (slots: AdSlot[]) => void) => {
  const { toast } = useToast();
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  const form = useForm<AdSlot & { version_notes?: string }>();
  
  const startEditing = (slot: AdSlot) => {
    if (isLocked) {
      toast({
        title: "Editing Locked",
        description: "Ad slots are currently locked for editing",
        variant: "destructive"
      });
      return;
    }
    setIsCreatingNew(false);
    setEditingSlot({ ...slot });
    form.reset(slot);
  };
  
  const startCreatingNew = () => {
    if (isLocked) {
      toast({
        title: "Editing Locked",
        description: "Ad slots are currently locked for editing",
        variant: "destructive"
      });
      return;
    }
    setIsCreatingNew(true);
    setEditingSlot({
      id: '',
      name: '',
      position: 'top',
      code: '',
      active: true,
      last_updated: new Date().toISOString(),
      version_number: 1
    });
    form.reset({
      id: '',
      name: '',
      position: 'top',
      code: '',
      active: true,
      last_updated: new Date().toISOString(),
      version_number: 1
    });
  };
  
  const cancelEditing = () => {
    setEditingSlot(null);
    setIsCreatingNew(false);
    form.reset();
  };
  
  const toggleLock = () => {
    setIsLocked(prev => !prev);
    toast({
      title: isLocked ? "Ad Slots Unlocked" : "Ad Slots Locked",
      description: isLocked 
        ? "Ad slots can now be edited" 
        : "Ad slots have been locked for editing",
    });
  };
  
  const saveAdSlot = async () => {
    if (isLocked) {
      toast({
        title: "Editing Locked",
        description: "Ad slots are currently locked for editing",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const values = form.getValues();
      const versionNotes = values.version_notes;
      const username = localStorage.getItem('quiz_app_admin_username') || 'admin';
      const now = new Date().toISOString();
      
      if (isCreatingNew) {
        const { data, error } = await supabase
          .from('ad_slots')
          .insert({
            name: values.name,
            position: values.position,
            code: values.code,
            active: values.active,
            last_updated: now,
            version_number: 1
          })
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const newSlot = data[0] as AdSlot;
          
          // Create first version entry
          await supabase
            .from('ad_slot_versions' as keyof ExtendedDatabase['public']['Tables'])
            .insert({
              slot_id: newSlot.id,
              name: newSlot.name,
              position: newSlot.position,
              code: newSlot.code,
              active: newSlot.active,
              version_number: 1,
              created_by: username,
              version_notes: versionNotes || 'Initial version'
            });
            
          // Create initial performance tracker entry
          await supabase
            .from('ad_version_performance' as keyof ExtendedDatabase['public']['Tables'])
            .insert({
              version_id: newSlot.id, // Using the same ID initially
              slot_id: newSlot.id,
              start_date: now,
              views: 0,
              clicks: 0,
              ctr: 0
            });
            
          const updatedSlots = [...adSlots, newSlot];
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
        // Update existing slot with a new version
        const currentSlot = adSlots.find(slot => slot.id === values.id);
        if (!currentSlot) throw new Error('Slot not found');
        
        const newVersionNumber = (currentSlot.version_number || 1) + 1;
        
        // Create a new version in ad_slot_versions
        const { data: versionData, error: versionError } = await supabase
            .from('ad_slot_versions' as keyof ExtendedDatabase['public']['Tables'])
            .insert({
              slot_id: values.id,
              name: values.name,
              position: values.position,
              code: values.code,
              active: values.active,
              version_number: newVersionNumber,
              created_by: username,
              version_notes: versionNotes || `Version ${newVersionNumber}`
            })
            .select('id')
            .single();
          
        if (versionError) throw versionError;
        
        // Close previous version performance tracking
        await supabase
            .from('ad_version_performance' as keyof ExtendedDatabase['public']['Tables'])
            .update({
              end_date: now
            })
            .eq('slot_id', values.id)
            .is('end_date', null);
          
        // Create new performance tracker entry
        if (versionData) {
          await supabase
            .from('ad_version_performance' as keyof ExtendedDatabase['public']['Tables'])
            .insert({
              version_id: versionData.id,
              slot_id: values.id,
              start_date: now,
              views: 0,
              clicks: 0,
              ctr: 0
            });
        }
        
        // Update the main ad_slots table
        const { error } = await supabase
          .from('ad_slots')
          .update({
            name: values.name,
            position: values.position,
            code: values.code,
            active: values.active,
            last_updated: now,
            version_number: newVersionNumber
          })
          .eq('id', values.id);
          
        if (error) throw error;
        
        const updatedSlots = adSlots.map(slot => {
          if (slot.id === values.id) {
            return { 
              ...values, 
              last_updated: now,
              version_number: newVersionNumber
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
          description: `Version ${newVersionNumber} has been created successfully.`,
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
    isLocked,
    startEditing,
    startCreatingNew,
    cancelEditing,
    saveAdSlot,
    toggleLock
  };
};
