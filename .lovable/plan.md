

## SEO Recovery Plan — Fix Crawlability Without Rewriting the Site

### What's actually broken (verified, not guessed)

I fetched `https://cuiz.in/` as a crawler would. The HTML body returned is literally:
```html
<body><div id="root"></div></body>
```
Google sees nothing. It indexes nothing. That is why:
- SEMrush shows ~0 keywords
- Analytics shows ~0 conversions
- PageSpeed gives 100 SEO (your tags are fine) but 56 Performance (LCP 6.4s — JS too heavy for crawlers to wait)

### What's NOT broken (don't waste effort here)

- ✅ Meta tags, Open Graph, Twitter cards, canonicals — all correct
- ✅ Sitemaps (main + 8 categories + AMP) — generating fine
- ✅ Structured data (Schema.org Quiz, FAQPage, BreadcrumbList) — present
- ✅ `robots.txt`, `BingSiteAuth.xml`, IndexNow — all wired
- ✅ You already built `quiz-question-ssr` edge function that returns full HTML for question pages — it's just not being USED by crawlers
- ✅ AMP pages exist for every question

### Why moving to cPanel/WordPress is the wrong answer

| | Move to cPanel/WP | Fix on Lovable (this plan) |
|---|---|---|
| Rebuild 1,960 questions | Yes, manual import | No |
| Rebuild auth/admin/quiz engine | Yes, months | No |
| Rebuild Supabase backend | Yes | No |
| Cost | Hosting + plugins + dev time | $0 extra |
| Time to ranking | 3–6 months after rebuild | 2–4 weeks |
| Solves the real issue (crawler sees empty HTML) | Yes | Yes |

The advice from Gemini/Copilot is technically correct but assumes you have nothing built. You have a lot built. The fix is to serve crawlers prerendered HTML — same outcome, 1% of the work.

### The Plan (4 phases, ordered by impact)

#### Phase 1 — Bot prerendering for the homepage and key pages (biggest SEO win)

Build a new edge function `prerender` that:
- Detects Googlebot, Bingbot, Twitterbot, facebookexternalhit, LinkedInBot, etc. via User-Agent
- For bots: returns a fully-rendered HTML page (server-side built from Supabase data) with all visible content, headings, links to category and question pages
- For real users: passes through to the existing React SPA (no UX change)

Routes to prerender:
1. `/` — homepage with stats, category links, top questions, testimonials inline
2. `/categories` and `/categories/:slug` — category pages with question lists
3. `/quiz/question/:id/:slug` — already exists in `quiz-question-ssr`, just needs to be routed for bots
4. `/blog`, `/blog/:slug`, `/faq`, `/faq/:id` — content pages
5. `/topics`, `/topics/:slug`, `/all-questions`, `/browse` — index pages

Deployment routing: Add Cloudflare Worker (free tier) OR a single-line addition to Lovable's hosting layer that forwards bot requests to the edge function. (We'll start with the edge function itself proxying through `cuiz.in` via the existing redirect pattern in `.htaccess`-style routing.)

#### Phase 2 — Internal linking + content depth

Crawlers find content by following links. Right now the homepage has very few text links to deep content. Add:
- A static "Browse Questions by Category" block on the homepage (in HTML, not lazy-loaded) with all 8 category links and counts
- A static "Popular Questions" list on the homepage (top 20 question titles linked) — fetched server-side in the prerender
- A static footer sitemap with links to all category pages and main static pages
- Breadcrumbs visible on every quiz/category/FAQ page (component already exists, ensure it's used everywhere)

#### Phase 3 — Performance fixes flagged by PageSpeed

Current LCP is 6.4s on mobile — Google de-prioritizes slow pages. Fix:
- Inline the hero section's actual content (h1, subhead, CTAs) in `index.html` so it paints before React loads
- Defer all third-party scripts (GTM, AdSense, ad managers) — they account for most of the 560ms TBT
- Remove unused JS in the initial bundle (route-split the home page from admin/profile/team pages)
- Self-host the OG image as WebP and add `fetchpriority="high"`
- Set explicit width/height on every image to fix the 16-point CLS penalty

Target: LCP under 2.5s, TBT under 200ms, Performance score 85+.

#### Phase 4 — Submit and monitor

- Re-submit `sitemap.xml` in Google Search Console and Bing Webmaster
- Use "URL Inspection → Test Live URL" in GSC on 5 representative pages to confirm Google now sees full HTML
- Trigger IndexNow ping for all 1,960 question URLs (function already exists)
- Set up a weekly check: Search Console → Coverage report. Expect indexed pages to grow from current ~few to 1,500+ within 4 weeks.

### What you need to do (zero — this is all on me)

No external accounts, no migrations, no payments. Everything stays in Lovable + Supabase Cloud. Optional: I can help wire Cloudflare in front of cuiz.in for the bot-routing layer if Lovable's hosting can't intercept by User-Agent (free tier, 5-minute setup).

### Files to create / change

**New:**
- `supabase/functions/prerender/index.ts` — Bot detector + HTML generator for `/`, `/categories`, `/categories/:slug`, `/blog`, `/blog/:slug`, `/faq`, `/faq/:id`, `/topics`, `/topics/:slug`
- `supabase/functions/prerender-homepage/index.ts` — Dedicated homepage SSR with full content (stats, categories, popular questions)

**Modify:**
- `index.html` — Inline hero h1/subhead/CTA copy so first paint has content; add `<noscript>` SEO fallback with the homepage value prop and category links
- `src/pages/Index.tsx` — Render the category preview block synchronously (remove lazy load) so it's in the initial HTML when bots eventually JS-render
- `src/components/Footer.tsx` — Add static link grid to all categories + main pages
- `vite.config.ts` — Tighter chunk splitting; defer all non-critical scripts
- `public/_redirects` and/or routing layer — Send bot user-agents to the prerender function

### Honest expectation setting

- Indexing improvement: visible in Google Search Console within 7–14 days of deploy
- Traffic improvement: 4–8 weeks (Google needs to re-crawl, score, and rank)
- This will work. Your content is real, your structured data is correct, your sitemaps are clean. The single missing piece is "give crawlers HTML they can read instantly."

If after Phase 1 + 2 deploys and 4 weeks of monitoring you still see no movement in Search Console, *then* migration to a Next.js/SSR setup becomes the discussion. Not before.

