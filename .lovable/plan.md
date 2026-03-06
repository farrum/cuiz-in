
Goal: eliminate persistent 404s for category sitemap URLs by removing all redirect patterns that require query params/sub-path proxying, and switch to exact endpoint mapping only (the only pattern confirmed to work on this host).

What I found
1) `/sitemap.xml` and `/sitemap-main.xml` work, but all `/sitemap-category-*.xml` return app-level 404 (React NotFound), which means routing fell through to SPA fallback.
2) Direct Supabase endpoint works: `.../functions/v1/sitemap-category?category=general-knowledge` returns valid XML and hundreds of URLs.
3) Current `_redirects` category rules depend on query param forwarding (`...?category=...`), and prior approach depended on function sub-paths (`/sitemap-main/history`). Both have failed in production behavior.
4) Live sitemap responses are still stale (Jan date), so at least one edge deployment/cache is outdated.

Chosen implementation direction (your selected option)
Dedicated category functions (exact function endpoints per category) + exact redirects only.

Implementation plan
1) Create 8 lightweight edge functions (one per category)
- `sitemap-category-history`
- `sitemap-category-science`
- `sitemap-category-geography`
- `sitemap-category-literature`
- `sitemap-category-entertainment`
- `sitemap-category-sports`
- `sitemap-category-technology`
- `sitemap-category-general-knowledge`

Each function:
- uses same XML generation logic already proven in `sitemap-category`
- hardcodes its category slug internally (no query param parsing)
- paginates DB reads in 1000-row batches
- returns `Content-Type: application/xml; charset=UTF-8`
- returns cache headers `max-age=600, s-maxage=600`

2) Update `supabase/config.toml`
- Add `verify_jwt = false` entries for all 8 new functions (matching current public sitemap behavior).

3) Update `public/_redirects`
- Replace category rules to exact no-query endpoints, e.g.:
- `/sitemap-category-history.xml  https://.../functions/v1/sitemap-category-history 200!`
- Repeat for all 8 categories.
- Keep `/sitemap.xml`, `/sitemap-main.xml`, `/sitemap-amp.xml` rules as exact endpoint rewrites.
- Keep SPA fallback last.

4) Update `public/.htaccess` for parity
- Use explicit rules per category (not dynamic `(.+)` with query).
- Point each to exact function URL.
- Keep existing sitemap/main/amp rules.

5) Keep sitemap index consistent
- Ensure `sitemap-index` still lists:
- main sitemap
- 8 category sitemap URLs
- amp sitemap
- lastmod = current date.

6) Deploy + verify immediately (critical)
- Deploy: `sitemap-index`, `sitemap-main`, existing `sitemap-category`, plus all 8 new category functions.
- Verify with HTTP checks:
- `https://cuiz.in/sitemap.xml` -> 200, contains all child sitemap links
- each `https://cuiz.in/sitemap-category-*.xml` -> 200 XML (not HTML 404)
- `https://cuiz.in/sitemap-main.xml` -> 200
- `https://cuiz.in/sitemap-amp.xml` -> 200
- Verify in edge logs that category hits now reach new functions.

7) Post-fix SEO recovery steps
- Resubmit `https://cuiz.in/sitemap.xml` in Search Console.
- Re-run admin sitemap validator and confirm non-zero URL counts for every child sitemap.
- Monitor 24–72h for “Couldn’t fetch”/404 removal in GSC.

Why this will work
- It avoids both known failing patterns (query-param rewrite and sub-path function proxy).
- Every sitemap URL maps to a single exact edge function URL, which is the same pattern already working for `sitemap.xml` and `sitemap-main.xml`.

Risk and mitigation
- Risk: code duplication across 8 functions.
- Mitigation: keep functions tiny and identical except category constant; optionally refactor later after stability.
- Risk: stale CDN content.
- Mitigation: keep low cache TTL (600s), redeploy all sitemap functions together, then recheck after TTL window.

Definition of done
- All 10 sitemap URLs in index are 200 and parse as XML.
- No category sitemap URL renders app 404 page.
- Sitemap validator shows URL counts across all sitemap files (not only main).
