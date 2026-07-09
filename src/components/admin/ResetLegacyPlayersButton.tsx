import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';

const ResetLegacyPlayersButton: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const { toast } = useToast();

  const handleClick = async () => {
    if (!confirm("Reset passwords for ALL legacy 'player*' accounts to a unique random password each?\n\nAffected users must use the password-recovery flow to set a new password. This does not affect quizadmin or real users.")) {
      return;
    }
    setRunning(true);
    setSummary(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-legacy-players', { body: {} });
      if (error || !data?.success) {
        toast({
          title: 'Reset failed',
          description: data?.error || error?.message || 'Unknown error',
          variant: 'destructive',
        });
        return;
      }
      setSummary(data.summary);
      toast({
        title: 'Reset complete',
        description: 'Each legacy account received a unique random password. Users must reset via password recovery. See summary below.',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <KeyRound className="h-4 w-4" />
        Reset legacy player passwords
      </div>
      <p className="text-xs text-muted-foreground">
        Sets every <code>player*</code> account's password to a unique random value and provisions
        a Supabase Auth user where missing. Passwords are not displayed; affected users must reset
        via the password-recovery flow. The current admin (quizadmin) is skipped.
      </p>
      <Button onClick={handleClick} disabled={running} variant="secondary">
        {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Resetting…</> : 'Reset legacy players'}
      </Button>
      {summary && (
        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{JSON.stringify(summary, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default ResetLegacyPlayersButton;