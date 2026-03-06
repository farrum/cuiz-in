

## Root Cause

The `_redirects` file proxies category sitemaps to sub-path URLs like `/functions/v1/sitemap-main/history`. While Supabase edge functions support this path-based routing (confirmed via direct curl), **Lovable's hosting CDN does not proxy to sub-paths of edge functions**. It only works for exact function URLs.

Evidence:
- `sitemap.xml` -> `/functions/v1/sitemap-index` (exact URL, works)
- `sitemap-main.xml` -> `/functions/v1/sitemap-main` (exact URL, works)
- `sitemap-category-history.xml` -> `/functions/v1/sitemap-main/history` (sub-path, 404)

Meanwhile, the dedicated `sitemap-category` edge function exists and works perfectly with query parameters (`/functions/v1/sitemap-category?category=history` returns 200 with correct XML).

**Additional issue**: The deployed `sitemap-index` is stale (lastmod 2026-01-07, lists only `sitemap-main.xml` without category sitemaps). It needs redeployment so Google sees all child sitemaps.

## Fix

### 1. Update `_redirects` to use `sitemap-category` function with query params

Change all 8 category redirect rules from:
```
/sitemap-category-history.xml https://...supabase.co/functions/v1/sitemap-main/history 200!
```
to:
```
/sitemap-category-history.xml https://...supabase.co/functions/v1/sitemap-category?category=history 200!
```

This uses the existing `sitemap-category` edge function which accepts `?category=` query params and is a single exact URL (no sub-paths).

### 2. Update `.htaccess` similarly

Change the RewriteRule from targeting `sitemap-main/$1` to `sitemap-category?category=$1`.

### 3. Redeploy stale edge functions

Redeploy `sitemap-index` and `sitemap-main` so the live versions match the updated code (with today's date and all category sitemaps listed).

### 4. Publish the app

After changes, the site must be published for the updated `_redirects` to take effect on Lovable's CDN.

