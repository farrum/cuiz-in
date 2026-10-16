import type { SitemapAuditResult } from '@/utils/adminSitemapAudit';

export default function SitemapAuditSummary({ result }: { result: SitemapAuditResult }) {
  const incomplete = result.rows.some(row => row.status === 'error');
  return <div className="space-y-3">
    <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4 md:grid-cols-4">
      {[
        ['Unique page URLs', result.summary.totalUrls],
        ['Database questions', result.databaseCount],
        ['Questions in sitemaps', result.summary.questionCount],
        [incomplete ? 'Not confirmed covered' : 'Coverage gap', result.summary.missingCount],
      ].map(([label, value]) => <div key={String(label)} className="text-center">
        <p className="text-2xl font-bold tabular-nums">{typeof value === 'number' ? value.toLocaleString() : '—'}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>)}
    </div>
    <p role="status" className={`text-sm ${incomplete || result.databaseError || result.summary.missingCount ? 'text-destructive' : 'text-secondary'}`}>
      {incomplete ? 'Coverage check incomplete: some sitemaps could not be read.' : result.databaseError ? `Database comparison unavailable: ${result.databaseError}` : result.summary.missingCount ? `${result.summary.missingCount.toLocaleString()} database questions are not accounted for by the discovered sitemap question URLs.` : result.summary.questionCount > (result.databaseCount ?? 0) ? 'Sitemaps contain more question IDs than the current database count; stale URLs may remain.' : 'All database questions are accounted for by the discovered sitemap question URLs.'}
    </p>
    <p className="text-xs text-muted-foreground">Live sitemap source · {result.rows.filter(row => row.isIndex).length} indexes · {result.rows.filter(row => !row.isIndex).length} child sitemaps · {result.summary.duplicateUrls.toLocaleString()} duplicate page URLs excluded. Sitemap coverage is not Google indexing status.</p>
  </div>;
}