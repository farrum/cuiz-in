
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdSlot } from './useAdSlots';

export interface AdSlotVersion {
  id: string;
  slot_id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  created_at: string;
  version_number: number;
  created_by?: string;
  version_notes?: string;
}

export const useAdSlotEditor = (adSlots: AdSlot[], setAdSlots: (slots: AdSlot[]) => void) => {
  const { toast } = useToast();
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [versionNotes, setVersionNotes] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeout, setLockTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const form = useForm<AdSlot & {version_notes?: string}>();
  
  const acquireLock = async (slotId: string): Promise<boolean> => {
    try {
      setIsLocked(true);
      
      // In a real distributed system, we'd use a more robust locking mechanism
      // But for our purposes, we'll use a simple client-side lock
      
      if (lockTimeout) {
        clearTimeout(lockTimeout);
      }
      
      // Auto-release lock after 5 minutes
      const timeout = setTimeout(() => {
        setIsLocked(false);
      }, 5 * 60 * 1000);
      
      setLockTimeout(timeout);
      
      return true;
    } catch (err) {
      console.error('Failed to acquire lock:', err);
      return false;
    }
  };
  
  const releaseLock = () => {
    if (lockTimeout) {
      clearTimeout(lockTimeout);
      setLockTimeout(null);
    }
    setIsLocked(false);
  };
  
  const startEditing = async (slot: AdSlot) => {
    const lockAcquired = await acquireLock(slot.id);
    if (!lockAcquired) {
      toast({
        title: "Cannot Edit",
        description: "This ad slot is currently being edited by another user. Please try again later.",
        variant: "destructive"
      });
      return;
    }
    
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
    setVersionNotes('');
    form.reset();
    releaseLock();
  };
  
  const createNewVersion = async (slotId: string, values: any, currentVersionNumber: number): Promise<void> => {
    // Create a new version of the ad slot
    const { error: versionError } = await supabase
      .from('ad_slot_versions')
      .insert({
        slot_id: slotId,
        name: values.name,
        position: values.position,
        code: values.code,
        active: values.active,
        version_number: currentVersionNumber + 1,
        version_notes: values.version_notes || 'Update to ad slot'
      });
      
    if (versionError) {
      throw versionError;
    }
    
    // Start tracking performance for this version
    await supabase
      .from('ad_version_performance')
      .insert({
        slot_id: slotId,
        version_id: slotId, // Using slot_id temporarily here, will be updated when we know the version_id
        start_date: new Date().toISOString(),
      });
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
            last_updated: new Date().toISOString(),
            version_number: 1
          })
          .select();
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const newSlot = data[0] as AdSlot;
          
          // Create initial version record
          await createNewVersion(newSlot.id, {
            ...values,
            version_notes: 'Initial version'
          }, 0);
          
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
      } else if (editingSlot) {
        // Update the ad slot record
        const { error } = await supabase
          .from('ad_slots')
          .update({
            name: values.name,
            position: values.position,
            code: values.code,
            active: values.active,
            last_updated: new Date().toISOString(),
            version_number: (editingSlot.version_number || 1) + 1
          })
          .eq('id', values.id);
          
        if (error) throw error;
        
        // Create a new version record
        await createNewVersion(
          editingSlot.id,
          {
            ...values,
            version_notes: versionNotes || 'Updated ad slot'
          },
          editingSlot.version_number || 1
        );
        
        // Close the performance record for previous version
        const now = new Date().toISOString();
        await supabase
          .from('ad_version_performance')
          .update({ end_date: now })
          .eq('slot_id', editingSlot.id)
          .is('end_date', null);
        
        const updatedSlots = adSlots.map(slot => {
          if (slot.id === values.id) {
            return { 
              ...values, 
              last_updated: new Date().toISOString(),
              version_number: (slot.version_number || 1) + 1
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
      setVersionNotes('');
      releaseLock();
      
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
    versionNotes,
    setVersionNotes,
    startEditing,
    startCreatingNew,
    cancelEditing,
    saveAdSlot,
    isLocked
  };
};
