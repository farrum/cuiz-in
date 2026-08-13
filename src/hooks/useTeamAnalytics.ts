import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeamAnalyticsRow {
  member_id: string;
  day: string;
  answers: number;
  correct: number;
  quiz_points: number;
  gems: number;
}

export interface TeamAnalyticsMember {
  id: string;
  name: string;
}

/**
 * Fetches per-day activity for the leader's own squad via the
 * get_my_team_analytics security-definer RPC (server enforces ownership).
 */
export const useTeamAnalytics = (members: TeamAnalyticsMember[], days: number) => {
  const [rows, setRows] = useState<TeamAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idsKey = useMemo(
    () => members.map((m) => m.id).filter(Boolean).sort().join(','),
    [members]
  );

  const load = useCallback(async () => {
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_my_team_analytics' as any, {
        p_member_ids: ids,
        p_days: days,
      });
      if (rpcError) throw rpcError;
      setRows(
        ((data as any[]) || []).map((r) => ({
          member_id: r.member_id,
          day: r.day,
          answers: Number(r.answers) || 0,
          correct: Number(r.correct) || 0,
          quiz_points: Number(r.quiz_points) || 0,
          gems: Number(r.gems) || 0,
        }))
      );
    } catch (e: any) {
      console.error('Team analytics failed:', e);
      setError(e?.message || 'Failed to load analytics');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [idsKey, days]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading, error, refresh: load };
};
