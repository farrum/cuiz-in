import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ImageDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';

interface Props {
  onComplete?: () => void;
}

const RefetchImagesButton: React.FC<Props> = ({ onComplete }) => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ updated: number; errors: number; remaining: number } | null>(null);
  const { toast } = useToast();

  const run = async () => {
    const adminUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!adminUserId) {
      toast({ title: 'Not signed in', description: 'Admin login required', variant: 'destructive' });
      return;
    }
    setRunning(true);
    let totalUpdated = 0;
    let totalErrors = 0;
    let lastRemaining = Infinity;
    try {
      // Loop until no remaining or no progress
      // Safety cap: 200 batches
      for (let i = 0; i < 200; i++) {
        const { data, error } = await supabase.functions.invoke('backfill-question-images', {
          body: { adminUserId, batchSize: 5 },
        });
        if (error) throw error;
        const res = data as { processed: number; updated: number; errors: number; remaining: number };
        totalUpdated += res.updated;
        totalErrors += res.errors;
        setProgress({ updated: totalUpdated, errors: totalErrors, remaining: res.remaining });
        if (res.processed === 0 || res.remaining === 0) break;
        if (res.remaining >= lastRemaining && res.updated === 0) break; // no progress
        lastRemaining = res.remaining;
      }
      toast({
        title: 'Image refresh complete',
        description: `Updated ${totalUpdated} questions. ${totalErrors} errors.`,
      });
      onComplete?.();
    } catch (e) {
      console.error(e);
      toast({ title: 'Refresh failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Button onClick={run} disabled={running} variant="outline" size="sm" className="gap-2">
      {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
      {running
        ? `Refreshing… ${progress ? `(${progress.updated} done, ${progress.remaining} left)` : ''}`
        : 'Re-fetch relevant images'}
    </Button>
  );
};

export default RefetchImagesButton;