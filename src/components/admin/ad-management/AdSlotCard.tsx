
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Edit } from 'lucide-react';

interface AdSlotCardProps {
  slot: {
    id: string;
    name: string;
    position: string;
    code: string;
    active: boolean;
    last_updated: string;
  };
  previewMode: boolean;
  onToggleActive: (id: string) => void;
  onEdit: (slot: any) => void;
  formatDate: (dateString: string) => string;
}

const AdSlotCard: React.FC<AdSlotCardProps> = ({
  slot,
  previewMode,
  onToggleActive,
  onEdit,
  formatDate
}) => {
  return (
    <Card key={slot.id}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{slot.name}</CardTitle>
            <CardDescription>Position: {slot.position}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={slot.active}
              onCheckedChange={() => onToggleActive(slot.id)}
              id={`active-${slot.id}`}
            />
            <Label htmlFor={`active-${slot.id}`}>
              {slot.active ? 'Active' : 'Inactive'}
            </Label>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {previewMode ? (
          <div className="bg-secondary/30 border border-secondary rounded-md p-3 min-h-[100px]">
            <div className="text-xs text-muted-foreground mb-2 text-center">Advertisement Preview</div>
            <div dangerouslySetInnerHTML={{ __html: slot.code }} />
          </div>
        ) : (
          <div className="font-mono text-xs bg-secondary/10 p-3 rounded-md overflow-x-auto max-h-[200px]">
            {slot.code}
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-2">
          Last updated: {formatDate(slot.last_updated)}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={() => onEdit(slot)}
          className="w-full"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Ad Code
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdSlotCard;
