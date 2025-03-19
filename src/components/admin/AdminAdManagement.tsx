
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
import { Eye, EyeOff, Layout, Loader2, Plus, BarChart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { AdSlotCard, AdSlotGrid, EditAdSlotDialog } from './ad-management';
import { useForm } from 'react-hook-form';
import { DataTable } from '@/components/ui/data-table';

interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  last_updated: string;
}

interface AdPerformance {
  ad_id: string;
  ad_name: string;
  ad_position: string;
  impressions: number;
  clicks: number;
  ctr: number;
  slot_id?: string;
  page_section?: string;
}

const AdminAdManagement: React.FC = () => {
  const { toast } = useToast();
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReports, setShowReports] = useState(false);
  const [adPerformance, setAdPerformance] = useState<AdPerformance[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  
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
        localStorage.setItem('quiz_app_ad_slots', JSON.stringify(data));
        setAdSlots(data as AdSlot[]);
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
  
  const fetchAdPerformance = async () => {
    setIsLoadingReports(true);
    try {
      const { data: viewCheck, error: viewCheckError } = await supabase
        .from('ad_performance_reports')
        .select('*')
        .limit(1);
        
      if (viewCheckError) {
        // If the view doesn't exist, we'll calculate the metrics ourselves
        // First get impressions data
        const { data: impressionsData, error: impressionsError } = await supabase
          .from('ad_views')
          .select('ad_id, ad_position, slot_id, page_section, count(*)')
          .is('slot_id', null)
          .not('slot_id', 'eq', '')
          .is('page_section', null)
          .not('page_section', 'eq', '')
          
        if (impressionsError) {
          throw impressionsError;
        }
        
        // Get impressions with specific slot_id and page_section
        const { data: impressionsWithSlotData, error: impressionsWithSlotError } = await supabase
          .from('ad_views')
          .select('ad_id, ad_position, slot_id, page_section, count(*)')
          .not('slot_id', 'is', null)
          .not('page_section', 'is', null);
          
        if (impressionsWithSlotError) {
          throw impressionsWithSlotError;
        }
        
        // Merge the impression datasets
        const allImpressions = [
          ...(impressionsData || []),
          ...(impressionsWithSlotData || [])
        ];
        
        // Then get clicks data
        const { data: clicksData, error: clicksError } = await supabase
          .from('ad_clicks')
          .select('ad_id, ad_position, slot_id, page_section, count(*)')
          .is('slot_id', null)
          .not('slot_id', 'eq', '')
          .is('page_section', null)
          .not('page_section', 'eq', '');
          
        if (clicksError) {
          throw clicksError;
        }
        
        // Get clicks with specific slot_id and page_section
        const { data: clicksWithSlotData, error: clicksWithSlotError } = await supabase
          .from('ad_clicks')
          .select('ad_id, ad_position, slot_id, page_section, count(*)')
          .not('slot_id', 'is', null)
          .not('page_section', 'is', null);
          
        if (clicksWithSlotError) {
          throw clicksWithSlotError;
        }
        
        // Merge the clicks datasets
        const allClicks = [
          ...(clicksData || []),
          ...(clicksWithSlotData || [])
        ];
        
        // Get ad slots data for names
        const { data: slotsData } = await supabase
          .from('ad_slots')
          .select('id, name');
          
        const slotsMap = new Map(slotsData?.map(slot => [slot.id, slot.name]) || []);
        
        // Process and combine the data
        const combinedData: AdPerformance[] = [];
        
        for (const imp of allImpressions) {
          const clickData = allClicks.find(click => 
            click.ad_id === imp.ad_id && 
            click.ad_position === imp.ad_position &&
            click.slot_id === imp.slot_id &&
            click.page_section === imp.page_section
          );
          
          const clickCount = clickData ? parseInt(clickData.count) : 0;
          const impressionCount = parseInt(imp.count);
          const ctr = impressionCount > 0 ? (clickCount / impressionCount) * 100 : 0;
          
          combinedData.push({
            ad_id: imp.ad_id,
            ad_name: slotsMap.get(imp.ad_id) || 'Unknown Ad',
            ad_position: imp.ad_position,
            impressions: impressionCount,
            clicks: clickCount,
            ctr: parseFloat(ctr.toFixed(2)),
            slot_id: imp.slot_id || imp.ad_position,
            page_section: imp.page_section || imp.ad_position
          });
        }
        
        setAdPerformance(combinedData);
      } else {
        // If the view exists, just use it
        const { data, error } = await supabase
          .from('ad_performance_reports')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setAdPerformance(data as AdPerformance[]);
        }
      }
    } catch (error) {
      console.error('Error fetching ad performance:', error);
      toast({
        title: "Error Loading Ad Reports",
        description: "Could not load ad performance data.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingReports(false);
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
            onClick={() => {
              if (showReports) {
                setShowReports(false);
              } else {
                setShowReports(true);
                fetchAdPerformance();
              }
            }}
            variant="outline"
          >
            <BarChart className="w-4 h-4 mr-1" />
            {showReports ? "Hide Reports" : "Show Reports"}
          </Button>
          
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
      
      {showReports && (
        <div className="glass rounded-xl p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Ad Performance Reports</h3>
          
          <DataTable
            columns={[
              { header: 'Ad Name', accessorKey: 'ad_name' },
              { header: 'Position', accessorKey: 'ad_position' },
              { 
                header: 'Slot/Location', 
                accessorKey: 'slot_id',
                cell: (row) => row.slot_id || row.ad_position
              },
              {
                header: 'Page Section',
                accessorKey: 'page_section',
                cell: (row) => row.page_section || '-'
              },
              { 
                header: 'Impressions', 
                accessorKey: 'impressions',
                cell: (row) => row.impressions.toLocaleString()
              },
              { 
                header: 'Clicks', 
                accessorKey: 'clicks',
                cell: (row) => row.clicks.toLocaleString()
              },
              { 
                header: 'CTR', 
                accessorKey: 'ctr',
                cell: (row) => `${row.ctr.toFixed(2)}%`
              }
            ]}
            data={adPerformance}
            isLoading={isLoadingReports}
          />
          
          <div className="text-sm text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      )}
      
      <Tabs defaultValue="top" className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="middle">Middle</TabsTrigger>
          <TabsTrigger value="bottom">Bottom</TabsTrigger>
          <TabsTrigger value="sidebar">Sidebar</TabsTrigger>
          <TabsTrigger value="all">All Slots</TabsTrigger>
        </TabsList>
        
        {['top', 'middle', 'bottom', 'sidebar'].map(position => (
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
              {adSlots.filter(slot => slot.position === position).length === 0 && (
                <div className="text-center p-6 text-muted-foreground">
                  No ad slots found for this position. 
                  <Button variant="link" onClick={startCreatingNew} className="ml-2">
                    Create one now
                  </Button>
                </div>
              )}
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
