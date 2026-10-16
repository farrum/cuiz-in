export interface ParsedSitemap {
  isIndex: boolean;
  urls: string[];
}

export function parseSitemap(xml: string): ParsedSitemap {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.getElementsByTagName('parsererror').length) throw new Error('Invalid sitemap XML');
  const root = document.documentElement;
  if (!['sitemapindex', 'urlset'].includes(root.localName) || root.namespaceURI !== 'http://www.sitemaps.org/schemas/sitemap/0.9') {
    throw new Error('Response is not a sitemap');
  }
  const isIndex = root.localName === 'sitemapindex';
  const entries = Array.from(root.children);
  const urls = entries.map(entry => {
    if (entry.localName !== (isIndex ? 'sitemap' : 'url')) throw new Error('Invalid sitemap entry');
    const loc = Array.from(entry.children).find(child => child.localName === 'loc')?.textContent?.trim();
    if (!loc) throw new Error('Sitemap entry is missing its URL');
    const url = new URL(loc);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid sitemap URL');
    return url.href;
  });
  if (urls.length > 50000) throw new Error('Sitemap exceeds the 50,000 entry limit');
  return { isIndex, urls };
}

export function sitemapRequestUrl(publicUrl: string, edgeBase: string): string {
  const url = new URL(publicUrl);
  // Only translate known public routes. Never silently map an unknown child to the index.
  if (url.origin === 'https://cuiz.in') {
    const target = new URL(edgeBase);
    if (url.pathname === '/sitemap.xml') target.searchParams.set('type', 'index');
    else if (url.pathname === '/sitemaps/main.xml') target.searchParams.set('type', 'main');
    else {
      const match = url.pathname.match(/^\/sitemaps\/category\/([^/]+)\/sitemap\.xml$/);
      if (!match || url.search) return publicUrl;
      target.searchParams.set('type', 'category');
      target.searchParams.set('category', decodeURIComponent(match[1]));
    }
    if (url.search) return publicUrl;
    return target.href;
  }
  return publicUrl;
}

export function summarizeSitemapUrls(urls: string[], databaseCount: number | null) {
  const uniqueUrls = new Set(urls);
  const questionIds = new Set<string>();
  for (const loc of uniqueUrls) {
    const url = new URL(loc);
    const match = url.pathname.match(/^\/quiz\/question\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$)/i);
    if (url.origin === 'https://cuiz.in' && match) questionIds.add(match[1].toLowerCase());
  }
  return {
    totalUrls: uniqueUrls.size,
    duplicateUrls: urls.length - uniqueUrls.size,
    questionCount: questionIds.size,
    missingCount: databaseCount === null ? null : Math.max(0, databaseCount - questionIds.size),
  };
}