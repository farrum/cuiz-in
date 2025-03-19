
import React from 'react';
import { AdSlot } from './hooks/useAdSlots';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import AdSlotCard from './AdSlotCard';
import AdSlotGrid from './AdSlotGrid';
import { Button } from '@/components/ui/button';

interface AdSlotTabsProps {
  adSlots: AdSlot[];
  previewMode: boolean;
  onToggleActive: (id: string) => void;
  onEdit: (slot: AdSlot) => void;
  formatDate: (dateString: string) => string;
  onCreateNew: () => void;
}

const AdSlotTabs: React.FC<AdSlotTabsProps> = ({
  adSlots,
  previewMode,
  onToggleActive,
  onEdit,
  formatDate,
  onCreateNew
}) => {
  return (
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
                onToggleActive={onToggleActive}
                onEdit={onEdit}
                formatDate={formatDate}
              />
            ))}
            {adSlots.filter(slot => slot.position === position).length === 0 && (
              <div className="text-center p-6 text-muted-foreground">
                No ad slots found for this position. 
                <Button variant="link" onClick={onCreateNew} className="ml-2">
                  Create one now
                </Button>
              </div>
            )}
        </TabsContent>
      ))}
      
      <TabsContent value="all">
        <AdSlotGrid
          adSlots={adSlots}
          onToggleActive={onToggleActive}
          onEdit={onEdit}
        />
      </TabsContent>
    </Tabs>
  );
};

export default AdSlotTabs;
