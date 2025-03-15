
import React from 'react';
import { Button } from '@/components/ui/button';

interface DemoControlsProps {
  referralId: string | undefined;
  onSimulateActivity: (id: string, isActive: boolean) => void;
}

const DemoControls: React.FC<DemoControlsProps> = ({ 
  referralId,
  onSimulateActivity
}) => {
  if (!referralId) return null;
  
  return (
    <div className="mt-4 border-t border-dashed pt-4">
      <div className="text-xs text-muted-foreground mb-2">Demo Controls:</div>
      <div className="flex flex-wrap gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onSimulateActivity(referralId, true)}
        >
          Simulate Monthly Activity
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onSimulateActivity(referralId, false)}
        >
          Simulate Inactivity
        </Button>
      </div>
    </div>
  );
};

export default DemoControls;
