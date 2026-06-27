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
 *
 * It also queries the Supabase database to inject pre-rendered HTML content
 * inside a <div class="ssr-content"> block next to the React SPA root (<div id="root">).
 * This content is visible to crawlers immediately, but is hidden from real users
 * once the SPA hydrates via the CSS rule:
 * `#root:not(:empty) + .ssr-content { display: none; }`
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DIST = path.join(__dirname, 'dist');
const TEMPLATE = path.join(DIST, 'index.html');
const SITE_URL = 'https://cuiz.in';

// Load environment variables from process.env or parse .env file
let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          if (key === 'VITE_SUPABASE_URL') supabaseUrl = value;
          if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') supabaseKey = value;
        }
      }
    }
  } catch (e) {
    console.warn('Warning: Could not read local .env file:', e.message);
  }
}

if (!fs.existsSync(TEMPLATE)) {
  console.warn('[seo-pages] dist/index.html not found — skipping (build may be SPA-only).');
  process.exit(0);
}

const base = fs.readFileSync(TEMPLATE, 'utf8');

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function createSlug(text, maxLength = 80) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, maxLength)
    .replace(/-$/, '');
}

const slugToCategoriesMap = {
  'history': ['History'],
  'science': [
    'Science', 
    'Science & Nature', 
    'Science &amp; Nature',
    'Nature',
    'Science: Mathematics'
  ],
  'geography': ['Geography'],
  'literature': [
    'Art', 
    'Arts & Literature', 
    'Arts and Literature',
    'Entertainment: Books'
  ],
  'entertainment': [
    'Entertainment', 
    'Entertainment: Board Games', 
    'Entertainment: Books', 
    'Entertainment: Cartoon & Animations',
    'Entertainment: Cartoon &amp; Animations',
    'Entertainment: Comics', 
    'Entertainment: Film',
    'Entertainment: Japanese Anime & Manga',
    'Entertainment: Japanese Anime &amp; Manga',
    'Entertainment: Music', 
    'Entertainment: Musicals & Theatres',
    'Entertainment: Musicals &amp; Theatres',
    'Entertainment: Television', 
    'Entertainment: Video Games',
    'Celebrities'
  ],
  'sports': ['Sports', 'Cricket'],
  'technology': [
    'Science: Computers', 
    'Science: Gadgets', 
    'Science and Technology',
    'Science & Technology',
    'Vehicles'
  ],
  'general-knowledge': [
    'General Knowledge', 
    'Mythology', 
    'Animals', 
    'Culture',
    'Food & Drink',
    'Food and Drinks',
    'Politics'
  ],
  'guinness-world-records': [
    'Guinness World Records'
  ],
  'k-pop-k-drama': [
    'K-Pop Music', 'Korean Drama', 'K-Pop & K-Drama'
  ]
};

const categoryToSlugMap = {};
for (const [slug, cats] of Object.entries(slugToCategoriesMap)) {
  for (const cat of cats) {
    categoryToSlugMap[cat] = slug;
  }
}
function getCategorySlug(cat) {
  return categoryToSlugMap[cat] || 'general-knowledge';
}

function buildHtml({ title, description, canonical, bodyHtml }) {
  let html = base;
  const t = esc(title);
  const d = esc(description);
  const url = esc(canonical);

  // <title>
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title data-rh="true">${t}</title>`);

  // canonical link — insert (or replace) right after </title>
  html = html.replace(/<link rel="canonical"[^>]*>/gi, '');
  html = html.replace(/<\/title>/i, `</title>\n<link rel="canonical" href="${url}" data-rh="true"/>`);

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

  // Hybrid SSR/SPA body HTML injection
  if (bodyHtml) {
    // Inject the CSS styles in head
    html = html.replace('</head>', `<style>
      #root:not(:empty) + .ssr-content { display: none; }
      .ssr-content { max-width: 960px; margin: 0 auto; padding: 24px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.6; }
      .ssr-content a { color: #2563eb; text-decoration: none; }
      .ssr-content a:hover { text-decoration: underline; }
      .ssr-content h1 { font-size: 28px; margin: 0 0 12px; }
      .ssr-content h2 { font-size: 20px; margin: 24px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
      .ssr-content h3 { font-size: 16px; margin: 18px 0 8px; }
      .ssr-content .tag { display: inline-block; background: #f1f5f9; color: #475569; border-radius: 4px; padding: 2px 8px; font-size: 12px; margin-right: 6px; }
      .ssr-content nav.bc { font-size: 14px; color: #64748b; margin-bottom: 16px; }
      .ssr-content ul { padding-left: 18px; margin: 12px 0; }
      .ssr-content li { margin: 6px 0; }
    </style>\n</head>`);

    // Inject the fallback content next to root
    html = html.replace('<div id="root"></div>', `<div id="root"></div>\n<div class="ssr-content">\n${bodyHtml}\n</div>`);
  }

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
  ['guinness-world-records', 'Guinness World Records'],
  ['k-pop-k-drama', 'K-Pop & K-Drama'],
];

// --- Static content / utility pages (unique titles + descriptions) ---
const STATIC_PAGES = {
  '/login': {
    title: 'Login to CuizIN | Access Your Quiz Account',
    description: 'Login to your CuizIN account to play free quizzes across 10+ categories, climb the leaderboard, earn gems and track your daily streaks.',
  },
  '/register': {
    title: 'Register on CuizIN | Create Your Free Quiz Account',
    description: 'Create a free CuizIN account in seconds. Play trivia quizzes, earn gems, compete on leaderboards and unlock rewards.',
  },
  '/profile': {
    title: 'My Profile | CuizIN',
    description: 'View your CuizIN profile — track your quiz stats, gems, achievements, daily streaks and leaderboard position.',
  },
  '/blog': {
    title: 'CuizIN Blog | Trivia Tips, Facts & Quiz Guides',
    description: 'Read the CuizIN blog for trivia tips, fascinating facts, quiz strategies and the latest updates from our quiz community.',
  },
  '/faq': {
    title: 'FAQ | CuizIN - Help & Frequently Asked Questions',
    description: 'Find answers to common questions about CuizIN — how to play, earning gems, leaderboards, rewards and account help.',
  },
  '/how-to-play': {
    title: 'How to Play | CuizIN Quiz Guide',
    description: 'Learn how to play CuizIN — answer trivia questions, earn gems, build streaks, climb the leaderboard and unlock rewards.',
  },
  '/referral-program': {
    title: 'Referral Program | Invite Friends & Earn on CuizIN',
    description: 'Join the CuizIN referral program. Invite friends to play quizzes and earn bonus rewards when they sign up and play.',
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

async function run() {
  let allQuestions = [];
  let databaseAvailable = false;

  const cachePath = path.join(__dirname, 'temp-questions-cache.json');
  if (fs.existsSync(cachePath)) {
    try {
      allQuestions = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      databaseAvailable = true;
      console.log(`[seo-pages] Loaded ${allQuestions.length} questions from local cache.`);
    } catch (err) {
      console.warn('[seo-pages] WARNING: Failed to read local cache, falling back to Supabase:', err.message);
    }
  }

  if (!databaseAvailable && supabaseUrl && supabaseKey) {
    try {
      console.log('[seo-pages] Fetching all questions for static pre-rendering...');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('id, question, category')
          .order('id')
          .range(from, from + batchSize - 1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          allQuestions = allQuestions.concat(data);
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      console.log(`[seo-pages] Fetched ${allQuestions.length} questions successfully.`);
      databaseAvailable = true;
    } catch (err) {
      console.warn('[seo-pages] WARNING: Could not connect to Supabase or query questions. Falling back to metadata-only templates.', err.message);
    }
  } else if (!databaseAvailable) {
    console.warn('[seo-pages] WARNING: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY not configured. Falling back to metadata-only templates.');
  }

  let count = 0;

  // 1. GENERATE CATEGORIES INDEX PAGE
  let categoriesIndexHtml = null;
  if (databaseAvailable) {
    const catCounter = {};
    allQuestions.forEach(q => {
      const cat = q.category || 'General Knowledge';
      catCounter[cat] = (catCounter[cat] || 0) + 1;
    });

    const categoryListItems = CATEGORIES.map(([slug, name]) => {
      // Find database categories mapped to this slug
      const dbCategories = slugToCategoriesMap[slug] || [];
      const totalCount = dbCategories.reduce((sum, dbCat) => sum + (catCounter[dbCat] || 0), 0);
      return `<li><a href="/categories/${slug}"><strong>${esc(name)}</strong></a> &mdash; ${totalCount} questions</li>`;
    }).join('\n');

    categoriesIndexHtml = `
      <nav class="bc"><a href="/">Home</a> &rsaquo; Categories</nav>
      <h1>All Quiz Categories</h1>
      <p>Choose from ${CATEGORIES.length} quiz categories to test your knowledge.</p>
      <ul>
        ${categoryListItems}
      </ul>
    `;
  }
  
  write('/categories', {
    title: 'Quiz Categories | CuizIN - Browse All Trivia Topics',
    description: 'Explore CuizIN quiz categories — history, science, geography, sports, entertainment, technology and more. Pick a topic and start playing free trivia.',
    canonical: `${SITE_URL}/categories`,
    bodyHtml: categoriesIndexHtml
  });
  count++;

  // 2. GENERATE CATEGORY DETAIL PAGES
  for (const [slug, name] of CATEGORIES) {
    let catDetailHtml = null;
    
    if (databaseAvailable) {
      const dbCategories = slugToCategoriesMap[slug] || [];
      const matchedQuestions = allQuestions.filter(q => dbCategories.includes(q.category));
      
      const questionListItems = matchedQuestions
        .slice(0, 500) // Show up to 500 questions per category on the static page for crawler traversability
        .map(q => {
          const qSlug = createSlug(q.question);
          return `<li><a href="/quiz/question/${q.id}/${slug}/${qSlug}">${esc(q.question)}</a></li>`;
        })
        .join('\n');

      catDetailHtml = `
        <nav class="bc"><a href="/">Home</a> &rsaquo; <a href="/categories">Categories</a> &rsaquo; ${esc(name)}</nav>
        <h1>${esc(name)} Quiz Questions</h1>
        <p>Explore ${matchedQuestions.length} trivia questions in the ${esc(name)} category. Select any question to play.</p>
        <ul>
          ${questionListItems || '<li>No questions found in this category.</li>'}
        </ul>
      `;
    }

    write(`/categories/${slug}`, {
      title: `${name} Quiz Questions | CuizIN - Free Trivia Game`,
      description: `Play free ${name} quiz questions on CuizIN. Test your ${name} knowledge, earn gems, climb the leaderboard, and win rewards. Start your ${name} trivia challenge now!`,
      canonical: `${SITE_URL}/categories/${slug}`,
      bodyHtml: catDetailHtml
    });
    count++;
  }

  // 3. GENERATE ALL-QUESTIONS HTML SITEMAP PAGE
  let allQuestionsHtml = null;
  if (databaseAvailable) {
    // Group all questions by their display category
    const grouped = {};
    CATEGORIES.forEach(([slug, name]) => {
      grouped[name] = [];
    });

    allQuestions.forEach(q => {
      const catSlug = getCategorySlug(q.category);
      const catName = (CATEGORIES.find(([slug]) => slug === catSlug) || ['', 'General Knowledge'])[1];
      if (!grouped[catName]) {
        grouped[catName] = [];
      }
      grouped[catName].push(q);
    });

    const categoryNavItems = CATEGORIES.map(([slug, name]) => {
      const qList = grouped[name] || [];
      return `<a href="#cat-${slug}" class="tag" style="margin: 4px; padding: 6px 12px; background: #e2e8f0; border-radius: 4px; text-decoration: none;">${esc(name)} (${qList.length})</a>`;
    }).join(' ');

    const categorySections = CATEGORIES.map(([slug, name]) => {
      const qList = grouped[name] || [];
      const questionItems = qList
        .slice(0, 100) // Show up to 100 latest questions on the HTML sitemap page to prevent AI/SEO HTML truncation
        .map(q => {
          const qSlug = createSlug(q.question);
          return `<li><a href="/quiz/question/${q.id}/${slug}/${qSlug}">${esc(q.question)}</a></li>`;
        })
        .join('\n');

      return `
        <section id="cat-${slug}" style="margin-bottom: 32px;">
          <h2>${esc(name)} <span style="font-size: 14px; font-weight: normal; color: #64748b;">(${qList.length} questions)</span></h2>
          <ul>
            ${questionItems || '<li>No questions available.</li>'}
          </ul>
          ${qList.length > 100 ? `<p><a href="/categories/${slug}" style="font-weight: bold; color: #2563eb; text-decoration: none;">View all ${qList.length} ${esc(name)} questions &rsaquo;</a></p>` : ''}
        </section>
      `;
    }).join('\n');

    allQuestionsHtml = `
      <nav class="bc"><a href="/">Home</a> &rsaquo; All Questions</nav>
      <h1>All Quiz Questions & Answers</h1>
      <p>Directory of ${allQuestions.length.toLocaleString()} quiz questions across ${CATEGORIES.length} categories.</p>
      
      <div style="margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h3>Jump to Category</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          ${categoryNavItems}
        </div>
      </div>

      ${categorySections}
    `;
  }

  write('/all-questions', {
    title: `All ${databaseAvailable ? allQuestions.length.toLocaleString() : '15,000+'} Quiz Questions & Answers | CuizIN`,
    description: `Complete directory of ${databaseAvailable ? allQuestions.length.toLocaleString() : '15,000+'} quiz questions and answers. Browse by category — History, Science, Sports, Entertainment, Geography, and more.`,
    canonical: `${SITE_URL}/all-questions`,
    bodyHtml: allQuestionsHtml
  });
  count++;

  // 4. GENERATE OTHER STATIC UTILITY PAGES (No database fallback)
  for (const [route, meta] of Object.entries(STATIC_PAGES)) {
    write(route, { ...meta, canonical: `${SITE_URL}${route}` });
    count++;
  }

  // 5. GENERATE INDIVIDUAL BLOG PAGES (Dynamic from Supabase + Static Fallback)
  let dbBlogs = [];
  if (supabaseUrl && supabaseKey) {
    try {
      console.log('[seo-pages] Fetching published blogs from Supabase...');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (!error && data) {
        dbBlogs = data.map(b => ({
          slug: b.slug,
          title: b.title,
          excerpt: b.excerpt || '',
          category: b.category || 'General',
          date: b.published_at ? b.published_at.split('T')[0] : b.created_at ? b.created_at.split('T')[0] : '',
          author: b.author || 'CuizIN Team',
          readTime: b.read_time || '5 min read',
          content: b.content || ''
        }));
        console.log(`[seo-pages] Fetched ${dbBlogs.length} blogs successfully from database.`);
      } else if (error) {
        console.warn('[seo-pages] Warning: Failed to fetch blogs from Supabase:', error.message);
      }
    } catch (err) {
      console.warn('[seo-pages] Warning: Failed to connect or query blogs:', err.message);
    }
  }

  let staticBlogs = [];
  const blogDataPath = path.join(__dirname, 'src', 'utils', 'blogData.ts');
  if (fs.existsSync(blogDataPath)) {
    try {
      const content = fs.readFileSync(blogDataPath, 'utf8');
      const marker = 'export const blogPosts: BlogPost[] = ';
      const index = content.indexOf(marker);
      if (index !== -1) {
        let jsonStr = content.substring(index + marker.length).trim();
        if (jsonStr.endsWith(';')) {
          jsonStr = jsonStr.substring(0, jsonStr.length - 1).trim();
        }
        staticBlogs = JSON.parse(jsonStr);
        console.log(`[seo-pages] Loaded ${staticBlogs.length} static blogs from blogData.ts.`);
      } else {
        console.warn('[seo-pages] Warning: Could not find blogPosts marker in blogData.ts');
      }
    } catch (err) {
      console.warn('[seo-pages] Warning: Failed to parse static blogData.ts:', err.message);
    }
  }

  // Merge database blogs and static blogs (favoring database version on slug collision)
  const allBlogs = [...dbBlogs];
  const dbSlugs = new Set(dbBlogs.map(b => b.slug));
  staticBlogs.forEach(sb => {
    if (!dbSlugs.has(sb.slug)) {
      allBlogs.push(sb);
    }
  });

  console.log(`[seo-pages] Generating static pages for ${allBlogs.length} total blog posts...`);
  for (const blog of allBlogs) {
    const blogHtml = `
      <nav class="bc"><a href="/">Home</a> &rsaquo; <a href="/blog">Blog</a> &rsaquo; ${esc(blog.title)}</nav>
      <article>
        <h1>${esc(blog.title)}</h1>
        <div style="font-size: 14px; color: #64748b; margin-bottom: 20px;">
          <span>Category: <strong>${esc(blog.category)}</strong></span> &bull; 
          <span>Published: <strong>${esc(blog.date)}</strong></span> &bull; 
          <span>Author: <strong>${esc(blog.author)}</strong></span> &bull; 
          <span>Read Time: <strong>${esc(blog.readTime)}</strong></span>
        </div>
        <div class="content">
          ${blog.content}
        </div>
      </article>
    `;

    write(`/blog/${blog.slug}`, {
      title: `${blog.title} | CuizIN Blog`,
      description: blog.excerpt || `${blog.title} - Read this article on the CuizIN Blog.`,
      canonical: `${SITE_URL}/blog/${blog.slug}`,
      bodyHtml: blogHtml
    });
    count++;
  }

  console.log(`[seo-pages] Successfully generated ${count} per-route static HTML files.`);

  // Cleanup temporary cache file if it exists
  if (fs.existsSync(cachePath)) {
    try {
      fs.unlinkSync(cachePath);
      console.log('[seo-pages] Temporary cache file deleted.');
    } catch (err) {
      console.warn('[seo-pages] Warning: Could not delete cache file:', err.message);
    }
  }

  console.log(`[seo-pages] Successfully generated ${count} per-route static HTML files.`);
}

run().catch(err => {
  console.error('[seo-pages] Critical error during generation:', err);
  process.exit(1);
});
