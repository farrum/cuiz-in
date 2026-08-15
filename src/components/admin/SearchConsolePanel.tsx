import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MousePointerClick, Eye, Percent, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

const RANGES = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 28 days', value: 28 },
  { label: 'Last 90 days', value: 90 },
];

const STORAGE_KEY = 'cuizin_gsc_site_url';
const TARGET_URL = 'https://cuiz.in/';

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

const SearchConsolePanel: React.FC = () => {
  const [sites, setSites] = useState<string[]>([]);
  const [siteUrl, setSiteUrl] = useState<string>('');
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [byDate, setByDate] = useState<Row[]>([]);
  const [queries, setQueries] = useState<Row[]>([]);
  const [pages, setPages] = useState<Row[]>([]);
  const [countries, setCountries] = useState<Row[]>([]);
  const [devices, setDevices] = useState<Row[]>([]);

  const call = useCallback(async (payload: Record<string, unknown>) => {
    const { data, error: fnError } = await supabase.functions.invoke('search-console', {
      body: payload,
    });
    if (fnError) {
      let details = fnError.message;
      try {
        const ctx = (fnError as unknown as { context?: Response }).context;
        if (ctx) details = await ctx.text();
      } catch { /* keep the original message */ }
      throw new Error(details);
    }
    if (data?.error) throw new Error(data.details || data.error);
    return data;
  }, []);

  // Load verified properties once.
  useEffect(() => {
    (async () => {
      setError(null);
      try {
        const data = await call({ action: 'list_sites', targetUrl: TARGET_URL });
        const list: string[] = (data.matches ?? []).map((s: { siteUrl: string }) => s.siteUrl);
        setSites(list);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && list.includes(stored)) setSiteUrl(stored);
        else if (list.length === 1) setSiteUrl(list[0]);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [call]);

  const loadData = useCallback(async () => {
    if (!siteUrl) return;
    setLoading(true);
    setError(null);
    // Search Console data lags ~2 days.
    const end = new Date(Date.now() - 2 * 86400000);
    const start = new Date(end.getTime() - (days - 1) * 86400000);
    const base = { action: 'query', siteUrl, startDate: fmtDate(start), endDate: fmtDate(end) };
    try {
      const [d, q, p, c, dev] = await Promise.all([
        call({ ...base, dimensions: ['date'], rowLimit: 200 }),
        call({ ...base, dimensions: ['query'], rowLimit: 50 }),
        call({ ...base, dimensions: ['page'], rowLimit: 50 }),
        call({ ...base, dimensions: ['country'], rowLimit: 15 }),
        call({ ...base, dimensions: ['device'], rowLimit: 5 }),
      ]);
      setByDate(d.rows ?? []);
      setQueries(q.rows ?? []);
      setPages(p.rows ?? []);
      setCountries(c.rows ?? []);
      setDevices(dev.rows ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [call, siteUrl, days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totals = useMemo(() => {
    const clicks = byDate.reduce((s, r) => s + (r.clicks || 0), 0);
    const impressions = byDate.reduce((s, r) => s + (r.impressions || 0), 0);
    const weightedPos = byDate.reduce((s, r) => s + (r.position || 0) * (r.impressions || 0), 0);
    return {
      clicks,
      impressions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      position: impressions > 0 ? weightedPos / impressions : 0,
    };
  }, [byDate]);

  const chartData = useMemo(
    () =>
      byDate
        .map((r) => ({
          date: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [byDate]
  );

  // Where we lose the audience: high impressions, low CTR.
  const missedOpportunities = useMemo(
    () =>
      [...queries]
        .filter((r) => r.impressions >= 50 && r.ctr < 0.02)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 15),
    [queries]
  );

  const strikingDistance = useMemo(
    () =>
      [...queries]
        .filter((r) => r.position > 8 && r.position <= 25)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 15),
    [queries]
  );

  const onSelectSite = (value: string) => {
    setSiteUrl(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  const statCards = [
    { label: 'Clicks', value: totals.clicks.toLocaleString(), icon: MousePointerClick },
    { label: 'Impressions', value: totals.impressions.toLocaleString(), icon: Eye },
    { label: 'Average CTR', value: `${totals.ctr.toFixed(2)}%`, icon: Percent },
    { label: 'Average position', value: totals.position.toFixed(1), icon: TrendingUp },
  ];

  const rowsTable = (rows: Row[], label: string, isPage = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{label}</TableHead>
          <TableHead className="text-right">Clicks</TableHead>
          <TableHead className="text-right">Impr.</TableHead>
          <TableHead className="text-right">CTR</TableHead>
          <TableHead className="text-right">Pos.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-sm text-muted-foreground">
              No reported data for this range.
            </TableCell>
          </TableRow>
        )}
        {rows.map((r) => (
          <TableRow key={r.keys.join('|')}>
            <TableCell className="max-w-[420px] truncate text-sm">
              {isPage ? (
                <a href={r.keys[0]} target="_blank" rel="noreferrer" className="hover:underline">
                  {r.keys[0].replace(/^https?:\/\/[^/]+/, '') || '/'}
                </a>
              ) : (
                r.keys[0]
              )}
            </TableCell>
            <TableCell className="text-right">{r.clicks.toLocaleString()}</TableCell>
            <TableCell className="text-right">{r.impressions.toLocaleString()}</TableCell>
            <TableCell className="text-right">{(r.ctr * 100).toFixed(2)}%</TableCell>
            <TableCell className="text-right">{r.position.toFixed(1)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Google Search Console</h2>
          <p className="text-sm text-muted-foreground">
            Real Google Search performance. Data lags about 2 days and low-volume queries are omitted by Google.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sites.length > 1 && (
            <Select value={siteUrl} onValueChange={onSelectSite}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Choose a property" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
          <Button size="sm" variant="ghost" onClick={loadData} disabled={loading || !siteUrl}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Search Console request failed</AlertTitle>
          <AlertDescription className="break-all text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {!siteUrl && sites.length > 1 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Choose a property</AlertTitle>
          <AlertDescription>
            Several verified properties cover this site. Pick one above to load its data.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clicks and impressions over time</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gscClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gscImpr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="impressions"
                stroke="hsl(var(--muted-foreground))"
                fill="url(#gscImpr)"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="clicks"
                stroke="hsl(var(--primary))"
                fill="url(#gscClicks)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="queries">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="queries">Top queries</TabsTrigger>
          <TabsTrigger value="pages">Top pages</TabsTrigger>
          <TabsTrigger value="missed">Missed audience</TabsTrigger>
          <TabsTrigger value="striking">Almost ranking</TabsTrigger>
          <TabsTrigger value="segments">Countries &amp; devices</TabsTrigger>
        </TabsList>

        <TabsContent value="queries" className="mt-4">
          <Card>
            <CardContent className="pt-6">{rowsTable(queries, 'Query')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="mt-4">
          <Card>
            <CardContent className="pt-6">{rowsTable(pages, 'Page', true)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seen but not clicked</CardTitle>
              <p className="text-sm text-muted-foreground">
                Queries with 50+ impressions and under 2% CTR. Google shows you, people skip you — rewrite these
                titles and descriptions first.
              </p>
            </CardHeader>
            <CardContent>{rowsTable(missedOpportunities, 'Query')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="striking" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Positions 8-25</CardTitle>
              <p className="text-sm text-muted-foreground">
                Close to page one. Small content or internal-linking gains here convert into real traffic.
              </p>
            </CardHeader>
            <CardContent>{rowsTable(strikingDistance, 'Query')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By country</CardTitle>
              </CardHeader>
              <CardContent>{rowsTable(countries, 'Country')}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">By device</CardTitle>
              </CardHeader>
              <CardContent>{rowsTable(devices, 'Device')}</CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SearchConsolePanel;