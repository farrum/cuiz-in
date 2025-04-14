
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AdDebuggerProps {
  position: string;
  slotId?: string;
  pageSection?: string;
  className?: string;
}

const AdDebugger: React.FC<AdDebuggerProps> = ({
  position,
  slotId,
  pageSection,
  className
}) => {
  // Get ad slots from localStorage
  const getLocalStorageAdSlots = () => {
    try {
      const storedAds = localStorage.getItem('quiz_app_ad_slots');
      if (storedAds) {
        // Handle both array format and object with timestamp format
        try {
          const parsed = JSON.parse(storedAds);
          if (Array.isArray(parsed)) {
            return parsed;
          } else if (parsed.data && Array.isArray(parsed.data)) {
            return parsed.data;
          }
        } catch (err) {
          console.error('Error parsing ad slots:', err);
        }
      }
      return [];
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return [];
    }
  };

  const adSlots = getLocalStorageAdSlots();
  
  // Filter for this specific position
  const matchingSlots = adSlots.filter((ad: any) => 
    ad.position === position && ad.active
  );

  // Find exact match
  const exactMatch = matchingSlots.find((ad: any) => 
    (slotId && ad.name?.includes(slotId)) || 
    (pageSection && ad.name?.includes(pageSection))
  );

  return (
    <Card className={`my-4 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Ad Slot Debug
          <Badge variant={matchingSlots.length > 0 ? "success" : "destructive"}>
            {matchingSlots.length > 0 ? "Slots Found" : "No Slots"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <strong>Requested Position:</strong> {position}
          </div>
          <div>
            <strong>Slot ID:</strong> {slotId || "default"}
          </div>
          <div>
            <strong>Page Section:</strong> {pageSection || "default"}
          </div>
          <div>
            <strong>Matching Slots:</strong> {matchingSlots.length}
          </div>
          
          {matchingSlots.length > 0 && (
            <div className="mt-2 space-y-2">
              <h4 className="font-medium">Available Slots:</h4>
              <div className="max-h-[200px] overflow-y-auto">
                {matchingSlots.map((slot: any, index: number) => (
                  <div key={index} className="p-2 border rounded mb-2">
                    <p><strong>Name:</strong> {slot.name}</p>
                    <p><strong>Active:</strong> {slot.active ? "Yes" : "No"}</p>
                    <p><strong>Is Exact Match:</strong> {
                      (exactMatch && exactMatch.id === slot.id) ? "Yes" : "No"
                    }</p>
                    <p className="text-xs text-muted-foreground truncate">
                      <strong>ID:</strong> {slot.id}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdDebugger;
