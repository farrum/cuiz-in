
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AdDebuggerProps {
  position?: string;
  slotId?: string;
  pageSection?: string;
  className?: string;
}

const AdDebugger: React.FC<AdDebuggerProps> = ({
  position,
  slotId,
  pageSection,
  className = ''
}) => {
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const adSlots = localStorage.getItem('quiz_app_ad_slots');
  const parsedSlots = adSlots ? JSON.parse(adSlots) : [];
  
  return (
    <Card className={`${className} text-xs`}>
      <CardHeader className="p-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Ad Debug: {position || 'all'} {slotId ? `/ ${slotId}` : ''}</span>
          <span className="text-muted-foreground text-xs">{pageSection || 'unknown'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        <div>
          <strong>Active Ad Slots:</strong> {parsedSlots.length}
        </div>
        {parsedSlots.map((slot: any, index: number) => (
          <div key={index} className="p-2 bg-muted/30 rounded text-xs">
            <div className="font-medium">{slot.position} - Active: {slot.active ? 'true' : 'false'}</div>
            <div className="text-muted-foreground truncate">ID: {slot.id?.substring(0, 8)}...</div>
            {slot.content && (
              <div className="mt-1 opacity-60 truncate">
                Content: {typeof slot.content === 'string' ? slot.content.substring(0, 30) + '...' : '[Object]'}
              </div>
            )}
          </div>
        ))}
        <Separator />
        <div className="text-muted-foreground italic">
          Current query: {position || '*'}/{slotId || '*'}/{pageSection || '*'}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdDebugger;
