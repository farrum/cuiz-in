import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Globe, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { auditAllSitemaps, type SitemapAuditResult } from '@/utils/adminSitemapAudit';
import SitemapAuditSummary from './SitemapAuditSummary';

const SitemapValidator = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<SitemapAuditResult | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  const [error, setError] = useState('');

  const runValidation = async () => {
    setIsValidating(true);
    setResult(null);
    setError('');
    setProgress({ done: 0, total: 1 });
    try {
      const audit = await auditAllSitemaps((done, total) => setProgress({ done, total }));
      setResult(audit);
      const hasWarnings = audit.rows.some(row => row.status !== 'success') || audit.databaseError || audit.summary.missingCount || audit.summary.questionCount > (audit.databaseCount ?? 0);
      if (hasWarnings) toast.warning('Validation complete with coverage warnings');
      else toast.success(`All sitemaps valid: ${audit.summary.questionCount.toLocaleString()} questions covered`);
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : 'Sitemap validation failed';
      setError(message);
      toast.error(message);
    } finally { setIsValidating(false); }
  };

  return <Card>
    <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Sitemap Validator</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <Button onClick={runValidation} disabled={isValidating} className="gap-2">
        {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {isValidating ? 'Validating…' : 'Validate All Sitemaps'}
      </Button>
      {isValidating && <div className="space-y-2">
        <Progress value={progress.done / progress.total * 100} className="h-2" />
        <p role="status" className="text-sm text-muted-foreground">{progress.done} / {progress.total} discovered sitemaps checked</p>
      </div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {result && <>
        <SitemapAuditSummary result={result} />
        <div className="divide-y rounded-lg border">
          {result.rows.map(row => <div key={row.publicUrl} className="flex flex-wrap items-start justify-between gap-3 p-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {row.status === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" /> : row.status === 'error' ? <XCircle className="h-4 w-4 shrink-0 text-destructive" /> : <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />}
              <div className="min-w-0">
                <a href={row.requestUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium capitalize text-primary hover:underline">{row.name}</a>
                <p className="text-xs text-muted-foreground">{row.message}</p>
                {!row.isIndex && row.urls.slice(0, 3).map(url => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block max-w-sm truncate text-xs text-primary hover:underline">{url}</a>)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{row.responseTime}ms</span>
              <Badge variant={row.status === 'error' ? 'destructive' : 'outline'}>{row.urls.length.toLocaleString()} {row.isIndex ? 'children' : 'URLs'}</Badge>
            </div>
          </div>)}
        </div>
      </>}
    </CardContent>
  </Card>;
};
export default SitemapValidator;
