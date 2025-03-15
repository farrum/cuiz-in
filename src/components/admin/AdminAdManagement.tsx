
import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Layout, Loader2, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { AdSlotCard, AdSlotGrid, EditAdSlotDialog } from './ad-management';
import { useForm } from 'react-hook-form';

interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  last_updated: string;
}

const AdminAdManagement: React.FC = () => {
  const { toast } = useToast();
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<AdSlot>();
  
  useEffect(() => {
    fetchAdSlots();
  }, []);
  
  const fetchAdSlots = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_slots')
        .select('*')
        .order('name');
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Also save to localStorage as fallback
        localStorage.setItem('quiz_app_ad_slots', JSON.stringify(data));
        setAdSlots(data as AdSlot[]);
      }
    } catch (error) {
      console.error('Error fetching ad slots:', error);
      // Fallback to localStorage if Supabase fails
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
        // Creating a new ad slot
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
          setAdSlots([...adSlots, data[0] as AdSlot]);
          localStorage.setItem('quiz_app_ad_slots', JSON.stringify([...adSlots, data[0]]));
          
          toast({
            title: "Ad Slot Created",
            description: "New ad slot has been created successfully.",
          });
        }
      } else {
        // Updating existing ad slot
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
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading ad slots...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ad Management</h2>
          <p className="text-muted-foreground">Manage advertisement slots throughout the app</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={startCreatingNew}
            className="mr-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Ad Slot
          </Button>
          <div className="flex items-center space-x-2">
            <Switch
              checked={previewMode}
              onCheckedChange={setPreviewMode}
              id="preview-mode"
            />
            <Label htmlFor="preview-mode">
              {previewMode ? (
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  Preview Mode
                </div>
              ) : (
                <div className="flex items-center">
                  <EyeOff className="w-4 h-4 mr-1" />
                  Code Mode
                </div>
              )}
            </Label>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="top" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="middle">Middle</TabsTrigger>
          <TabsTrigger value="bottom">Bottom</TabsTrigger>
          <TabsTrigger value="all">All Slots</TabsTrigger>
        </TabsList>
        
        {['top', 'middle', 'bottom'].map(position => (
          <TabsContent key={position} value={position} className="space-y-4">
            {adSlots
              .filter(slot => slot.position === position)
              .map(slot => (
                <AdSlotCard
                  key={slot.id}
                  slot={slot}
                  previewMode={previewMode}
                  onToggleActive={handleToggleActive}
                  onEdit={startEditing}
                  formatDate={formatDate}
                />
              ))}
          </TabsContent>
        ))}
        
        <TabsContent value="all">
          <AdSlotGrid
            adSlots={adSlots}
            onToggleActive={handleToggleActive}
            onEdit={startEditing}
          />
        </TabsContent>
      </Tabs>
      
      <EditAdSlotDialog
        isOpen={!!editingSlot}
        onOpenChange={(open) => !open && cancelEditing()}
        editingSlot={editingSlot}
        form={form}
        onCancel={cancelEditing}
        onSave={saveAdSlot}
        isCreatingNew={isCreatingNew}
      />
    </div>
  );
};

export default AdminAdManagement;
