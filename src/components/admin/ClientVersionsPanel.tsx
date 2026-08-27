import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';

interface DiagnosticRow {
  app_version: string;
  app_platform: string;
  event: string;
  hits: number;
  last_seen: string;
}

const ClientVersionsPanel: React.FC = () => {
  const [rows, setRows] = useState<DiagnosticRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('admin_get_client_diagnostics', { p_days: 7 });
    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows((data as DiagnosticRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Client Versions</CardTitle>
          <CardDescription>
            Legacy / invalid task writes in the last 7 days, grouped by app build. Rows showing
            "unknown (legacy client)" come from outdated cached web bundles or old APKs.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        {!loading && rows.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No legacy client activity recorded.</p>
        )}
        {rows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App version</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Hits</TableHead>
                <TableHead>Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={`${r.app_version}-${r.app_platform}-${r.event}-${i}`}>
                  <TableCell className="font-mono text-xs">{r.app_version}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.app_platform}</Badge>
                  </TableCell>
                  <TableCell>{r.event}</TableCell>
                  <TableCell className="text-right">{r.hits}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(r.last_seen).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientVersionsPanel;
