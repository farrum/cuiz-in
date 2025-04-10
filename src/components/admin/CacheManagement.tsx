
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { fixAdSlotsCache } from '@/integrations/supabase/dataSync';

export function CacheManagement() {
  const { toast } = useToast();
  const [isFixingAdSlots, setIsFixingAdSlots] = React.useState(false);

  const clearLocalStorage = () => {
    try {
      // Keep essential admin authentication data
      const adminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      const adminUsername = localStorage.getItem(STORAGE_KEYS.ADMIN_USERNAME);
      
      // Clear all localStorage
      localStorage.clear();
      
      // Restore admin authentication if it existed
      if (adminAuth) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, adminAuth);
      }
      
      if (adminUsername) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_USERNAME, adminUsername);
      }
      
      toast({
        title: "Cache Cleared",
        description: "Application cache has been successfully cleared.",
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear application cache.",
        variant: "destructive"
      });
    }
  };
  
  const handleFixAdSlots = async () => {
    setIsFixingAdSlots(true);
    try {
      const success = await fixAdSlotsCache();
      
      if (success) {
        toast({
          title: "Ad Slots Fixed",
          description: "Ad slots cache has been refreshed from the database.",
        });
      } else {
        toast({
          title: "Warning",
          description: "Could not refresh ad slots cache. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fixing ad slots:', error);
      toast({
        title: "Error",
        description: "Failed to fix ad slots cache.",
        variant: "destructive"
      });
    } finally {
      setIsFixingAdSlots(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache Management</CardTitle>
        <CardDescription>
          Clear application cache to resolve data synchronization issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          variant="destructive" 
          onClick={clearLocalStorage}
          className="gap-2 w-full"
        >
          <Trash2 className="h-4 w-4" />
          Clear All Cache
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleFixAdSlots}
          disabled={isFixingAdSlots}
          className="gap-2 w-full"
        >
          {isFixingAdSlots ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Fix Ad Slots Cache
        </Button>
      </CardContent>
    </Card>
  );
};
