
import React, { useState } from 'react';
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
import AdSlotVersions from './AdSlotVersions';
import { History, Lock, Unlock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdSlotTabsProps {
  adSlots: AdSlot[];
  previewMode: boolean;
  onToggleActive: (id: string) => void;
  onEdit: (slot: AdSlot) => void;
  formatDate: (dateString: string) => string;
  onCreateNew: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
}

const AdSlotTabs: React.FC<AdSlotTabsProps> = ({
  adSlots,
  previewMode,
  onToggleActive,
  onEdit,
  formatDate,
  onCreateNew,
  isLocked,
  onToggleLock
}) => {
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const handleViewHistory = (slotId: string) => {
    setSelectedSlotId(slotId);
    setVersionHistoryOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant={isLocked ? "destructive" : "outline"}
            size="sm"
            onClick={onToggleLock}
          >
            {isLocked ? (
              <>
                <Lock className="w-4 h-4 mr-1" />
                Locked
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 mr-1" />
                Unlocked
              </>
            )}
          </Button>
          {isLocked && (
            <Badge variant="outline" className="bg-red-50">
              Ad slots are locked for editing
            </Badge>
          )}
        </div>
      </div>

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
              .length > 0 ? (
                adSlots
                .filter(slot => slot.position === position)
                .map(slot => (
                  <AdSlotCard
                    key={slot.id}
                    slot={slot}
                    previewMode={previewMode}
                    onToggleActive={onToggleActive}
                    onEdit={onEdit}
                    formatDate={formatDate}
                    isLocked={isLocked}
                    onViewHistory={() => handleViewHistory(slot.id)}
                  />
                ))
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  No ad slots found for this position. 
                  <Button variant="link" onClick={onCreateNew} className="ml-2" disabled={isLocked}>
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
            isLocked={isLocked}
            onViewHistory={handleViewHistory}
          />
        </TabsContent>
      </Tabs>

      {selectedSlotId && (
        <AdSlotVersions
          slotId={selectedSlotId}
          isOpen={versionHistoryOpen}
          onClose={() => setVersionHistoryOpen(false)}
          currentVersion={adSlots.find(slot => slot.id === selectedSlotId)?.version_number || null}
        />
      )}
    </>
  );
};

export default AdSlotTabs;
