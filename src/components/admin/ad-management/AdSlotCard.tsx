
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
import { Edit, History, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdSlotCardProps {
  slot: {
    id: string;
    name: string;
    position: string;
    code: string;
    active: boolean;
    last_updated: string;
    version_number?: number;
  };
  previewMode: boolean;
  onToggleActive: (id: string) => void;
  onEdit: (slot: any) => void;
  formatDate: (dateString: string) => string;
  isLocked?: boolean;
  onViewHistory?: () => void;
}

const AdSlotCard: React.FC<AdSlotCardProps> = ({
  slot,
  previewMode,
  onToggleActive,
  onEdit,
  formatDate,
  isLocked = false,
  onViewHistory
}) => {
  return (
    <Card key={slot.id}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <CardTitle>{slot.name}</CardTitle>
              {slot.version_number && (
                <Badge variant="outline" className="text-xs">v{slot.version_number}</Badge>
              )}
            </div>
            <CardDescription>Position: {slot.position}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={slot.active}
              onCheckedChange={() => !isLocked && onToggleActive(slot.id)}
              id={`active-${slot.id}`}
              disabled={isLocked}
            />
            <Label htmlFor={`active-${slot.id}`}>
              {slot.active ? 'Active' : 'Inactive'}
            </Label>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* SECURITY: Never render ad code as HTML - always show as safe text */}
        <div className="font-mono text-xs bg-secondary/10 p-3 rounded-md overflow-x-auto max-h-[200px] whitespace-pre-wrap">
          {slot.code || 'No ad code defined'}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Last updated: {formatDate(slot.last_updated)}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          onClick={() => onEdit(slot)}
          className="flex-1"
          disabled={isLocked}
        >
          {isLocked ? (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Locked
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Edit Ad Code
            </>
          )}
        </Button>
        {onViewHistory && (
          <Button
            variant="secondary"
            onClick={onViewHistory}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AdSlotCard;
