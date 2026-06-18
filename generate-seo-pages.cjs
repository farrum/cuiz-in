/**
 * Post-build SEO page generator.
 *
 * Lovable hosting serves the SPA's static index.html to crawlers for every
 * route (the client-side React Helmet tags are not executed by JS-light bots),
 * which is why Bing flags "identical titles / identical meta descriptions".
 *
 * This script runs AFTER `vite build`. It clones the freshly built
 * dist/index.html (which already references the correct hashed JS/CSS bundles)
 * into per-route static HTML files with UNIQUE title / description / canonical /
 * Open Graph tags baked in. The static file is served same-domain with a 200
 * (taking precedence over the SPA fallback), so crawlers get unique metadata,
 * while real users still receive the fully hydrating SPA (same bundles).
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const TEMPLATE = path.join(DIST, 'index.html');
const SITE_URL = 'https://cuiz.in';

if (!fs.existsSync(TEMPLATE)) {
  console.warn('[seo-pages] dist/index.html not found — skipping (build may be SPA-only).');
  process.exit(0);
}

const base = fs.readFileSync(TEMPLATE, 'utf8');

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function buildHtml({ title, description, canonical }) {
  let html = base;
  const t = esc(title);
  const d = esc(description);
  const url = esc(canonical);

  // <title>
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title data-rh="true">${t}</title>`);

  // canonical link — insert (or replace) right after </title>
  html = html.replace(/<link rel="canonical"[^>]*>/gi, '');
  html = html.replace(/<\/title>/i, `</title><link rel="canonical" href="${url}" data-rh="true"/>`);

  // description-family meta tags
  html = html.replace(
    /<meta\s+name="description"[^>]*>/i,
    `<meta name="description" content="${d}" data-rh="true"/>`
  );
  html = html.replace(
    /<meta\s+property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${d}" data-rh="true"/>`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[^>]*>/i,
    `<meta name="twitter:description" content="${d}" data-rh="true"/>`
  );

  // title-family meta tags
  html = html.replace(
    /<meta\s+property="og:title"[^>]*>/i,
    `<meta property="og:title" content="${t}" data-rh="true"/>`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"[^>]*>/i,
    `<meta name="twitter:title" content="${t}" data-rh="true"/>`
  );

  // url-family meta tags
  html = html.replace(
    /<meta\s+property="og:url"[^>]*>/i,
    `<meta property="og:url" content="${url}" data-rh="true"/>`
  );
  html = html.replace(
    /<meta\s+name="twitter:url"[^>]*>/i,
    `<meta name="twitter:url" content="${url}" data-rh="true"/>`
  );

  return html;
}

function write(routePath, meta) {
  const clean = routePath.replace(/^\/+|\/+$/g, '');
  const outDir = path.join(DIST, clean);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), buildHtml(meta), 'utf8');
}

// --- Main quiz categories (each gets its own name in the title) ---
const CATEGORIES = [
  ['history', 'History'],
  ['science', 'Science'],
  ['geography', 'Geography'],
  ['literature', 'Literature & Arts'],
  ['entertainment', 'Entertainment'],
  ['sports', 'Sports'],
  ['technology', 'Technology'],
  ['general-knowledge', 'General Knowledge'],
];

let count = 0;
for (const [slug, name] of CATEGORIES) {
  write(`/categories/${slug}`, {
    title: `${name} Quiz Questions | CuizIN - Free Trivia Game`,
    description: `Play free ${name} quiz questions on CuizIN. Test your ${name} knowledge, earn gems, climb the leaderboard, and win rewards. Start your ${name} trivia challenge now!`,
    canonical: `${SITE_URL}/categories/${slug}`,
  });
  count++;
}

// --- Static content / utility pages (unique titles + descriptions) ---
const STATIC_PAGES = {
  '/categories': {
    title: 'Quiz Categories | CuizIN - Browse All Trivia Topics',
    description:
      'Explore CuizIN quiz categories — history, science, geography, sports, entertainment, technology and more. Pick a topic and start playing free trivia.',
  },
  '/login': {
    title: 'Login to CuizIN | Access Your Quiz Account',
    description:
      'Login to your CuizIN account to play free quizzes across 10+ categories, climb the leaderboard, earn gems and track your daily streaks.',
  },
  '/register': {
    title: 'Register on CuizIN | Create Your Free Quiz Account',
    description:
      'Create a free CuizIN account in seconds. Play trivia quizzes, earn gems, compete on leaderboards and unlock rewards.',
  },
  '/profile': {
    title: 'My Profile | CuizIN',
    description:
      'View your CuizIN profile — track your quiz stats, gems, achievements, daily streaks and leaderboard position.',
  },
  '/blog': {
    title: 'CuizIN Blog | Trivia Tips, Facts & Quiz Guides',
    description:
      'Read the CuizIN blog for trivia tips, fascinating facts, quiz strategies and the latest updates from our quiz community.',
  },
  '/faq': {
    title: 'FAQ | CuizIN - Help & Frequently Asked Questions',
    description:
      'Find answers to common questions about CuizIN — how to play, earning gems, leaderboards, rewards and account help.',
  },
  '/how-to-play': {
    title: 'How to Play | CuizIN Quiz Guide',
    description:
      'Learn how to play CuizIN — answer trivia questions, earn gems, build streaks, climb the leaderboard and unlock rewards.',
  },
  '/referral-program': {
    title: 'Referral Program | Invite Friends & Earn on CuizIN',
    description:
      'Join the CuizIN referral program. Invite friends to play quizzes and earn bonus rewards when they sign up and play.',
  },
  '/terms': {
    title: 'Terms of Service | CuizIN',
    description: 'Read the CuizIN Terms of Service governing the use of our free quiz platform.',
  },
  '/privacy': {
    title: 'Privacy Policy | CuizIN',
    description: 'Read the CuizIN Privacy Policy to learn how we collect, use and protect your data.',
  },
  '/disclaimer': {
    title: 'Disclaimer | CuizIN',
    description: 'Read the CuizIN disclaimer covering the use of content on our free quiz platform.',
  },
};

for (const [route, meta] of Object.entries(STATIC_PAGES)) {
  write(route, { ...meta, canonical: `${SITE_URL}${route}` });
  count++;
}

console.log(`[seo-pages] Generated ${count} per-route static HTML files with unique metadata.`);
