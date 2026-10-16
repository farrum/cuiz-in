import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { auditAllSitemaps, type SitemapAuditResult } from '@/utils/adminSitemapAudit';
import SitemapAuditSummary from './SitemapAuditSummary';

const SitemapUrlCounter = () => {
  const [result, setResult] = useState<SitemapAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const refreshCounts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const audit = await auditAllSitemaps((done, total) => setProgress(`${done} / ${total} sitemaps checked`));
      setResult(audit);
      setLastUpdated(new Date());
      const errors = audit.rows.filter(row => row.status === 'error').length;
      if (errors || audit.databaseError || audit.summary.missingCount) toast.warning('Sitemap count complete with coverage warnings');
      else toast.success(`Found ${audit.summary.totalUrls.toLocaleString()} unique page URLs`);
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : 'Failed to count sitemaps';
      setError(message);
      toast.error(message);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { void refreshCounts(); }, []);

  return <Card>
    <CardHeader>
      <div className="flex items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Sitemap URL Counter</CardTitle>
        <Button variant="outline" size="sm" onClick={refreshCounts} disabled={isLoading} aria-label="Refresh sitemap counts" title="Refresh sitemap counts">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {isLoading && <p role="status" className="text-sm text-muted-foreground">{progress || 'Loading sitemap index…'}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {result && <>
        <SitemapAuditSummary result={result} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {result.rows.map(row => <div key={row.publicUrl} className={`rounded-lg border p-3 ${row.status === 'error' ? 'border-destructive' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium capitalize break-words">{row.name}</span>
              <Badge variant={row.status === 'error' ? 'destructive' : 'secondary'}>{row.isIndex ? 'Index' : row.status === 'success' ? 'Read' : row.status}</Badge>
            </div>
            <p className="my-1 text-lg font-bold tabular-nums">{row.status === 'error' ? '—' : row.urls.length.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{row.message}</p>
            <a href={row.requestUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">View sitemap <ExternalLink className="h-3 w-3" /></a>
          </div>)}
        </div>
      </>}
      {lastUpdated && <p className="text-center text-xs text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}{isLoading ? ' · Refresh in progress' : ''}</p>}
    </CardContent>
  </Card>;
};
export default SitemapUrlCounter;
