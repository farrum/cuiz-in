import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { BarChart3, RefreshCw, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const EDGE_BASE = 'https://pgywvtphfidouakypdno.supabase.co/functions/v1/sitemap-static';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBneXd2dHBoZmlkb3Vha3lwZG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwOTQsImV4cCI6MjA1NzYwMzA5NH0.YazHsLiGkw-Uo-TYYAObWVzlf0HcZBDQjI5pP-F7Eco';

interface SitemapCount {
  name: string;
  param: string;
  count: number | null;
  status: 'loading' | 'success' | 'error';
  isIndex?: boolean;
}

const SITEMAPS = [
  { name: 'Index', param: '?type=index' },
  { name: 'Main (Static+Blog+FAQ)', param: '?type=main' },
  { name: 'History', param: '?type=category&category=history' },
  { name: 'Science', param: '?type=category&category=science' },
  { name: 'Geography', param: '?type=category&category=geography' },
  { name: 'Literature', param: '?type=category&category=literature' },
  { name: 'Entertainment', param: '?type=category&category=entertainment' },
  { name: 'Sports', param: '?type=category&category=sports' },
  { name: 'Technology', param: '?type=category&category=technology' },
  { name: 'General Knowledge', param: '?type=category&category=general-knowledge' },
  { name: 'Guinness World Records', param: '?type=category&category=guinness-world-records' },
];

const SitemapUrlCounter: React.FC = () => {
  const [counts, setCounts] = useState<SitemapCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCount = async (s: typeof SITEMAPS[0]): Promise<SitemapCount> => {
    try {
      const sep = s.param.includes('?') ? '&' : '?';
      const res = await fetch(`${EDGE_BASE}${s.param}${sep}_=${Date.now()}`, {
        headers: { 'Accept': 'application/xml', 'apikey': ANON_KEY },
        cache: 'no-store',
      });
      if (!res.ok) return { ...s, count: null, status: 'error' };
      const xml = await res.text();
      const isIndex = xml.includes('<sitemapindex');
      const matches = xml.match(isIndex ? /<sitemap>/g : /<url>/g);
      return { ...s, count: matches?.length || 0, status: 'success', isIndex };
    } catch {
      return { ...s, count: null, status: 'error' };
    }
  };

  const refreshCounts = async () => {
    setIsLoading(true);
    setCounts(SITEMAPS.map(s => ({ ...s, count: null, status: 'loading' as const })));
    try {
      const results = await Promise.all(SITEMAPS.map(fetchCount));
      setCounts(results);
      setLastUpdated(new Date());
      const totalUrls = results.filter(r => r.status === 'success' && !r.isIndex).reduce((sum, r) => sum + (r.count || 0), 0);
      const errors = results.filter(r => r.status === 'error').length;
      if (errors === 0) toast.success(`Found ${totalUrls.toLocaleString()} URLs across ${results.length - 1} sitemaps`);
      else toast.warning(`${errors} sitemaps failed`);
    } catch {
      toast.error('Failed to fetch sitemap counts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { refreshCounts(); }, []);

  const totalUrls = counts.filter(c => c.status === 'success' && !c.isIndex).reduce((sum, c) => sum + (c.count || 0), 0);
  const successCount = counts.filter(c => c.status === 'success').length;
  const errorCount = counts.filter(c => c.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sitemap URL Counter
            </CardTitle>
            <CardDescription>Live count from edge function (query-param routing)</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshCounts} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{isLoading ? '...' : totalUrls.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total URLs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-500">{isLoading ? '...' : successCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-500">{isLoading ? '...' : errorCount}</p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {(counts.length === 0 ? SITEMAPS : counts).map((sitemap, i) => {
            const s = sitemap as SitemapCount;
            return (
              <div key={i} className={`p-3 border rounded-lg transition-colors ${
                s.status === 'error' ? 'border-red-500/50 bg-red-500/5' :
                s.status === 'success' ? 'border-green-500/30 bg-green-500/5' : ''
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate">{s.name}</span>
                  {s.status === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
                  {s.status === 'success' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  {s.status === 'error' && <XCircle className="w-3 h-3 text-red-500" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    {s.status === 'loading' ? '...' : s.status === 'error' ? '—' : s.count?.toLocaleString()}
                  </span>
                  {s.isIndex ? (
                    <Badge variant="secondary" className="text-[10px] px-1">Index</Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">URLs</span>
                  )}
                </div>
                <a href={`${EDGE_BASE}${(sitemap as any).param || ''}`} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1">
                  View <ExternalLink className="w-2 h-2" />
                </a>
              </div>
            );
          })}
        </div>

        {lastUpdated && (
          <p className="text-xs text-muted-foreground text-center">Last updated: {lastUpdated.toLocaleTimeString()}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SitemapUrlCounter;
