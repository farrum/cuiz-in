import { supabase } from '@/integrations/supabase/client';
import { parseSitemap, sitemapRequestUrl, summarizeSitemapUrls } from './sitemapAudit';

export interface SitemapAuditRow {
  name: string;
  publicUrl: string;
  requestUrl: string;
  status: 'success' | 'warning' | 'error';
  isIndex: boolean;
  urls: string[];
  responseTime: number;
  message: string;
}

export interface SitemapAuditResult {
  rows: SitemapAuditRow[];
  databaseCount: number | null;
  databaseError: string | null;
  summary: ReturnType<typeof summarizeSitemapUrls>;
}

const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap-static`;

export async function auditAllSitemaps(onProgress?: (completed: number, discovered: number) => void): Promise<SitemapAuditResult> {
  const countPromise = supabase.rpc('get_quiz_question_count').then(({ data, error }) => ({
    count: !error && typeof data === 'number' && data >= 0 ? data : null,
    error: error?.message || (typeof data !== 'number' ? 'Database question count unavailable' : null),
  }));
  const queue = ['https://cuiz.in/sitemap.xml'];
  const seen = new Set(queue);
  const rows: SitemapAuditRow[] = [];
  // Read every child of the live index, including nested indexes, without a fixed category list.
  while (queue.length) {
    const batch = queue.splice(0, 3);
    const results = await Promise.all(batch.map(async publicUrl => {
      const requestUrl = sitemapRequestUrl(publicUrl, EDGE_BASE);
      const started = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      const category = new URL(publicUrl).pathname.match(/\/category\/([^/]+)/)?.[1];
      const name = category ? decodeURIComponent(category).replace(/-/g, ' ') : publicUrl.endsWith('/sitemap.xml') ? 'Index' : new URL(publicUrl).pathname;
      try {
        const url = new URL(requestUrl);
        url.searchParams.set('_', String(Date.now()));
        const response = await fetch(url.href, {
          headers: { Accept: 'application/xml', ...(url.origin === new URL(EDGE_BASE).origin ? { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } : {}) },
          cache: 'no-store', signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const parsed = parseSitemap(await response.text());
        return { name, publicUrl, requestUrl, ...parsed, responseTime: Date.now() - started,
          status: parsed.urls.length ? 'success' as const : 'warning' as const,
          message: parsed.urls.length ? `${parsed.urls.length.toLocaleString()} ${parsed.isIndex ? 'child sitemaps' : 'URLs'}` : 'Empty sitemap' };
      } catch (error) {
        return { name, publicUrl, requestUrl, isIndex: false, urls: [], responseTime: Date.now() - started,
          status: 'error' as const, message: controller.signal.aborted ? 'Request timed out' : error instanceof Error ? error.message : 'Sitemap request failed' };
      } finally { clearTimeout(timeout); }
    }));
    for (const row of results) {
      rows.push(row);
      if (row.isIndex) for (const child of row.urls) {
        if (seen.has(child)) continue;
        seen.add(child);
        queue.push(child);
      }
    }
    onProgress?.(rows.length, seen.size);
  }
  const database = await countPromise;
  return { rows, databaseCount: database.count, databaseError: database.error,
    summary: summarizeSitemapUrls(rows.filter(row => !row.isIndex && row.status !== 'error').flatMap(row => row.urls), database.count) };
}