

## Sitemap Rebuild from Scratch

### Root Cause (finally confirmed)

After deep investigation, I found that **Lovable's CDN only reliably proxies 2 `.xml` URLs**: `/sitemap.xml` and `/sitemap-main.xml`. Every other `_redirects` rule for XML files fails silently (the request falls through to the SPA fallback and renders the React 404 page):

- `/sitemap-amp.xml` with `200!` proxy → **404** (React app)
- `/sitemap-category-*.xml` with `301` → **404** (React app)
- `/api/sitemap.xml` with `200!` proxy → **404** (React app)

Additionally, the live responses at `cuiz.in` show **January 7 dates** while the edge functions return **March 6 dates** -- the CDN is aggressively caching the proxied XML and never refreshing.

Meanwhile, ALL edge functions work perfectly when called directly:
- `sitemap-main` → 200, 2000+ URLs with today's date
- `sitemap-index` → 200, valid index XML
- `sitemap-category-history` → 200, 130+ URLs
- `sitemap-category-science` → 200, 120+ URLs

### The Solution: Query-Parameter Routing Through One Proven Proxy

Since only `/sitemap.xml` reliably proxies, we route ALL sitemap requests through it using **query parameters** to differentiate content. The edge function reads the query params and returns the appropriate XML.

```text
Browser/Google                    CDN                         Edge Function
───────────────────────────────────────────────────────────────────────────
/sitemap.xml              → proxy → sitemap-main         → sitemap INDEX
/sitemap.xml?type=main    → proxy → sitemap-main?type=   → static+blog+FAQ
/sitemap.xml?cat=history  → proxy → sitemap-main?cat=    → history questions
/sitemap.xml?cat=science  → proxy → sitemap-main?cat=    → science questions
  ...8 categories total
```

The sitemap index XML will list children as:
```xml
<sitemapindex>
  <sitemap><loc>https://cuiz.in/sitemap.xml?type=main</loc></sitemap>
  <sitemap><loc>https://cuiz.in/sitemap.xml?cat=history</loc></sitemap>
  <sitemap><loc>https://cuiz.in/sitemap.xml?cat=science</loc></sitemap>
  <!-- ...6 more categories -->
</sitemapindex>
```

Google treats URLs with different query parameters as distinct URLs, and the CDN `200!` rewrite passes query params through to the proxied destination.

### Implementation Steps

**1. Rewrite `sitemap-main` edge function (complete replacement)**
- No params → return sitemap index listing 9 children (main + 8 categories)
- `?type=main` → return static pages, category pages, blog posts, FAQs
- `?cat=history` (etc.) → return paginated questions for that category
- Add `Cache-Control: public, max-age=300` (5 min, shorter to prevent stale cache)
- Add `CDN-Cache-Control: max-age=300` header to control CDN caching separately

**2. Simplify `_redirects` to only proven rules**
```
# SSR
/quiz/question/:id/* → quiz-question-ssr 200!
/quiz/question/:id → quiz-question-ssr 200!

# Single sitemap proxy (the ONLY working pattern)
/sitemap.xml → sitemap-main 200!

# Legacy redirects (301 to sitemap.xml, but these may not work on CDN)
/sitemap-main.xml /sitemap.xml 301
/sitemap-category-*.xml /sitemap.xml 301
/sitemap-amp.xml /sitemap.xml 301

# SPA fallback
/* /index.html 200
```

**3. Update `robots.txt`**
- Point to `Sitemap: https://cuiz.in/sitemap.xml`

**4. Clean up admin dashboard**
- `SitemapUrlCounter`: Fetch from edge function URL directly (not cuiz.in), show counts per section (main, each category)
- `SitemapValidator`: Validate each child sitemap by calling edge function with appropriate query params, show status/count per section
- `SitemapManagement`: Update sitemap access URLs, remove stale references

**5. Clean up unused files and functions**
- Delete `public/sitemap-2026.xml` (stale static file)
- Remove `sitemapGenerator.ts` (unused legacy)
- Simplify `sitemapService.ts` to use edge function directly
- Remove all 8 dedicated `sitemap-category-*` edge functions from config.toml (keep the code for now, just unregister)
- Remove `sitemap-index`, `sitemap-static`, `sitemap` from config.toml

**6. Deploy and verify**
- Deploy `sitemap-main` with new query-param logic
- Test each query param combination via curl
- Publish site for CDN to pick up new `_redirects`

### Data Counts (verified)
- Quiz questions: 1,950
- Blog posts: 6
- FAQs: 6
- Static pages: 12
- Category pages: 8
- **Expected total**: ~1,982 URLs across all child sitemaps

