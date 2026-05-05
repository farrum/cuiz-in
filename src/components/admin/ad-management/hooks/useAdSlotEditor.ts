
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdSlot } from './useAdSlots';
import { ExtendedDatabase } from '@/types/database-extensions';

// Define a simple interface for the performance data to avoid complex type inference
interface VersionPerformanceData {
  version_id: string;
  slot_id: string;
  start_date: string;
  views: number;
  clicks: number;
  ctr: number;
  end_date?: string | null;
}

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
      code: '<!-- size: 728x90 -->',
      active: true,
      last_updated: new Date().toISOString(),
      version_number: 1
    });
    form.reset({
      id: '',
      name: '',
      position: 'top',
      code: '<!-- size: 728x90 -->',
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
      
      console.log('Starting ad slot save operation...', { isCreatingNew, values });

      if (isCreatingNew) {
        // Validation for new slots
        if (!values.id || !values.name || !values.code) {
          toast({
            title: "Validation Error",
            description: "ID, Name, and Code are required for new slots.",
            variant: "destructive"
          });
          return;
        }

        const { data, error } = await supabase
          .from('ad_slots')
          .insert({
            id: values.id,
            name: values.name,
            position: values.position,
            code: values.code,
            active: values.active,
            last_updated: now,
            version_number: 1
          })
          .select();
          
        if (error) {
          console.error('ad_slots insert error:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          const newSlot = data[0] as AdSlot;
          
          // Create first version entry
          const { data: versionData, error: vError } = await supabase
            .from('ad_slot_versions')
            .insert({
              slot_id: newSlot.id,
              name: newSlot.name,
              position: newSlot.position,
              code: newSlot.code,
              active: newSlot.active,
              version_number: 1,
              created_by: username,
              version_notes: versionNotes || 'Initial version'
            })
            .select('id')
            .single();

          if (vError) {
            console.warn('ad_slot_versions insert error (non-critical):', vError);
          } else if (versionData) {
            // Create initial performance tracker entry
            await supabase
              .from('ad_version_performance')
              .insert({
                version_id: versionData.id,
                slot_id: newSlot.id,
                start_date: now,
                views: 0,
                clicks: 0,
                ctr: 0
              } as any);
          }
            
          const updatedSlots = [...adSlots, newSlot];
          setAdSlots(updatedSlots);
          
          toast({
            title: "Ad Slot Created",
            description: "New ad slot has been created successfully.",
          });
        }
      } else {
        // Update existing slot
        const currentSlot = adSlots.find(slot => slot.id === values.id);
        if (!currentSlot) throw new Error('Slot not found');
        
        const newVersionNumber = (currentSlot.version_number || 1) + 1;
        
        // 1. Create a new version record
        const { data: versionData, error: versionError } = await supabase
            .from('ad_slot_versions')
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
          
        if (versionError) {
          console.error('version creation error:', versionError);
          // We continue to update the main slot even if versioning fails
        }
        
        // 2. Close previous performance tracking and start new one
        if (versionData) {
          try {
            await supabase
                .from('ad_version_performance')
                .update({ end_date: now })
                .eq('slot_id', values.id)
                .is('end_date', null);
              
            await supabase
              .from('ad_version_performance')
              .insert({
                version_id: versionData.id,
                slot_id: values.id,
                start_date: now,
                views: 0,
                clicks: 0,
                ctr: 0
              } as any);
          } catch (perfErr) {
            console.warn('performance tracking update error:', perfErr);
          }
        }
        
        // 3. Update the main ad_slots table (The most important step)
        const { error: updateError } = await supabase
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
          
        if (updateError) {
          console.error('ad_slots update error:', updateError);
          throw updateError;
        }
        
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
        
        toast({
          title: "Ad Slot Updated",
          description: `Version ${newVersionNumber} has been saved successfully.`,
        });
      }
      
      setEditingSlot(null);
      setIsCreatingNew(false);
      
    } catch (error: any) {
      console.error('Detailed error saving ad slot:', error);
      toast({
        title: "Save Failed",
        description: error.message || "There was an error saving your changes. Check console for details.",
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
