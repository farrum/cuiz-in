
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Edit, Eye, EyeOff } from "lucide-react";
import { AdSlotVersionHistory } from "./AdSlotVersionHistory";

interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  last_updated: string;
  version_number?: number;
}

interface AdSlotCardProps {
  slot: AdSlot;
  onToggleActive: (id: string) => void;
  onEdit: (slot: AdSlot) => void;
  previewMode: boolean;
  formatDate: (dateString: string) => string;
}

export const AdSlotCard: React.FC<AdSlotCardProps> = ({
  slot,
  onToggleActive,
  onEdit,
  previewMode,
  formatDate,
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{slot.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Switch
                id={`active-${slot.id}`}
                checked={slot.active}
                onCheckedChange={() => onToggleActive(slot.id)}
              />
              <Label htmlFor={`active-${slot.id}`} className="text-xs">
                {slot.active ? "Active" : "Inactive"}
              </Label>
            </div>
            
            <Button variant="ghost" size="sm" onClick={() => onEdit(slot)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-2">
        <div className="text-xs text-muted-foreground flex justify-between">
          <span>Position: {slot.position}</span>
          <span>
            Version: {slot.version_number || 1}
            <AdSlotVersionHistory slotId={slot.id} slotName={slot.name} />
          </span>
        </div>
        
        <div>
          <div className="mt-2 mb-1 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Ad Code:</p>
            <div className="flex items-center">
              {previewMode ? (
                <Eye className="h-3 w-3 text-muted-foreground" />
              ) : (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-xs ml-1 text-muted-foreground">
                {previewMode ? "Preview Mode" : "Code Mode"}
              </span>
            </div>
          </div>
          
          {previewMode ? (
            <div
              className="border rounded-md p-2 bg-muted/30 min-h-[60px] max-h-[200px] overflow-auto"
              dangerouslySetInnerHTML={{ __html: slot.code }}
            />
          ) : (
            <pre className="border rounded-md p-2 bg-muted/30 text-xs overflow-auto max-h-[200px]">
              {slot.code}
            </pre>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          Last updated: {formatDate(slot.last_updated)}
        </div>
      </CardContent>
    </Card>
  );
};
