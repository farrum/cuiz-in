## Goal

Publish 4 new SEO-friendly blog posts, each weaving 5–6 internal links to real `/quiz/question/{id}/{slug}` URLs so search bots discover quiz content from blog content.

## Posts to create (category → linked questions)

1. **"Cricket Trivia: Test Your Knowledge of India's Favorite Game"** (Cricket)
   - Links to 2 cricket questions + 2 Indian sports/general questions.
2. **"Travel the World in Questions: A Geography Quiz Tour"** (Geography)
   - Links to 4 geography questions (Timbuktu, Sahara, longest river, etc.).
3. **"From Mughals to Modern Times: India's Most Fascinating History Questions"** (Indian History)
   - Links to 4 Indian-history questions (Fatehpur Sikri, Divide and Rule, Dravidian language, Indira Gandhi).
4. **"Tech Made Simple: Everyday Technology Questions That Trip People Up"** (Technology)
   - Links to 4 tech/science questions (WWW, Wi-Fi, unsupervised learning, table salt formula).

Each post will use real question IDs pulled from the live `quiz_questions` table (already sampled), so the internal links work immediately.

## Per-post structure

- 600–900 word friendly intro + 4–6 H2 sections.
- Each H2 wraps one question link with `<a href="/quiz/question/{id}/{slug}">…</a>`.
- Closing CTA linking to `/categories` or the relevant category page.
- `excerpt` set for listing/SEO snippets.
- `author = 'CuizIN Team'`, `is_published = true`, `published_at = now()`.
- Slug + `-{random4}` suffix to match existing convention.

## How it ships

One migration that `INSERT`s the 4 rows into `public.blog_posts`. No schema or RLS change — existing public-read policy already exposes them.

## Out of scope

- New routes, components, or sitemap edits (blog posts already feed the sitemap automatically).
- Image generation.