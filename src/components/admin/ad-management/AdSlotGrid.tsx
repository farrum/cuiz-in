
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, History, Lock } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  last_updated: string;
  version_number?: number;
}

interface AdSlotGridProps {
  adSlots: AdSlot[];
  onToggleActive: (id: string) => void;
  onEdit: (slot: AdSlot) => void;
  isLocked?: boolean;
  onViewHistory: (slotId: string) => void;
}

const AdSlotGrid: React.FC<AdSlotGridProps> = ({ 
  adSlots, 
  onToggleActive, 
  onEdit, 
  isLocked = false,
  onViewHistory
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {adSlots.map(slot => (
        <Card key={slot.id} className={slot.active ? "" : "opacity-60"}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base">{slot.name}</CardTitle>
                {slot.version_number && (
                  <Badge variant="outline" className="text-xs">v{slot.version_number}</Badge>
                )}
              </div>
              <Switch
                checked={slot.active}
                onCheckedChange={() => !isLocked && onToggleActive(slot.id)}
                id={`all-active-${slot.id}`}
                disabled={isLocked}
              />
            </div>
            <CardDescription>Position: {slot.position}</CardDescription>
          </CardHeader>
          <CardFooter className="pt-2 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(slot)}
              className="flex-1"
              disabled={isLocked}
            >
              {isLocked ? <Lock className="w-4 h-4 mr-1" /> : <Edit className="w-4 h-4 mr-1" />}
              {isLocked ? "Locked" : "Edit"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewHistory(slot.id)}
            >
              <History className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default AdSlotGrid;
