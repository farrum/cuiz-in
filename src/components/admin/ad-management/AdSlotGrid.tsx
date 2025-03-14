
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  last_updated: string;
}

interface AdSlotGridProps {
  adSlots: AdSlot[];
  onToggleActive: (id: string) => void;
  onEdit: (slot: AdSlot) => void;
}

const AdSlotGrid: React.FC<AdSlotGridProps> = ({ adSlots, onToggleActive, onEdit }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {adSlots.map(slot => (
        <Card key={slot.id} className={slot.active ? "" : "opacity-60"}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{slot.name}</CardTitle>
              <Switch
                checked={slot.active}
                onCheckedChange={() => onToggleActive(slot.id)}
                id={`all-active-${slot.id}`}
              />
            </div>
            <CardDescription>Position: {slot.position}</CardDescription>
          </CardHeader>
          <CardFooter className="pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(slot)}
              className="w-full"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default AdSlotGrid;
