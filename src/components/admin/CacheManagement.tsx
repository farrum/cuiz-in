import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';

export function CacheManagement() {
  const { toast } = useToast();

  const clearLocalStorage = () => {
    try {
      // Keep essential admin authentication data
      const adminAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      
      // Clear all localStorage
      localStorage.clear();
      
      // Restore admin authentication if it existed
      if (adminAuth) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, adminAuth);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache Management</CardTitle>
        <CardDescription>
          Clear application cache to resolve data synchronization issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          variant="destructive" 
          onClick={clearLocalStorage}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear Cache
        </Button>
      </CardContent>
    </Card>
  );
}
