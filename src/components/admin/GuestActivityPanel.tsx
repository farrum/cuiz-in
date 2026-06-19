import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Eye, CheckSquare, Lock, UserPlus, RefreshCw } from 'lucide-react';

interface GuestEvent {
  id: string;
  session_id: string;
  event_type: string;
  path: string | null;
  question_id: string | null;
  correct: boolean | null;
  points: number | null;
  country: string | null;
  device: string | null;
  referrer: string | null;
  created_at: string;
}

const RANGES = [
  { label: 'Last 24h', value: 1 },
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
];

const GuestActivityPanel: React.FC = () => {
  const [events, setEvents] = useState<GuestEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState<{
    sessions: number;
    pageViews: number;
    answers: number;
    limitReached: number;
    registered: number;
    conversionRate: number;
    topCountries: [string, number][];
    topDevices: [string, number][];
  }>({
    sessions: 0,
    pageViews: 0,
    answers: 0,
    limitReached: 0,
    registered: 0,
    conversionRate: 0,
    topCountries: [],
    topDevices: [],
  });

  const fetchEvents = async (rangeDays: number) => {
    setLoading(true);
    const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch recent activity (strictly limit to 100 rows for performance)
    const { data: recentData, error: recentError } = await supabase
      .from('guest_events')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!recentError && recentData) {
      setEvents(recentData as GuestEvent[]);
    }

    // 2. Fetch aggregated stats using RPC (uncapped)
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_guest_activity_stats', { since_date: since });

    if (!statsError && statsData) {
      const s = statsData as any;
      const sessions = s.sessions || 0;
      const registered = s.registered || 0;
      setStats({
        sessions,
        pageViews: s.page_views || 0,
        answers: s.answers || 0,
        limitReached: s.limit_reached || 0,
        registered,
        conversionRate: sessions > 0 ? (registered / sessions) * 100 : 0,
        topCountries: s.top_countries || [],
        topDevices: s.top_devices || [],
      });
    } else {
      console.warn('Failed to fetch stats via RPC, falling back to client-side calculations', statsError);
      // Fallback: If RPC fails, fetch up to 1000 events to compute fallback stats
      const { data: fallbackData } = await supabase
        .from('guest_events')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000);

      const eventsToCompute = fallbackData || recentData || [];
      const fSessions = new Set(eventsToCompute.map((e) => e.session_id));
      const fPageViews = eventsToCompute.filter((e) => e.event_type === 'page_view').length;
      const fAnswers = eventsToCompute.filter((e) => e.event_type === 'answer').length;
      const fLimitReached = eventsToCompute.filter((e) => e.event_type === 'limit_reached').length;
      const fRegistered = eventsToCompute.filter((e) => e.event_type === 'registered').length;
      const fConversionRate = fSessions.size > 0 ? (fRegistered / fSessions.size) * 100 : 0;

      const byCountry: Record<string, number> = {};
      const byDevice: Record<string, number> = {};
      for (const e of eventsToCompute) {
        const c = e.country || 'unknown';
        const d = e.device || 'unknown';
        byCountry[c] = (byCountry[c] || 0) + 1;
        byDevice[d] = (byDevice[d] || 0) + 1;
      }
      const topCountries = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const topDevices = Object.entries(byDevice).sort((a, b) => b[1] - a[1]);

      setStats({
        sessions: fSessions.size,
        pageViews: fPageViews,
        answers: fAnswers,
        limitReached: fLimitReached,
        registered: fRegistered,
        conversionRate: fConversionRate,
        topCountries,
        topDevices,
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEvents(days);
  }, [days]);

  const statCards = [
    { label: 'Guest Sessions', value: stats.sessions, icon: Users },
    { label: 'Page Views', value: stats.pageViews, icon: Eye },
    { label: 'Questions Answered', value: stats.answers, icon: CheckSquare },
    { label: 'Hit Free Limit', value: stats.limitReached, icon: Lock },
    { label: 'Conversions', value: stats.registered, icon: UserPlus },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Anonymous / Guest Activity</h2>
          <p className="text-sm text-muted-foreground">
            What visitors who never signed in are doing. Conversion rate:{' '}
            <span className="font-medium text-foreground">{stats.conversionRate.toFixed(1)}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={days === r.value ? 'default' : 'outline'}
              onClick={() => setDays(r.value)}
            >
              {r.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => fetchEvents(days)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <s.icon className="h-4 w-4" />
                <span className="text-xs">{s.label}</span>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Country</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topCountries.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
            {stats.topCountries.map(([country, count]) => (
              <div key={country} className="flex items-center justify-between text-sm">
                <span>{country}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Device</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topDevices.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
            {stats.topDevices.map(([device, count]) => (
              <div key={device} className="flex items-center justify-between text-sm">
                <span className="capitalize">{device}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.slice(0, 100).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(e.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="capitalize">{e.event_type.replace('_', ' ')}</TableCell>
                    <TableCell>{e.country || '—'}</TableCell>
                    <TableCell className="capitalize">{e.device || '—'}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs">{e.path || '—'}</TableCell>
                    <TableCell>
                      {e.event_type === 'answer'
                        ? e.correct
                          ? '✅ Correct'
                          : '❌ Wrong'
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No guest activity recorded in this period yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestActivityPanel;