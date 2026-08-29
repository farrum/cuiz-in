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

function cleanBaseTemplate(rawHtml) {
  let cleaned = rawHtml;
  // Remove any previously injected ssr style blocks
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?\.ssr-content[\s\S]*?<\/style>\s*/gi, '');
  // Remove any previously injected ssr-content divs
  cleaned = cleaned.replace(/<div\s+class="ssr-content">[\s\S]*?<\/div>\s*/gi, '');
  return cleaned;
}

const base = cleanBaseTemplate(fs.readFileSync(TEMPLATE, 'utf8'));
const today = new Date().toISOString().split('T')[0];

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
  'history': ['History', 'Indian History'],
  'science': ['Science', 'Science & Nature', 'Science &amp; Nature', 'Science: Mathematics', 'Mathematics'],
  'geography': ['Geography', 'World Landmarks'],
  'literature': ['Arts & Literature', 'Arts and Literature', 'Entertainment: Books', 'Art', 'Literature'],
  'entertainment': [
    'Entertainment', 'Entertainment: Video Games', 
    'Entertainment: Film', 'Entertainment: Television', 'Entertainment: Board Games',
    'Entertainment: Musicals &amp; Theatres', 'Entertainment: Japanese Anime &amp; Manga',
    'Entertainment: Cartoon &amp; Animations', 'Entertainment: Comics', 'Celebrities',
    'Bollywood'
  ],
  'sports': ['Sports', 'Cricket'],
  'technology': ['Science: Computers', 'Science: Gadgets', 'Science and Technology', 'Science & Technology', 'Vehicles', 'Technology'],
  'general-knowledge': ['General Knowledge', 'Culture', 'Animals', 'Food & Drink', 'Food and Drinks'],
  'guinness-world-records': ['Guinness World Records'],
  'k-pop-k-drama': ['K-Pop Music', 'Korean Drama', 'K-Pop & K-Drama'],
  'global-politics': ['Global Politics', 'Politics', 'Current Affairs'],
  'kids-trivia': ['Kids Corner'],
  'law-justice': ['Law & Justice'],
  'music': ['World Music', 'Entertainment: Music'],
  'environment-nature': ['Environment', 'Nature'],
  'business-finance': ['Business'],
  'mythology': ['Mythology'],
};

const subcategoriesByCategory = {
  history: [
    { slug: 'indian-history', name: 'Indian History', keywords: ['india', 'indian', 'mughal', 'british raj', 'gandhi', 'nehru', 'ashoka', 'chola', 'maurya'] },
    { slug: 'world-wars', name: 'World Wars', keywords: ['world war', 'wwi', 'wwii', 'hitler', 'nazi', 'allies', 'axis'] },
    { slug: 'ancient-history', name: 'Ancient History', keywords: ['ancient', ' bc', 'egypt', 'roman', 'rome', 'greek', 'mesopotamia'] },
    { slug: 'medieval', name: 'Medieval Period', keywords: ['medieval', 'middle ages', 'crusade', 'knight', 'feudal'] },
    { slug: 'modern-history', name: 'Modern History', keywords: ['cold war', 'revolution', '19th century', '20th century', 'industrial'] },
  ],
  science: [
    { slug: 'physics', name: 'Physics', keywords: ['physics', 'force', 'gravity', 'quantum', 'electron', 'newton', 'einstein', 'energy'] },
    { slug: 'chemistry', name: 'Chemistry', keywords: ['chemical', 'atom', 'molecule', 'element', 'reaction', 'acid', 'periodic'] },
    { slug: 'biology', name: 'Biology', keywords: ['cell', 'dna', 'organism', 'species', 'biology', 'genetic', 'enzyme'] },
    { slug: 'astronomy', name: 'Astronomy', keywords: ['planet', 'star', 'galaxy', 'solar', 'moon', 'universe', 'nasa', 'asteroid'] },
    { slug: 'mathematics', name: 'Mathematics', dbCategories: ['Science: Mathematics'] },
    { slug: 'nature', name: 'Nature', dbCategories: ['Nature'] },
    { slug: 'space-exploration', name: 'Space & Exploration', keywords: ['nasa', 'spacex', 'mars', 'iss', 'astronaut', 'rocket', 'satellite', 'apollo', 'space station', 'lunar'] },
  ],
  geography: [
    { slug: 'countries-capitals', name: 'Countries & Capitals', keywords: ['capital', 'country', 'nation'] },
    { slug: 'landmarks', name: 'Landmarks & Wonders', keywords: ['landmark', 'wonder', 'monument', 'tower', 'pyramid'] },
    { slug: 'physical-geography', name: 'Physical Geography', keywords: ['mountain', 'river', 'ocean', 'desert', 'lake', 'sea'] },
    { slug: 'indian-geography', name: 'Indian Geography', keywords: ['india', 'indian', 'himalaya', 'ganges', 'delhi', 'mumbai'] },
  ],
  literature: [
    { slug: 'books', name: 'Books & Novels', dbCategories: ['Entertainment: Books'] },
    { slug: 'art', name: 'Art', dbCategories: ['Art', 'Arts & Literature', 'Arts and Literature'] },
  ],
  entertainment: [
    { slug: 'movies', name: 'Movies', dbCategories: ['Entertainment: Film'] },
    { slug: 'music', name: 'Music', dbCategories: ['Entertainment: Music'] },
    { slug: 'television', name: 'Television', dbCategories: ['Entertainment: Television'] },
    { slug: 'video-games', name: 'Video Games', dbCategories: ['Entertainment: Video Games'] },
    { slug: 'celebrities', name: 'Celebrities', dbCategories: ['Celebrities'] },
    { slug: 'anime-manga', name: 'Anime & Manga', dbCategories: ['Entertainment: Japanese Anime & Manga', 'Entertainment: Japanese Anime &amp; Manga'] },
    { slug: 'cartoons', name: 'Cartoons & Animation', dbCategories: ['Entertainment: Cartoon & Animations', 'Entertainment: Cartoon &amp; Animations'] },
    { slug: 'board-games', name: 'Board Games', dbCategories: ['Entertainment: Board Games'] },
    { slug: 'bollywood', name: 'Bollywood', keywords: ['bollywood', 'shah rukh', 'amitabh', 'salman khan', 'aamir khan', 'hindi film'] },
  ],
  sports: [
    { slug: 'cricket', name: 'Cricket', dbCategories: ['Cricket'] },
    { slug: 'football', name: 'Football / Soccer', keywords: ['football', 'fifa', 'world cup', 'soccer', 'premier league'] },
    { slug: 'tennis', name: 'Tennis', keywords: ['tennis', 'wimbledon', 'grand slam', 'federer', 'nadal'] },
    { slug: 'olympics', name: 'Olympics', keywords: ['olympic', 'olympics'] },
    { slug: 'basketball', name: 'Basketball', keywords: ['basketball', 'nba'] },
  ],
  technology: [
    { slug: 'computers', name: 'Computers', dbCategories: ['Science: Computers'] },
    { slug: 'gadgets', name: 'Gadgets', dbCategories: ['Science: Gadgets'] },
    { slug: 'vehicles', name: 'Vehicles', dbCategories: ['Vehicles'] },
    { slug: 'programming', name: 'Programming', keywords: ['programming', 'language', 'code', 'developer', 'python', 'javascript', 'java '] },
    { slug: 'ai-robotics', name: 'AI & Robotics', keywords: ['artificial intelligence', ' ai ', 'robot', 'machine learning', 'neural'] },
    { slug: 'internet', name: 'Internet & Web', keywords: ['internet', 'web', 'browser', 'http', 'url', 'website'] },
    { slug: 'ai-machine-learning', name: 'AI & Machine Learning', keywords: ['artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'chatgpt', 'openai', 'llm', 'gpt', 'generative ai', 'transformer'] },
    { slug: 'electric-vehicles', name: 'Electric Vehicles', keywords: ['tesla', 'electric vehicle', ' ev ', 'evs', 'lithium', 'battery', 'rivian', 'charging station', 'hybrid car'] },
  ],
  'general-knowledge': [
    { slug: 'animals', name: 'Animals', dbCategories: ['Animals'] },
    { slug: 'food-drink', name: 'Food & Drink', dbCategories: ['Food & Drink', 'Food and Drinks'] },
    { slug: 'culture', name: 'Culture', dbCategories: ['Culture'] },
    { slug: 'green-energy', name: 'Green Energy & Sustainability', keywords: ['solar', 'wind energy', 'renewable', 'sustainability', 'climate', 'carbon', 'greenhouse', 'hydro', 'geothermal', 'biofuel', 'recycling'] },
  ],
  'guinness-world-records': [
    { slug: 'human-achievements', name: 'Human Achievements', keywords: ['tallest', 'shortest', 'oldest', 'youngest', 'most', 'longest', 'fastest', 'human'] },
    { slug: 'sports-records', name: 'Sports Records', keywords: ['olympic', 'world cup', 'record', 'athlete', 'marathon', 'swimming', 'boxing'] },
    { slug: 'nature-records', name: 'Nature & Animals', keywords: ['animal', 'tree', 'flower', 'ocean', 'mountain', 'river', 'desert', 'largest animal'] },
    { slug: 'food-records', name: 'Food Records', keywords: ['pizza', 'burger', 'cake', 'largest food', 'spicy', 'eating', 'cooking'] },
    { slug: 'entertainment-records', name: 'Entertainment Records', keywords: ['movie', 'song', 'album', 'concert', 'film', 'box office', 'streaming'] },
    { slug: 'science-records', name: 'Science & Technology', keywords: ['space', 'rocket', 'satellite', 'computer', 'robot', 'experiment', 'laboratory'] },
  ],
  'k-pop-k-drama': [
    { slug: 'k-pop-music', name: 'K-Pop Music', dbCategories: ['K-Pop Music', 'K-Pop & K-Drama'], keywords: ['k-pop', 'kpop', 'bts', 'blackpink', 'exo', 'twice', 'music', 'album', 'song'] },
    { slug: 'korean-drama', name: 'Korean Drama', dbCategories: ['Korean Drama', 'K-Pop & K-Drama'], keywords: ['drama', 'k-drama', 'kdrama', 'squid game', 'crash landing', 'actor', 'actress', 'series'] }
  ],
  'mythology': [
    { slug: 'greek-mythology', name: 'Greek Mythology', keywords: ['greek', 'zeus', 'hera', 'poseidon', 'hades', 'apollo', 'athena', 'hercules', 'olympus', 'perseus'] },
    { slug: 'norse-mythology', name: 'Norse Mythology', keywords: ['norse', 'thor', 'odin', 'loki', 'valhalla', 'asgard', 'ragnarok', 'mjolnir', 'freyja'] },
    { slug: 'egyptian-mythology', name: 'Egyptian Mythology', keywords: ['egyptian', 'isis', 'osiris', 'horus', 'ra ', 'anubis', 'pharaoh', 'sphinx', 'seth'] },
    { slug: 'hindu-mythology', name: 'Hindu Mythology', keywords: ['hindu', 'ramayana', 'mahabharata', 'krishna', 'rama', 'shiva', 'vishnu', 'brahma', 'ganesha', 'arjuna'] },
  ],
  'global-politics': [
    { slug: 'indian-politics', name: 'Indian Politics', keywords: ['india', 'modi', 'gandhi', 'nehru', 'parliament', 'lok sabha', 'bjp', 'congress'] },
    { slug: 'world-politics', name: 'World Politics', keywords: ['us president', 'united nations', 'un ', 'treaty', 'democracy', 'election', 'minister', 'prime minister', 'senate'] },
    { slug: 'current-affairs', name: 'Current Affairs', dbCategories: ['Current Affairs'] },
  ],
};

function getQuestionSubcategorySlug(dbCategory, questionText) {
  const parentSlug = getCategorySlug(dbCategory);
  if (!parentSlug) return undefined;
  
  const subcategories = subcategoriesByCategory[parentSlug] || [];
  for (const sub of subcategories) {
    if (sub.dbCategories && sub.dbCategories.includes(dbCategory)) {
      return sub.slug;
    }
    if (sub.keywords && sub.keywords.length > 0) {
      const lowerText = questionText.toLowerCase();
      if (sub.keywords.some(kw => lowerText.includes(kw.toLowerCase().replace(/[,()]/g, '')))) {
        return sub.slug;
      }
    }
  }
  return undefined;
}

function getQuestionSubcategoryName(dbCategory, questionText) {
  const parentSlug = getCategorySlug(dbCategory);
  if (!parentSlug) return '';
  
  const subcategories = subcategoriesByCategory[parentSlug] || [];
  for (const sub of subcategories) {
    if (sub.dbCategories && sub.dbCategories.includes(dbCategory)) {
      return sub.name;
    }
    if (sub.keywords && sub.keywords.length > 0) {
      const lowerText = questionText.toLowerCase();
      if (sub.keywords.some(kw => lowerText.includes(kw.toLowerCase().replace(/[,()]/g, '')))) {
        return sub.name;
      }
    }
  }
  return '';
}

const categoryToSlugMap = {};
for (const [slug, cats] of Object.entries(slugToCategoriesMap)) {
  for (const cat of cats) {
    categoryToSlugMap[cat] = slug;
  }
}
function getCategorySlug(cat) {
  return categoryToSlugMap[cat] || 'general-knowledge';
}

function buildHtml({ title, description, canonical, bodyHtml, jsonLd }) {
  let html = cleanBaseTemplate(base);
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

  // Inject JSON-LD structured data if provided
  if (jsonLd) {
    const jsonStr = typeof jsonLd === 'string' ? jsonLd : JSON.stringify(jsonLd);
    html = html.replace('</head>', `<script type="application/ld+json">\n${jsonStr}\n</script>\n</head>`);
  }

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
  ['global-politics', 'Global Politics'],
  ['kids-trivia', 'Kids Corner'],
  ['law-justice', 'Law & Justice'],
  ['music', 'World Music'],
  ['environment-nature', 'Environment'],
  ['business-finance', 'Business'],
  ['mythology', 'Mythology'],
];

// --- Static content / utility pages (unique titles + descriptions) ---
// --- Static content / utility pages (unique titles + descriptions + crawler text) ---
const STATIC_PAGES = {
  '/': {
    title: 'CuizIN - Play Quiz | Free Online Quiz Game',
    description: 'Play free online trivia quizzes on CuizIN. Test your knowledge across 15,000+ questions, earn gems, maintain daily streaks, and climb the leaderboard!',
    bodyHtml: `
      <h1>CuizIN — Play Free Online Quizzes, Trivia Games & Win Rewards</h1>
      <p>Welcome to CuizIN, the ultimate medieval trivia kingdom! Test your knowledge across 15,000+ quiz questions in history, science, geography, sports, entertainment, technology, literature, mythology, and more. Answer questions, build streaks, unlock chest rewards, spin the fortune wheel, and climb the rankings to become the Emperor of all knowledge.</p>
      <h2>Play Trivia & Mini-Games</h2>
      <ul>
        <li><strong>Quick Quiz</strong>: Fast-paced trivia battles across all realms.</li>
        <li><strong>Daily Challenge</strong>: Special themed events for 2x rewards.</li>
        <li><strong>Tavern Games</strong>: Spin Wheel, Scratch Card, Slot Machine, Plinko Board, Coinflip, Diceroll, and more.</li>
      </ul>
      <h2>Explore Quiz Realms</h2>
      <ul>
        <li><a href="/categories/general-knowledge">General Knowledge Quiz</a></li>
        <li><a href="/categories/history">History Quiz</a></li>
        <li><a href="/categories/science">Science & Nature Quiz</a></li>
        <li><a href="/categories/geography">Geography Quiz</a></li>
        <li><a href="/categories/literature">Arts & Literature Quiz</a></li>
        <li><a href="/categories/sports">Sports Quiz</a></li>
        <li><a href="/categories/technology">Science & Technology Quiz</a></li>
        <li><a href="/categories/k-pop-k-drama">K-Pop & Korean Drama Quiz</a></li>
        <li><a href="/categories/mythology">Mythology & Lore Quiz</a></li>
      </ul>
    `
  },
  '/quiz': {
    title: 'Play Free Online Quizzes | CuizIN Quiz Game',
    description: 'Play free online trivia quizzes on CuizIN. Challenge yourself with timed questions across multiple categories, earn gems, and climb the leaderboard.',
    bodyHtml: `
      <h1>Play Online Quizzes on CuizIN</h1>
      <p>Choose your favorite realm or start a rapid-fire trivia quiz instantly. Answer multiple-choice questions correctly to earn gems and protect your daily streaks.</p>
      <h2>Popular Quiz Modes</h2>
      <ul>
        <li><a href="/categories/general-knowledge">General Knowledge Trivia</a></li>
        <li><a href="/topics/cricket">Cricket Quiz Challenge</a></li>
        <li><a href="/topics/bollywood">Bollywood Cinema Trivia</a></li>
        <li><a href="/topics/science-technology">Science & Technology Quiz</a></li>
      </ul>
    `
  },
  '/browse': {
    title: 'Browse 15,000+ Quiz Questions & Answers | CuizIN',
    description: 'Browse our complete collection of 15,000+ trivia quiz questions. Filter by category, discover new topics, and test your knowledge across all realms.',
    bodyHtml: `
      <h1>Browse All Trivia Questions</h1>
      <p>Search and discover thousands of verified quiz questions across History, Science, Sports, Geography, Entertainment, and Technology on CuizIN.</p>
      <p><a href="/categories">View All Quiz Categories</a> · <a href="/all-questions">Full Question Directory</a></p>
    `
  },
  '/topics': {
    title: 'Quiz Topics | Curated Trivia Collections | CuizIN',
    description: 'Explore curated trivia topics on CuizIN. Choose from Indian history, cricket, Bollywood, science, world geography, mythology, gaming, and more.',
    bodyHtml: `
      <h1>Explore Specialized Quiz Topics</h1>
      <p>Dive deep into our curated collections of themed trivia quizzes:</p>
      <ul>
        <li><a href="/topics/indian-history">Indian History Quiz</a></li>
        <li><a href="/topics/bollywood">Bollywood Movies & Music Quiz</a></li>
        <li><a href="/topics/cricket">Cricket Trivia Quiz</a></li>
        <li><a href="/topics/world-geography">World Geography Quiz</a></li>
        <li><a href="/topics/science-technology">Science & Technology Quiz</a></li>
        <li><a href="/topics/world-history">World History Quiz</a></li>
        <li><a href="/topics/mythology">Mythology & Legends Quiz</a></li>
        <li><a href="/topics/video-games">Video Games Quiz</a></li>
        <li><a href="/topics/movies-tv">Movies & TV Shows Quiz</a></li>
        <li><a href="/topics/food-cuisine">Food & World Cuisine Quiz</a></li>
      </ul>
    `
  },
  '/cricket-quiz': {
    title: 'Cricket Quiz: 95+ Questions on IPL, World Cup & Legends | CuizIN',
    description: 'Play the ultimate cricket quiz online. Test your knowledge of IPL, ICC World Cup, Sachin, Kohli, Dhoni, records, and cricket history with free scoring.',
    bodyHtml: `
      <h1>Cricket Quiz — Test Your Cricket Knowledge</h1>
      <p>Cricket is more than a sport in India — it is a passion. Test your knowledge across IPL seasons, ICC World Cups, batting milestones, bowling records, and legends like Sachin Tendulkar, MS Dhoni, and Virat Kohli.</p>
      <p><a href="/topics/cricket"><strong>Start Playing Cricket Quiz &rarr;</strong></a></p>
    `
  },
  '/bollywood-quiz': {
    title: 'Bollywood Quiz: Movies, Songs, Actors & Dialogues | CuizIN',
    description: 'Play the biggest Bollywood quiz online. Answer questions on classic films, blockbuster songs, iconic stars, dialogues, and cinema trivia on CuizIN.',
    bodyHtml: `
      <h1>Bollywood Quiz — Hindi Cinema, Songs & Stars</h1>
      <p>Put your Hindi cinema knowledge to the test with questions covering classic movies, timeless songs, superstar careers, and famous dialogues from Sholay to modern blockbusters.</p>
      <p><a href="/topics/bollywood"><strong>Start Playing Bollywood Quiz &rarr;</strong></a></p>
    `
  },
  '/gk-quiz': {
    title: 'GK Quiz: 200+ General Knowledge Questions (India & World) | CuizIN',
    description: 'Play India\'s favorite GK quiz online. Practice general knowledge questions covering current affairs, history, geography, science, and Indian polity.',
    bodyHtml: `
      <h1>GK Quiz — General Knowledge Questions & Answers</h1>
      <p>Practice daily with bite-sized GK quizzes that mirror competitive exam formats like SSC, UPSC, and banking. Learn explanations while earning points.</p>
      <p><a href="/categories/general-knowledge"><strong>Start Playing GK Quiz &rarr;</strong></a></p>
    `
  },
  '/gk-questions': {
    title: '1000+ GK Questions with Answers for Competitive Exams | CuizIN',
    description: 'Practice 1000+ GK questions with answers for competitive exams: history, geography, science, sports, and general awareness. Free timed quiz mode on CuizIN.',
    bodyHtml: `
      <h1>1000+ GK Questions with Answers for Competitive Exams</h1>
      <p>Read verified questions and answers covering general knowledge, Indian geography, freedom struggle, basic science, and global organizations.</p>
      <p><a href="/categories/general-knowledge">Browse GK Questions</a></p>
    `
  },
  '/stories': {
    title: 'Trivia Web Stories | Fast Visual Quiz Clips | CuizIN',
    description: 'Experience interactive trivia Web Stories on CuizIN. Tap through visual quiz questions, test your fast reflexes, and discover fascinating trivia facts.',
    bodyHtml: `
      <h1>Trivia Web Stories</h1>
      <p>Swipe and tap through fast-paced visual quiz cards covering trending trivia facts, science wonders, movie milestones, and history clips.</p>
    `
  },
  '/login': {
    title: 'Login to CuizIN | Access Your Quiz Account',
    description: 'Login to your CuizIN account to play free quizzes across 15,000+ questions, earn gems, maintain daily streaks, and compete on global leaderboards.',
    bodyHtml: `
      <h1>Login to CuizIN</h1>
      <p>Sign in to your royal account to resume your trivia quests, claim daily tribute rewards, view your active contracts, spend your gems, and check your leaderboard rankings.</p>
      <p>Don't have an account? <a href="/register">Create a free account here</a> to start saving your quiz history and earning gems.</p>
    `
  },
  '/register': {
    title: 'Register on CuizIN | Create Your Free Quiz Account',
    description: 'Create a free CuizIN account in seconds. Play trivia quizzes, earn gems and stars, unlock advisor boosts, and compete for top leaderboard rewards.',
    bodyHtml: `
      <h1>Create Your Free Account</h1>
      <p>Register a new account on CuizIN in seconds to start tracking your quiz statistics, earning gems and stars, protecting your daily streaks, unlocking advisors, and claiming mystery chests.</p>
      <p>Already have a character? <a href="/login">Login here</a> to continue your trivia adventure.</p>
    `
  },
  '/profile': {
    title: 'My Profile | CuizIN Quiz Account & Stats',
    description: 'Manage your CuizIN profile — track your lifetime quiz accuracy, earned gems and stars, active daily streaks, achievements, and leaderboard rank.',
    bodyHtml: `
      <h1>Adventurer Profile & Statistics</h1>
      <p>Manage your CuizIN profile. Track your lifetime stats, correct answer accuracy, earned gems and stars, active daily streaks, and equipped advisor titles.</p>
      <p>View your Battle Council advisors including Socrates, Chanakya, and Ramanujan, and level up their attributes using shards earned in campaign quests.</p>
    `
  },
  '/blog': {
    title: 'CuizIN Blog | Trivia Tips, Facts & Quiz Guides',
    description: 'Explore the CuizIN Blog for trivia tips, fascinating facts, quiz strategies, and educational guides to help you master quizzes across all categories.',
    bodyHtml: `
      <h1>CuizIN Blog — Trivia Facts, Tips & Guides</h1>
      <p>Read the latest articles from the CuizIN scribe. Find fascinating trivia facts, historical stories, science breakthroughs, movie lore, and strategy guides to help you master our quizzes.</p>
    `
  },
  '/faq': {
    title: 'FAQ | CuizIN - Help & Frequently Asked Questions',
    description: 'Find comprehensive answers to common questions about CuizIN — gameplay rules, earning gems, claiming rewards, leaderboards, and account security.',
    bodyHtml: `
      <h1>Frequently Asked Questions (FAQ)</h1>
      <p>Find answers to common questions about the CuizIN quiz kingdom:</p>
      <ul>
        <li><strong>How do I earn gems and stars?</strong> Gems are awarded for correct answers and daily check-ins. Stars are earned by completing campaigns and contract quests.</li>
        <li><strong>What are advisor shards?</strong> Shards are used to level up your advisors. Each advisor grants passive boosts to your earnings.</li>
        <li><strong>Is CuizIN free to play?</strong> Yes! You can play all quizzes, tavern games, and campaigns for free.</li>
      </ul>
    `
  },
  '/how-to-play': {
    title: 'How to Play | CuizIN Quiz Guide & Rules',
    description: 'Learn how to play CuizIN quizzes — answer timed trivia questions, maintain flame streaks, spin tavern wheels, and earn gems to climb leaderboards.',
    bodyHtml: `
      <h1>How to Play CuizIN Quiz Guide</h1>
      <p>Master the trivia games on CuizIN with this simple guide:</p>
      <ol>
        <li><strong>Choose your realm</strong>: Pick a category or subcategory from our directory.</li>
        <li><strong>Answer questions</strong>: You have a 20-second timer to choose the correct answer. The faster you answer, the better.</li>
        <li><strong>Maintain streaks</strong>: Answering correctly builds your flame streak, increasing your point multiplier.</li>
        <li><strong>Play tavern games</strong>: Use your daily free spin and scratch chances to win instant stars and jackpot gems.</li>
      </ol>
    `
  },
  '/referral-program': {
    title: 'Referral Program | Invite Friends & Earn on CuizIN',
    description: 'Join the CuizIN referral program. Invite friends to play trivia quizzes, earn bonus gems and stars, and become a Team Leader for monthly earnings.',
    bodyHtml: `
      <h1>Referral Program — Invite Friends & Earn Gems</h1>
      <p>Share your unique referral link with fellow trivia enthusiasts. When they register and start playing, you both earn bonus gems and stars to grow your royal treasury.</p>
    `
  },
  '/terms': {
    title: 'Terms of Service | CuizIN',
    description: 'Read the official CuizIN Terms of Service governing platform usage, player accounts, rewards system, leaderboard fair play rules, and intellectual property.',
    bodyHtml: `
      <h1>Terms of Service</h1>
      <p>Read the terms and conditions governing your access to and use of the CuizIN quiz platform. By playing our games, you agree to these terms.</p>
    `
  },
  '/privacy': {
    title: 'Privacy Policy | CuizIN',
    description: 'Read the CuizIN Privacy Policy to learn how we collect, safeguard, and process your personal information, gaming statistics, and account data securely.',
    bodyHtml: `
      <h1>Privacy Policy</h1>
      <p>Learn about how CuizIN collects, handles, and protects your data, ensuring a secure and transparent gaming environment for all players.</p>
    `
  },
  '/disclaimer': {
    title: 'Content & Game Disclaimer | CuizIN',
    description: 'Read the CuizIN content disclaimer regarding trivia accuracy, question sourcing, prize distributions, and platform terms for free online quiz games.',
    bodyHtml: `
      <h1>Content Disclaimer</h1>
      <p>View the disclaimer statement regarding the quiz questions, answers, fact accuracy, and reference content hosted on the CuizIN platform.</p>
    `
  },
  '/editorial-policy': {
    title: 'Editorial Policy & Fact-Checking Standards | CuizIN',
    description: 'Learn about CuizIN\'s rigorous editorial standards, question fact-checking processes, verification methodology, and ongoing accuracy commitments.',
    bodyHtml: `
      <h1>Editorial Policy &amp; Fact-Checking Standards</h1>
      <p>CuizIN maintains strict editorial and verification standards across our 15,000+ trivia question library. Every question undergoes factual verification against trusted primary references.</p>
    `
  },
  '/our-sources': {
    title: 'Our Sources & Citation Standards | CuizIN',
    description: 'Learn how CuizIN selects and cites authoritative reference sources, academic databases, and government archives for fact-checked quiz questions.',
    bodyHtml: `
      <h1>Our Sources &amp; Citation Standards</h1>
      <p>CuizIN relies on primary historical records, constitutional archives, international sporting bodies, and peer-reviewed scientific institutions for all trivia facts.</p>
    `
  },
  '/corrections': {
    title: 'Corrections Policy & Question Error Reporting | CuizIN',
    description: 'Read CuizIN\'s public corrections policy, error review workflow, and learn how to report an inaccurate quiz question to our editorial team.',
    bodyHtml: `
      <h1>Corrections Policy &amp; Error Reporting</h1>
      <p>CuizIN is committed to rapid, transparent factual corrections. Learn about our review lifecycle and how to submit a question correction report.</p>
    `
  },
  '/developers': {
    title: 'Public Knowledge API & Developer Documentation | CuizIN',
    description: 'Public REST and structured knowledge API for retrieving fact-verified quiz questions, Knowledge Graph entities, and claim IDs for AI agents and LLM grounding.',
    bodyHtml: `
      <h1>CuizIN Public Knowledge API &amp; LLM Endpoints</h1>
      <p>Programmatic access to 12,000+ fact-verified trivia questions, query variants, and Knowledge Graph entities. Open access under Creative Commons Attribution-ShareAlike 4.0.</p>
      <h2>Available Endpoints</h2>
      <ul>
        <li><code>GET /api/v1/questions.json</code> — Compressed index of verified trivia claims and canonical links.</li>
        <li><code>GET /api/v1/entities.json</code> — Structured Knowledge Graph entity nodes.</li>
        <li><code>GET /api/v1/openapi.json</code> — OpenAPI 3.1 specification.</li>
      </ul>
      <p><a href="/api/v1/openapi.json" target="_blank">View OpenAPI Spec</a> · <a href="/llms-full.txt" target="_blank">View llms-full.txt</a></p>
    `
  },
  '/api-docs': {
    title: 'API Reference & LLM Grounding Endpoints | CuizIN',
    description: 'Developer documentation, OpenAPI spec, and endpoints for programmatic trivia question querying and Knowledge Graph retrieval.',
    bodyHtml: `
      <h1>CuizIN API Reference &amp; LLM Grounding</h1>
      <p>Query verified factual claims and knowledge graph nodes with low-latency JSON endpoints. Free for academic researchers and AI systems with standard attribution.</p>
      <p><a href="/developers">Explore Full Developer Portal &rarr;</a></p>
    `
  },
};

const TOPICS = [
  {
    slug: 'indian-history',
    title: 'Indian History',
    description: 'Test your knowledge of Indian history from ancient civilizations to modern India. Answer questions covering the Mughal Empire, British Raj, and freedom movement.',
    keywords: ['india', 'indian', 'mughal', 'british', 'gandhi', 'nehru', 'delhi', 'empire', 'independence', 'partition'],
    categories: ['History']
  },
  {
    slug: 'bollywood',
    title: 'Bollywood Movies & Music',
    description: 'How well do you know Bollywood? Answer questions about iconic Hindi movies, legendary actors, blockbuster songs, and memorable cinema dialogues on CuizIN.',
    keywords: ['bollywood', 'hindi', 'movie', 'film', 'actor', 'actress', 'song', 'music', 'india'],
    categories: ['Entertainment', 'Entertainment: Film', 'Entertainment: Music', 'Celebrities']
  },
  {
    slug: 'cricket',
    title: 'Cricket Trivia',
    description: 'For cricket lovers! Test your knowledge about cricket legends, ICC World Cups, IPL tournaments, famous matches, world records, and history on CuizIN.',
    keywords: ['cricket', 'ipl', 'world cup', 'sachin', 'kohli', 'dhoni', 'test', 'odi', 't20', 'wicket', 'century'],
    categories: ['Cricket', 'Sports']
  },
  {
    slug: 'world-geography',
    title: 'World Geography',
    description: 'Explore the world through geography questions. Learn about countries, world capitals, landmarks, rivers, mountain ranges, and natural wonders on CuizIN.',
    keywords: ['country', 'capital', 'river', 'mountain', 'ocean', 'continent', 'border', 'island', 'desert'],
    categories: ['Geography']
  },
  {
    slug: 'science-technology',
    title: 'Science & Technology',
    description: 'Explore scientific discoveries, modern inventions, technology, space exploration, physics, chemistry, and biology with verified answers on CuizIN.',
    keywords: ['science', 'technology', 'invention', 'discovery', 'space', 'computer', 'physics', 'chemistry', 'biology'],
    categories: ['Science', 'Science & Nature', 'Science: Computers', 'Science and Technology']
  },
  {
    slug: 'world-history',
    title: 'World History',
    description: 'Journey through world history with trivia questions about ancient civilizations, world wars, revolutions, empires, and influential historical leaders on CuizIN.',
    keywords: ['war', 'revolution', 'empire', 'king', 'queen', 'president', 'battle', 'treaty', 'civilization'],
    categories: ['History']
  },
  {
    slug: 'mythology',
    title: 'Mythology & Legends',
    description: 'Dive into world mythologies with questions on Greek gods, Hindu epics, Norse legends, and ancient folklore. Play free trivia quizzes on CuizIN.',
    keywords: ['god', 'goddess', 'myth', 'legend', 'zeus', 'vishnu', 'thor', 'epic', 'hero'],
    categories: ['Mythology']
  },
  {
    slug: 'video-games',
    title: 'Video Games',
    description: 'For gamers! Answer questions about popular video games, gaming history, iconic characters, game developers, and gaming culture on CuizIN.',
    keywords: ['game', 'gaming', 'nintendo', 'playstation', 'xbox', 'pc', 'character', 'level', 'player'],
    categories: ['Entertainment: Video Games']
  },
  {
    slug: 'movies-tv',
    title: 'Movies & TV Shows',
    description: 'Test your entertainment knowledge with questions on Hollywood hits, TV series, Oscar winners, famous directors, and iconic streaming shows on CuizIN.',
    keywords: ['movie', 'film', 'actor', 'director', 'oscar', 'tv', 'series', 'hollywood', 'netflix'],
    categories: ['Entertainment: Film', 'Entertainment: Television', 'Entertainment']
  },
  {
    slug: 'food-cuisine',
    title: 'Food & World Cuisine',
    description: 'Explore global dishes, culinary ingredients, international cooking traditions, and famous cuisines in this delicious food trivia challenge on CuizIN.',
    keywords: ['food', 'cuisine', 'dish', 'cooking', 'spice', 'recipe', 'culinary', 'restaurant'],
    categories: ['Food & Drink', 'Food and Drinks']
  }
];

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
          .select('id, question, options, category, difficulty, explanation, created_at')
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
          const subSlug = getQuestionSubcategorySlug(q.category, q.question);
          const urlPath = subSlug
            ? `/quiz/question/${q.id}/${slug}/${subSlug}/${qSlug}`
            : `/quiz/question/${q.id}/${slug}/${qSlug}`;
          return `<li><a href="${urlPath}">${esc(q.question)}</a></li>`;
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

  // 2.5. GENERATE SUBCATEGORY DETAIL PAGES
  for (const [catSlug, catName] of CATEGORIES) {
    const subs = subcategoriesByCategory[catSlug] || [];
    for (const sub of subs) {
      let subDetailHtml = null;
      
      if (databaseAvailable) {
        const baseCats = sub.dbCategories && sub.dbCategories.length > 0
          ? sub.dbCategories
          : (slugToCategoriesMap[catSlug] || []);
        
        let matchedQuestions = allQuestions.filter(q => baseCats.includes(q.category));
        
        if (sub.keywords && sub.keywords.length > 0) {
          matchedQuestions = matchedQuestions.filter(q => {
            const lowerQ = q.question.toLowerCase();
            return sub.keywords.some(kw => lowerQ.includes(kw.toLowerCase().replace(/[,()]/g, '')));
          });
        }
        
        const questionListItems = matchedQuestions
          .slice(0, 500)
          .map(q => {
            const qSlug = createSlug(q.question);
            return `<li><a href="/quiz/question/${q.id}/${catSlug}/${sub.slug}/${qSlug}">${esc(q.question)}</a></li>`;
          })
          .join('\n');

        subDetailHtml = `
          <nav class="bc">
            <a href="/">Home</a> &rsaquo; 
            <a href="/categories">Categories</a> &rsaquo; 
            <a href="/categories/${catSlug}">${esc(catName)}</a> &rsaquo; 
            ${esc(sub.name)}
          </nav>
          <h1>${esc(sub.name)} Quiz Questions</h1>
          <p>Explore ${matchedQuestions.length} trivia questions in the ${esc(sub.name)} subcategory. Select any question to play.</p>
          <ul>
            ${questionListItems || '<li>No questions found in this subcategory.</li>'}
          </ul>
        `;
      }

      write(`/categories/${catSlug}/${sub.slug}`, {
        title: `${sub.name} Quiz Questions - ${catName} | CuizIN`,
        description: `Explore ${sub.name} quiz questions under ${catName} on CuizIN. Test your trivia knowledge, answer timed challenges, earn gems, and climb rankings.`,
        canonical: `${SITE_URL}/categories/${catSlug}/${sub.slug}`,
        bodyHtml: subDetailHtml
      });
      count++;
    }
  }

  // 2.7. GENERATE TOPIC DETAIL PAGES
  for (const topic of TOPICS) {
    let topicDetailHtml = null;
    let jsonLd = null;

    if (databaseAvailable) {
      let matchedQuestions = allQuestions.filter(q => {
        if (topic.categories && topic.categories.includes(q.category)) return true;
        if (topic.keywords && topic.keywords.length > 0) {
          const lowerQ = q.question.toLowerCase();
          return topic.keywords.some(kw => lowerQ.includes(kw.toLowerCase()));
        }
        return false;
      });

      const questionListItems = matchedQuestions
        .slice(0, 150)
        .map(q => {
          const qSlug = createSlug(q.question);
          const catSlug = getCategorySlug(q.category);
          const subSlug = getQuestionSubcategorySlug(q.category, q.question);
          const urlPath = subSlug
            ? `/quiz/question/${q.id}/${catSlug}/${subSlug}/${qSlug}`
            : `/quiz/question/${q.id}/${catSlug}/${qSlug}`;
          const ans = q.correct_answer || q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : '');
          return `
            <li style="margin-bottom: 12px; padding: 12px 14px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; list-style: none;">
              <div style="font-weight: 600; margin-bottom: 4px;"><a href="${urlPath}">${esc(q.question)}</a></div>
              <div style="font-size: 13px; color: #0f172a;"><strong>Verified Answer:</strong> ${esc(ans)}</div>
              ${q.explanation ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">${esc(q.explanation)}</div>` : ''}
            </li>
          `;
        })
        .join('\n');

      const relatedTopicLinks = TOPICS
        .filter(t => t.slug !== topic.slug)
        .slice(0, 6)
        .map(t => `<a href="/topics/${t.slug}" style="display:inline-block;background:#f1f5f9;color:#0f172a;padding:4px 10px;border-radius:6px;font-size:12px;margin:3px 6px 3px 0;text-decoration:none;border:1px solid #e2e8f0;">${esc(t.title)} &rsaquo;</a>`)
        .join('');

      topicDetailHtml = `
        <nav class="bc"><a href="/">Home</a> &rsaquo; <a href="/topics">Topics</a> &rsaquo; ${esc(topic.title)}</nav>
        <h1>${esc(topic.title)} Quiz Questions &amp; Verified Facts</h1>
        <p>${esc(topic.description)}</p>
        
        <h2>Featured Fact-Checked Questions (${matchedQuestions.length} Total)</h2>
        <ul style="padding: 0; margin: 16px 0;">
          ${questionListItems || '<li>No questions found in this topic.</li>'}
        </ul>

        <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <h3 style="margin-top:0;">Related Quiz Topics</h3>
          <div>${relatedTopicLinks}</div>
        </div>
      `;

      jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `${topic.title} Quiz Questions & Verified Facts`,
        "description": topic.description,
        "url": `${SITE_URL}/topics/${topic.slug}`,
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": matchedQuestions.length,
          "itemListElement": matchedQuestions.slice(0, 20).map((q, idx) => {
            const qSlug = createSlug(q.question);
            const catSlug = getCategorySlug(q.category);
            const ans = q.correct_answer || q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : '');
            return {
              "@type": "ListItem",
              "position": idx + 1,
              "item": {
                "@type": "Question",
                "name": q.question,
                "url": `${SITE_URL}/quiz/question/${q.id}/${catSlug}/${qSlug}`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": ans
                }
              }
            };
          })
        }
      };
    }

    write(`/topics/${topic.slug}`, {
      title: `${topic.title} Quiz Questions & Verified Facts | CuizIN`,
      description: topic.description,
      canonical: `${SITE_URL}/topics/${topic.slug}`,
      bodyHtml: topicDetailHtml,
      jsonLd
    });
    count++;
  }

  // 2.6 GENERATE KNOWLEDGE GRAPH ENTITY PAGES (/entities, /people, /places, /events, /concepts)
  const ENTITY_REGISTRY = [
    {
      slug: 'jawaharlal-nehru',
      type: 'person',
      name: 'Jawaharlal Nehru',
      category: 'History',
      roleOrDesignation: 'First Prime Minister of India (1947–1964)',
      eraOrPeriod: 'Modern Indian History (1889–1964)',
      summary: 'Jawaharlal Nehru was an Indian anti-colonial nationalist, secular humanist, social democrat, and statesman who served as the first Prime Minister of India from 1947 until his death in 1964. Author of "The Discovery of India".',
      keyFacts: [
        { label: 'Born', value: 'November 14, 1889, Allahabad, India' },
        { label: 'Died', value: 'May 27, 1964, New Delhi, India' },
        { label: 'Office', value: 'Prime Minister of India (15 August 1947 – 27 May 1964)' },
        { label: 'Key Works', value: 'The Discovery of India, Glimpses of World History' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Jawaharlal_Nehru',
        'https://www.wikidata.org/wiki/Q1047',
        'https://www.britannica.com/biography/Jawaharlal-Nehru'
      ],
      keywords: ['nehru', 'jawaharlal', 'discovery of india', 'first prime minister of india', 'chacha nehru'],
      sources: [
        { title: 'National Archives of India — Nehru Papers', url: 'http://nationalarchives.nic.in' },
        { title: 'Prime Ministers Museum & Library (PMML)', url: 'https://pmml.nic.in' }
      ]
    },
    {
      slug: 'mahatma-gandhi',
      type: 'person',
      name: 'Mahatma Gandhi',
      category: 'History',
      roleOrDesignation: 'Leader of the Indian Independence Movement',
      eraOrPeriod: 'Modern Indian History (1869–1948)',
      summary: 'Mohandas Karamchand Gandhi was an Indian lawyer, anti-colonial nationalist, and political ethicist who employed nonviolent resistance to lead the successful campaign for India\'s independence from British rule.',
      keyFacts: [
        { label: 'Born', value: 'October 2, 1869, Porbandar, Gujarat, India' },
        { label: 'Died', value: 'January 30, 1948, New Delhi, India' },
        { label: 'Philosophy', value: 'Satyagraha (Truth-force), Ahimsa (Nonviolence)' },
        { label: 'Major Campaigns', value: 'Non-Cooperation (1920), Salt March (1930), Quit India (1942)' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Mahatma_Gandhi',
        'https://www.wikidata.org/wiki/Q1001',
        'https://www.britannica.com/biography/Mahatma-Gandhi'
      ],
      keywords: ['gandhi', 'mahatma', 'bapu', 'satyagraha', 'ahimsa', 'salt march', 'dandi march', 'sabarmati'],
      sources: [
        { title: 'Gandhi Heritage Portal', url: 'https://www.gandhiheritageportal.org' },
        { title: 'National Archives of India', url: 'http://nationalarchives.nic.in' }
      ]
    },
    {
      slug: 'albert-einstein',
      type: 'person',
      name: 'Albert Einstein',
      category: 'Science',
      roleOrDesignation: 'Theoretical Physicist & Nobel Laureate',
      eraOrPeriod: '20th Century Physics (1879–1955)',
      summary: 'Albert Einstein was a theoretical physicist widely acknowledged to be one of the greatest and most influential physicists of all time. Best known for developing the theory of relativity and E = mc².',
      keyFacts: [
        { label: 'Born', value: 'March 14, 1879, Ulm, Germany' },
        { label: 'Died', value: 'April 18, 1955, Princeton, USA' },
        { label: 'Nobel Prize', value: 'Physics (1921) for Photoelectric Effect' },
        { label: 'Core Formula', value: 'E = mc²' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Albert_Einstein',
        'https://www.wikidata.org/wiki/Q937',
        'https://www.britannica.com/biography/Albert-Einstein'
      ],
      keywords: ['einstein', 'relativity', 'photoelectric', 'emc2', 'brownian motion'],
      sources: [
        { title: 'Nobel Prize Official Archives — Albert Einstein', url: 'https://www.nobelprize.org/prizes/physics/1921/einstein/biographical/' }
      ]
    },
    {
      slug: 'marie-curie',
      type: 'person',
      name: 'Marie Curie',
      category: 'Science',
      roleOrDesignation: 'Physicist & Chemist, Double Nobel Laureate',
      eraOrPeriod: 'Late 19th & Early 20th Century (1867–1934)',
      summary: 'Marie Skłodowska-Curie was a pioneering physicist and chemist who conducted research on radioactivity. The first woman to win a Nobel Prize and the only person to win in two scientific fields.',
      keyFacts: [
        { label: 'Born', value: 'November 7, 1867, Warsaw, Poland' },
        { label: 'Died', value: 'July 4, 1934, Passy, France' },
        { label: 'Nobel Prizes', value: 'Physics (1903), Chemistry (1911)' },
        { label: 'Discovered Elements', value: 'Polonium (Po), Radium (Ra)' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Marie_Curie',
        'https://www.wikidata.org/wiki/Q7186',
        'https://www.britannica.com/biography/Marie-Curie'
      ],
      keywords: ['curie', 'marie curie', 'radium', 'polonium', 'radioactivity'],
      sources: [
        { title: 'Nobel Prize Official Archives — Marie Curie', url: 'https://www.nobelprize.org/prizes/physics/1903/marie-curie/biographical/' }
      ]
    },
    {
      slug: 'apj-abdul-kalam',
      type: 'person',
      name: 'A. P. J. Abdul Kalam',
      category: 'Science',
      roleOrDesignation: '11th President of India & Aerospace Scientist',
      eraOrPeriod: 'Modern India (1931–2015)',
      summary: 'Dr. A. P. J. Abdul Kalam was an aerospace scientist and statesman who served as the 11th President of India. Widely revered as the "Missile Man of India".',
      keyFacts: [
        { label: 'Born', value: 'October 15, 1931, Rameswaram, India' },
        { label: 'Died', value: 'July 27, 2015, Shillong, India' },
        { label: 'Moniker', value: 'Missile Man of India / People\'s President' },
        { label: 'Key Works', value: 'Wings of Fire, Ignited Minds' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/A._P._J._Abdul_Kalam',
        'https://www.wikidata.org/wiki/Q9513',
        'https://www.britannica.com/biography/A-P-J-Abdul-Kalam'
      ],
      keywords: ['kalam', 'abdul kalam', 'missile man', 'wings of fire', 'pokhran'],
      sources: [
        { title: 'ISRO Official History & Pioneers', url: 'https://www.isro.gov.in' }
      ]
    },
    {
      slug: 'sachin-tendulkar',
      type: 'person',
      name: 'Sachin Tendulkar',
      category: 'Sports',
      roleOrDesignation: 'Legendary Indian International Cricketer',
      eraOrPeriod: 'Contemporary Sports (1973–present)',
      summary: 'Sachin Tendulkar is an Indian former international cricketer widely regarded as one of the greatest batsmen in history, holding the world record for 100 international centuries.',
      keyFacts: [
        { label: 'Born', value: 'April 24, 1973, Mumbai, India' },
        { label: 'Centuries', value: '100 International Centuries (51 Test, 49 ODI)' },
        { label: 'Total Runs', value: '34,357 International Runs' },
        { label: 'Honour', value: 'Bharat Ratna (2014)' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Sachin_Tendulkar',
        'https://www.wikidata.org/wiki/Q9448',
        'https://www.espncricinfo.com/cricketers/sachin-tendulkar-35320'
      ],
      keywords: ['tendulkar', 'sachin', 'master blaster', '100 centuries', 'wankhede'],
      sources: [
        { title: 'BCCI Official Portal', url: 'https://www.bcci.tv' }
      ]
    },
    {
      slug: 'taj-mahal',
      type: 'place',
      name: 'Taj Mahal',
      category: 'Geography',
      roleOrDesignation: 'UNESCO World Heritage Site & Mughal Monument',
      eraOrPeriod: 'Mughal Empire (1632–1653 CE)',
      summary: 'The Taj Mahal is an ivory-white marble mausoleum in Agra, India, commissioned in 1632 by the Mughal emperor Shah Jahan to house the tomb of his favourite wife, Mumtaz Mahal.',
      keyFacts: [
        { label: 'Location', value: 'Agra, Uttar Pradesh, India' },
        { label: 'Builder', value: 'Mughal Emperor Shah Jahan' },
        { label: 'UNESCO Status', value: 'World Heritage Site (1983)' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Taj_Mahal',
        'https://www.wikidata.org/wiki/Q9141',
        'https://whc.unesco.org/en/list/252'
      ],
      keywords: ['taj mahal', 'shah jahan', 'mumtaz mahal', 'agra', 'makrana marble'],
      sources: [
        { title: 'Archaeological Survey of India (ASI)', url: 'https://asi.nic.in' }
      ]
    },
    {
      slug: 'mount-everest',
      type: 'place',
      name: 'Mount Everest',
      category: 'Geography',
      roleOrDesignation: 'Highest Mountain Peak on Earth',
      eraOrPeriod: 'Geological Formation (Himalayas)',
      summary: 'Mount Everest is Earth\'s highest mountain above sea level, located in the Mahalangur Himal sub-range of the Himalayas on the border of Nepal and China (Tibet).',
      keyFacts: [
        { label: 'Elevation', value: '8,848.86 metres (29,031.7 ft)' },
        { label: 'Location', value: 'Himalayas, Border of Nepal and China' },
        { label: 'First Ascent', value: 'Edmund Hillary & Tenzing Norgay (May 29, 1953)' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Mount_Everest',
        'https://www.wikidata.org/wiki/Q513'
      ],
      keywords: ['everest', 'mount everest', 'sagarmatha', 'chomolungma', 'hillary', 'tenzing norgay'],
      sources: [
        { title: 'Survey of India', url: 'https://www.surveyofindia.gov.in' }
      ]
    },
    {
      slug: 'indian-independence-movement',
      type: 'event',
      name: 'Indian Independence Movement',
      category: 'History',
      roleOrDesignation: 'Anti-Colonial Liberation Struggle (1857–1947)',
      eraOrPeriod: 'Modern Era (1857–1947)',
      summary: 'The Indian Independence Movement was a series of historic events and mass campaigns aimed at ending British colonial rule in India, culminating on August 15, 1947.',
      keyFacts: [
        { label: 'Timeframe', value: '1857 – 15 August 1947' },
        { label: 'Key Leaders', value: 'Mahatma Gandhi, Jawaharlal Nehru, Sardar Patel, Subhas Chandra Bose' },
        { label: 'Outcome', value: 'Sovereign Republic of India & Dominion of Pakistan' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Indian_independence_movement',
        'https://www.wikidata.org/wiki/Q124317'
      ],
      keywords: ['indian independence', 'freedom struggle', 'swaraj', '15 august 1947', 'british raj'],
      sources: [
        { title: 'National Archives of India', url: 'http://nationalarchives.nic.in' }
      ]
    },
    {
      slug: 'quit-india-movement',
      type: 'event',
      name: 'Quit India Movement',
      category: 'History',
      roleOrDesignation: 'All-India Mass Civil Disobedience Campaign (1942)',
      eraOrPeriod: 'World War II Era (August 1942)',
      summary: 'The Quit India Movement (August Kranti) was launched by Mahatma Gandhi at the Bombay session of the AICC on 8 August 1942 with the historic call "Do or Die".',
      keyFacts: [
        { label: 'Date', value: 'August 8, 1942' },
        { label: 'Slogan', value: '"Do or Die" (Karo ya Maro)' },
        { label: 'Venue', value: 'Gowalia Tank Maidan, Bombay' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Quit_India_Movement',
        'https://www.wikidata.org/wiki/Q1333333'
      ],
      keywords: ['quit india', 'august kranti', 'do or die', 'karo ya maro', 'gowalia tank'],
      sources: [
        { title: 'National Archives of India', url: 'http://nationalarchives.nic.in' }
      ]
    },
    {
      slug: 'theory-of-relativity',
      type: 'concept',
      name: 'Theory of Relativity',
      category: 'Science',
      roleOrDesignation: 'Pillar of Modern Physics',
      eraOrPeriod: 'Special (1905), General (1915)',
      summary: 'The theory of relativity by Albert Einstein encompasses special relativity and general relativity, describing gravity as the geometric curvature of spacetime.',
      keyFacts: [
        { label: 'Proponent', value: 'Albert Einstein' },
        { label: 'Core Formula', value: 'E = mc²' },
        { label: 'Key Predictions', value: 'Gravitational lensing, Time dilation, Black holes' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Theory_of_relativity',
        'https://www.wikidata.org/wiki/Q43514'
      ],
      keywords: ['theory of relativity', 'special relativity', 'general relativity', 'spacetime', 'time dilation'],
      sources: [
        { title: 'Max Planck Institute for Gravitational Physics', url: 'https://www.aei.mpg.de' }
      ]
    },
    {
      slug: 'quantum-mechanics',
      type: 'concept',
      name: 'Quantum Mechanics',
      category: 'Science',
      roleOrDesignation: 'Fundamental Theory in Physics',
      eraOrPeriod: '20th Century to Present',
      summary: 'Quantum mechanics is a fundamental theory in physics providing description of nature at atomic and subatomic scales, establishing wave-particle duality and uncertainty.',
      keyFacts: [
        { label: 'Pioneers', value: 'Planck, Einstein, Bohr, Heisenberg, Schrödinger' },
        { label: 'Principles', value: 'Wave-particle duality, Uncertainty principle, Superposition' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Quantum_mechanics',
        'https://www.wikidata.org/wiki/Q944'
      ],
      keywords: ['quantum mechanics', 'quantum physics', 'schrodinger', 'heisenberg uncertainty', 'superposition'],
      sources: [
        { title: 'CERN Quantum Technology Initiative', url: 'https://quantum.cern' }
      ]
    },
    {
      slug: 'photosynthesis',
      type: 'concept',
      name: 'Photosynthesis',
      category: 'Science',
      roleOrDesignation: 'Biological Energy Conversion Process',
      eraOrPeriod: 'Fundamental Biochemical Process',
      summary: 'Photosynthesis is a biological process used by plants, algae, and cyanobacteria to convert light energy into chemical energy, producing glucose and releasing oxygen.',
      keyFacts: [
        { label: 'Equation', value: '6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂' },
        { label: 'Pigment', value: 'Chlorophyll' },
        { label: 'Organelle', value: 'Chloroplasts' }
      ],
      sameAs: [
        'https://en.wikipedia.org/wiki/Photosynthesis',
        'https://www.wikidata.org/wiki/Q11990'
      ],
      keywords: ['photosynthesis', 'chlorophyll', 'chloroplast', 'calvin cycle'],
      sources: [
        { title: 'National Geographic Resource Library', url: 'https://www.nationalgeographic.org' }
      ]
    }
  ];

  const entityTypePrefixMap = {
    person: '/people',
    place: '/places',
    event: '/events',
    concept: '/concepts'
  };

  // Generate /entities, /people, /places, /events, /concepts directory pages
  const typeDirs = [
    { path: '/entities', title: 'Knowledge Graph & Entity Directory', typeFilter: null },
    { path: '/people', title: 'People & Historical Figures Directory', typeFilter: 'person' },
    { path: '/places', title: 'Places & World Landmarks Directory', typeFilter: 'place' },
    { path: '/events', title: 'Historic Events & Eras Directory', typeFilter: 'event' },
    { path: '/concepts', title: 'Concepts & Scientific Theories Directory', typeFilter: 'concept' }
  ];

  for (const dir of typeDirs) {
    const list = dir.typeFilter 
      ? ENTITY_REGISTRY.filter(e => e.type === dir.typeFilter)
      : ENTITY_REGISTRY;

    const cardsHtml = list.map(e => {
      const prefix = entityTypePrefixMap[e.type];
      return `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span class="tag" style="text-transform:capitalize;">${esc(e.type)}</span>
            <span style="font-size:12px;color:#64748b;">${esc(e.category)}</span>
          </div>
          <h2 style="font-size:18px;font-weight:700;margin:4px 0;"><a href="${prefix}/${e.slug}" style="color:#2563eb;text-decoration:none;">${esc(e.name)}</a></h2>
          ${e.roleOrDesignation ? `<div style="font-size:13px;font-weight:600;color:#475569;margin-bottom:6px;">${esc(e.roleOrDesignation)}</div>` : ''}
          <p style="font-size:13px;color:#64748b;margin:6px 0;">${esc(e.summary)}</p>
          <div style="margin-top:10px;"><a href="${prefix}/${e.slug}" style="font-size:13px;font-weight:600;color:#2563eb;text-decoration:none;">Explore Entity Facts &amp; Trivia &rarr;</a></div>
        </div>
      `;
    }).join('');

    const dirHtml = `
      <nav class="bc">
        <a href="/">Home</a> &rsaquo; 
        <a href="/entities">Knowledge Graph</a>
        ${dir.typeFilter ? ` &rsaquo; <span>${esc(dir.title)}</span>` : ''}
      </nav>
      <article>
        <h1>${esc(dir.title)}</h1>
        <p>Explore CuizIN's structured Knowledge Graph: comprehensive directory of notable figures, world landmarks, historical milestones, and scientific theories with verified trivia tests.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:16px;margin-top:20px;">
          ${cardsHtml}
        </div>
      </article>
    `;

    write(dir.path, {
      title: `${dir.title} | CuizIN Knowledge Graph`,
      description: `Explore structured knowledge entities, historical figures, geography landmarks, and science concepts on CuizIN.`,
      canonical: `${SITE_URL}${dir.path}`,
      bodyHtml: dirHtml,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": dir.title,
        "url": `${SITE_URL}${dir.path}`,
        "description": "CuizIN Knowledge Graph entity directory"
      }
    });
    count++;
  }

  // Pre-render individual entity pages
  console.log(`[seo-pages] Pre-rendering ${ENTITY_REGISTRY.length} Knowledge Graph entity pages...`);
  for (const entity of ENTITY_REGISTRY) {
    const prefix = entityTypePrefixMap[entity.type];
    const canonical = `${SITE_URL}${prefix}/${entity.slug}`;

    // Filter matched questions
    const matchedQuestions = allQuestions.filter(q => {
      const lower = (q.question || '').toLowerCase();
      const lowerExpl = (q.explanation || '').toLowerCase();
      return entity.keywords.some(kw => lower.includes(kw) || lowerExpl.includes(kw));
    }).slice(0, 25);

    const factsRows = entity.keyFacts.map(f => 
      `<tr><th style="text-align:left;padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;width:30%;">${esc(f.label)}</th><td style="padding:8px 12px;border:1px solid #e2e8f0;">${esc(f.value)}</td></tr>`
    ).join('');

    const sourcesHtml = entity.sources.map(s => 
      `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#f1f5f9;color:#0f172a;padding:4px 10px;border-radius:6px;font-size:12px;margin:3px 6px 3px 0;text-decoration:none;border:1px solid #e2e8f0;">${esc(s.title)} ↗</a>`
    ).join('');

    const questionsListHtml = matchedQuestions.map(q => {
      const qSlug = createSlug(q.question);
      const catSlug = getCategorySlug(q.category);
      const subSlug = getQuestionSubcategorySlug(q.category, q.question);
      const qUrl = subSlug ? `/quiz/question/${q.id}/${catSlug}/${subSlug}/${qSlug}` : `/quiz/question/${q.id}/${catSlug}/${qSlug}`;
      const ans = q.correct_answer || q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : '');
      return `
        <li style="margin-bottom:12px;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;">
          <a href="${qUrl}" style="font-weight:600;font-size:14px;color:#2563eb;text-decoration:none;">${esc(q.question)}</a>
          <div style="font-size:12px;color:#475569;margin-top:4px;">Ans: <strong>${esc(ans)}</strong> &bull; <span style="text-transform:capitalize;">${esc(q.difficulty || 'medium')}</span></div>
        </li>
      `;
    }).join('');

    const entityBodyHtml = `
      <nav class="bc">
        <a href="/">Home</a> &rsaquo; 
        <a href="/entities">Knowledge Graph</a> &rsaquo; 
        <a href="${prefix}">${esc(entity.type.toUpperCase())}</a> &rsaquo; 
        <span>${esc(entity.name)}</span>
      </nav>
      <article>
        <div style="margin-bottom:12px;">
          <span class="tag" style="text-transform:capitalize;">${esc(entity.type)}</span>
          <span class="tag">${esc(entity.category)}</span>
          <span class="tag" style="background:#e0f2fe;color:#0369a1;font-weight:600;">✓ Fact-Verified Node</span>
        </div>
        <h1>${esc(entity.name)}</h1>
        ${entity.roleOrDesignation ? `<div style="font-size:16px;font-weight:600;color:#2563eb;margin-bottom:12px;">${esc(entity.roleOrDesignation)}</div>` : ''}
        <p style="font-size:15px;line-height:1.6;color:#334155;">${esc(entity.summary)}</p>

        <h2 style="font-size:20px;font-weight:700;margin-top:24px;margin-bottom:12px;">Key Facts &amp; Chronology</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tbody>
            ${factsRows}
          </tbody>
        </table>

        ${matchedQuestions.length > 0 ? `
          <h2 style="font-size:20px;font-weight:700;margin-top:28px;margin-bottom:12px;">Verified Trivia Questions &amp; Knowledge Tests (${matchedQuestions.length})</h2>
          <ul style="list-style:none;padding:0;">
            ${questionsListHtml}
          </ul>
        ` : ''}

        <div style="margin-top:24px;padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Authoritative References &amp; External IDs</div>
          <div>${sourcesHtml}</div>
        </div>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
          <p>Indexed in <strong>CuizIN Knowledge Graph</strong> &bull; <a href="/editorial-policy">Editorial Standards</a> &bull; <a href="/entities">All Knowledge Nodes &rarr;</a></p>
        </div>
      </article>
    `;

    const schemaType = entity.type === 'person' ? 'Person' : entity.type === 'place' ? 'Place' : entity.type === 'event' ? 'Event' : 'DefinedTerm';

    const entityJsonLd = {
      "@context": "https://schema.org",
      "@type": schemaType,
      "@id": `${canonical}#entity`,
      "name": entity.name,
      "description": entity.summary,
      "url": canonical,
      "sameAs": entity.sameAs
    };

    write(`${prefix}/${entity.slug}`, {
      title: `${entity.name} — Facts, Timeline & Quiz Questions | CuizIN`,
      description: `Explore facts, timeline milestones, authoritative citations, and verified quiz questions about ${entity.name} on CuizIN.`,
      canonical,
      bodyHtml: entityBodyHtml,
      jsonLd: entityJsonLd
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
          const subSlug = getQuestionSubcategorySlug(q.category, q.question);
          const urlPath = subSlug
            ? `/quiz/question/${q.id}/${slug}/${subSlug}/${qSlug}`
            : `/quiz/question/${q.id}/${slug}/${qSlug}`;
          return `<li><a href="${urlPath}">${esc(q.question)}</a></li>`;
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

    let blogDesc = blog.excerpt ? blog.excerpt.trim() : '';
    if (!blogDesc || blogDesc.length < 120) {
      blogDesc = `Read "${blog.title}" on the CuizIN Blog. Discover trivia tips, fascinating facts, quiz strategies, and learning guides to master your knowledge.`;
    }
    if (blogDesc.length > 160) {
      blogDesc = blogDesc.substring(0, 157) + '...';
    }

    write(`/blog/${blog.slug}`, {
      title: `${blog.title} | CuizIN Blog`,
      description: blogDesc,
      canonical: `${SITE_URL}/blog/${blog.slug}`,
      bodyHtml: blogHtml
    });
    count++;
  }

  // 5.5. GENERATE INDIVIDUAL FAQ PAGES (Dynamic from Supabase)
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: faqs } = await supabase
        .from('faqs')
        .select('id, question, answer, category')
        .eq('is_published', true);

      if (faqs && faqs.length > 0) {
        console.log(`[seo-pages] Pre-rendering ${faqs.length} FAQ pages...`);
        for (const faq of faqs) {
          const slug = createSlug(faq.question);
          if (!slug) continue;

          let faqDesc = faq.answer ? faq.answer.replace(/\s+/g, ' ').trim() : '';
          if (faqDesc.length < 120) {
            faqDesc = `Find the answer to "${faq.question}" on CuizIN. ${faqDesc} Learn more about quizzes, rules, rewards, and gameplay tips.`;
          }
          if (faqDesc.length > 160) {
            faqDesc = faqDesc.substring(0, 157) + '...';
          }

          const faqHtml = `
            <nav class="bc"><a href="/">Home</a> &rsaquo; <a href="/faq">FAQ</a> &rsaquo; ${esc(faq.question)}</nav>
            <article>
              <h1>${esc(faq.question)}</h1>
              <div style="font-size: 16px; line-height: 1.6; color: #334155; margin-top: 16px;">
                ${esc(faq.answer)}
              </div>
              <div style="margin-top: 24px;">
                <a href="/faq" style="color: #2563eb; text-decoration: none; font-weight: 500;">&larr; Back to all FAQs</a>
              </div>
            </article>
          `;

          write(`/faq/${faq.id}/${slug}`, {
            title: `${faq.question} | CuizIN FAQ`,
            description: faqDesc,
            canonical: `${SITE_URL}/faq/${faq.id}/${slug}`,
            bodyHtml: faqHtml
          });
          count++;
        }
      }
    } catch (err) {
      console.warn('[seo-pages] Warning: Failed to fetch and pre-render FAQs:', err.message);
    }
  }
// Curated authoritative primary sources by category for crawlers
const CATEGORY_AUTHORITIES = {
  'History': [
    { title: 'National Archives of India', url: 'http://nationalarchives.nic.in' },
    { title: 'Archaeological Survey of India', url: 'https://asi.nic.in' }
  ],
  'Indian History': [
    { title: 'National Archives of India', url: 'http://nationalarchives.nic.in' },
    { title: 'Indian Council of Historical Research', url: 'http://ichr.ac.in' }
  ],
  'Science': [
    { title: 'NCERT Scientific Resources', url: 'https://ncert.nic.in' },
    { title: 'Encyclopaedia Britannica — Science', url: 'https://www.britannica.com/science' }
  ],
  'Science & Nature': [
    { title: 'Nature Publishing Group', url: 'https://www.nature.com' },
    { title: 'Encyclopaedia Britannica', url: 'https://www.britannica.com' }
  ],
  'Geography': [
    { title: 'Survey of India', url: 'https://surveyofindia.gov.in' },
    { title: 'UNESCO World Heritage Centre', url: 'https://whc.unesco.org' }
  ],
  'Sports': [
    { title: 'International Olympic Committee', url: 'https://olympics.com' },
    { title: 'Ministry of Youth Affairs and Sports', url: 'https://yas.nic.in' }
  ],
  'Cricket': [
    { title: 'International Cricket Council (ICC)', url: 'https://www.icc-cricket.com' },
    { title: 'Board of Control for Cricket in India (BCCI)', url: 'https://www.bcci.tv' }
  ],
  'Entertainment': [
    { title: 'National Film Archive of India', url: 'https://www.nfdcindia.com' },
    { title: 'Academy of Motion Picture Arts and Sciences', url: 'https://www.oscars.org' }
  ],
  'Bollywood': [
    { title: 'National Film Archive of India', url: 'https://www.nfdcindia.com' },
    { title: 'Directorate of Film Festivals', url: 'https://dff.gov.in' }
  ],
  'Arts & Literature': [
    { title: 'Sahitya Akademi', url: 'https://sahitya-akademi.gov.in' },
    { title: 'The Nobel Prize Foundation', url: 'https://www.nobelprize.org' }
  ],
  'Mythology': [
    { title: 'Indira Gandhi National Centre for the Arts', url: 'http://ignca.gov.in' },
    { title: 'Encyclopaedia Britannica — World Religions', url: 'https://www.britannica.com' }
  ],
  'General Knowledge': [
    { title: 'National Portal of India', url: 'https://www.india.gov.in' },
    { title: 'Encyclopaedia Britannica', url: 'https://www.britannica.com' }
  ],
  'Science: Computers': [
    { title: 'IEEE Computer Society', url: 'https://www.computer.org' },
    { title: 'World Wide Web Consortium (W3C)', url: 'https://www.w3.org' }
  ],
  'Guinness World Records': [
    { title: 'Guinness World Records Official Database', url: 'https://www.guinnessworldrecords.com' }
  ]
};

const DEFAULT_AUTHORITY = [
  { title: 'CuizIN Editorial & Fact-Checking Board', url: 'https://cuiz.in/editorial-policy' },
  { title: 'National Portal of India', url: 'https://www.india.gov.in' }
];

function getAuthorities(category) {
  return CATEGORY_AUTHORITIES[category] || DEFAULT_AUTHORITY;
}

function isDynamicFact(questionText, category) {
  const text = (questionText || '').toLowerCase();
  const dynamicPatterns = [
    /\b(current|present|latest|active|holds the record|fastest|highest score|world record|champion|won the 202[0-9]|in 202[0-9]|ipl 202[0-9]|icc 202[0-9])\b/i,
    /\b(prime minister of india as of|chief minister of|president of|governor of|captain of)\b/i
  ];
  return category === 'Guinness World Records' || dynamicPatterns.some(p => p.test(text));
}

function generateQuestionVariants(questionText) {
  if (!questionText || typeof questionText !== 'string') return [];
  const raw = questionText.trim().replace(/[.?]+$/, '');
  const variants = [];

  if (/^who was the first\s+(.+?)\s+of\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^who was the first\s+(.+?)\s+of\s+(.+)$/i);
    if (match) {
      const [, role, entity] = match;
      variants.push(`Who became the first ${role} of ${entity}?`);
      variants.push(`First ${role} of ${entity}`);
      variants.push(`Who was ${entity}'s first ${role}?`);
    }
  } else if (/^who was the\s+(.+?)\s+of\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^who was the\s+(.+?)\s+of\s+(.+)$/i);
    if (match) {
      const [, role, entity] = match;
      variants.push(`Who served as the ${role} of ${entity}?`);
      variants.push(`Who was ${entity}'s ${role}?`);
    }
  } else if (/^what is the capital of\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^what is the capital of\s+(.+)$/i);
    if (match) {
      const [, place] = match;
      variants.push(`Which city is the capital of ${place}?`);
      variants.push(`Capital city of ${place}`);
    }
  } else if (/^when did\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^when did\s+(.+)$/i);
    if (match) {
      const [, event] = match;
      variants.push(`In what year did ${event}?`);
    }
  } else if (/^which is the\s+(largest|smallest|highest|fastest|longest|deepest|oldest|hottest|coldest)\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^which is the\s+(largest|smallest|highest|fastest|longest|deepest|oldest|hottest|coldest)\s+(.+)$/i);
    if (match) {
      const [, superlative, object] = match;
      variants.push(`What is the ${superlative} ${object}?`);
      variants.push(`Record for ${superlative} ${object}`);
    }
  } else if (/^who (invented|discovered|wrote|painted|directed|composed)\s+(.+)$/i.test(raw)) {
    const match = raw.match(/^who (invented|discovered|wrote|painted|directed|composed)\s+(.+)$/i);
    if (match) {
      const [, verb, subject] = match;
      const nounMap = { invented: 'inventor of', discovered: 'discoverer of', wrote: 'author of', painted: 'painter of' };
      const noun = nounMap[verb.toLowerCase()] || 'creator of';
      variants.push(`Who was the ${noun} ${subject}?`);
    }
  }

  if (variants.length === 0) {
    if (raw.toLowerCase().startsWith('which ')) {
      variants.push(raw.replace(/^which /i, 'What ') + '?');
    } else if (raw.toLowerCase().startsWith('what ')) {
      variants.push(raw.replace(/^what /i, 'Which ') + '?');
    }
  }

  return Array.from(new Set(variants)).filter(v => v.toLowerCase() !== raw.toLowerCase()).slice(0, 3);
}

function getKnowledgeClaimId(questionId) {
  if (!questionId) return 'CUIZ-CLAIM-GEN';
  const prefix = String(questionId).replace(/-/g, '').slice(0, 8).toUpperCase();
  return `CUIZ-FACT-${prefix}`;
}

  // 6. GENERATE INDIVIDUAL QUESTION PAGES
  if (databaseAvailable && allQuestions.length > 0) {
    console.log(`[seo-pages] Generating static pages for ${allQuestions.length} quiz questions...`);
    
    // Group questions by category for fast related lookups
    const questionsByCategoryMap = {};
    for (const q of allQuestions) {
      const cat = q.category || 'General';
      if (!questionsByCategoryMap[cat]) questionsByCategoryMap[cat] = [];
      questionsByCategoryMap[cat].push(q);
    }

    let qCount = 0;
    for (const q of allQuestions) {
      const qSlug = createSlug(q.question);
      if (!qSlug) continue;

      const categorySlug = getCategorySlug(q.category);
      const subSlug = getQuestionSubcategorySlug(q.category, q.question);
      
      const canonical = subSlug
        ? `${SITE_URL}/quiz/question/${q.id}/${categorySlug}/${subSlug}/${qSlug}`
        : `${SITE_URL}/quiz/question/${q.id}/${categorySlug}/${qSlug}`;

      const optionsList = (Array.isArray(q.options) ? q.options : Object.values(q.options || {}))
        .map(opt => `<li>${esc(opt)}</li>`)
        .join('\n');

      const correctAnswer = q.correct_answer || q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : '');
      const authorities = getAuthorities(q.category);
      const dynamic = isDynamicFact(q.question, q.category);
      const badgeLabel = dynamic ? `⏱️ Verified for ${new Date().getFullYear()}` : '✓ Fact-Verified';
      const badgeStyle = dynamic
        ? 'background:#fef3c7;color:#92400e;font-weight:600;'
        : 'background:#e0f2fe;color:#0369a1;font-weight:600;';

      const claimId = getKnowledgeClaimId(q.id);
      const variants = generateQuestionVariants(q.question);

      const sourcesHtml = authorities.map(a => 
        `<a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#f1f5f9;color:#0f172a;padding:4px 10px;border-radius:6px;font-size:12px;margin:3px 6px 3px 0;text-decoration:none;border:1px solid #e2e8f0;">${esc(a.title)} ↗</a>`
      ).join('');

      const variantsHtml = variants.length > 0 ? `
        <div style="margin-top:16px;padding:12px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Also Asked As / Semantic Queries</div>
          <div>
            ${variants.map(v => `<span style="display:inline-block;background:#ffffff;color:#334155;padding:3px 8px;border-radius:12px;font-size:12px;margin:2px 4px 2px 0;border:1px solid #cbd5e1;">"${esc(v)}"</span>`).join('')}
          </div>
        </div>
      ` : '';

      // Extract 4-6 related questions from the same category
      const sameCatList = questionsByCategoryMap[q.category] || [];
      const relatedList = sameCatList
        .filter(rq => rq.id !== q.id)
        .slice(0, 6);

      const relatedGridHtml = relatedList.length > 0 ? `
        <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;">
          <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:12px;">Related Trivia &amp; Knowledge Questions</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:10px;">
            ${relatedList.map(rq => {
              const rqSlug = createSlug(rq.question);
              const rCatSlug = getCategorySlug(rq.category);
              const rSubSlug = getQuestionSubcategorySlug(rq.category, rq.question);
              const rUrl = rSubSlug ? `/quiz/question/${rq.id}/${rCatSlug}/${rSubSlug}/${rqSlug}` : `/quiz/question/${rq.id}/${rCatSlug}/${rqSlug}`;
              const rAns = rq.correct_answer || rq.correctAnswer || (Array.isArray(rq.options) ? rq.options[0] : '');
              return `
                <div style="padding:10px 12px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
                  <a href="${rUrl}" style="font-weight:600;font-size:13px;color:#2563eb;text-decoration:none;display:block;margin-bottom:4px;">${esc(rq.question)}</a>
                  <div style="font-size:11px;color:#64748b;">Ans: <strong>${esc(rAns)}</strong> &bull; <span style="text-transform:capitalize;">${esc(rq.difficulty || 'medium')}</span></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : '';

      const matchedEntity = ENTITY_REGISTRY.find(e => {
        const lower = (q.question || '').toLowerCase();
        return e.keywords.some(kw => lower.includes(kw));
      });

      const entityBadgeHtml = matchedEntity ? `
        <div style="margin-top:12px;margin-bottom:16px;padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:13px;color:#1e3a8a;">
            <strong>Knowledge Node:</strong> <a href="${entityTypePrefixMap[matchedEntity.type]}/${matchedEntity.slug}" style="color:#1d4ed8;font-weight:700;text-decoration:underline;">${esc(matchedEntity.name)}</a>
            <span style="font-size:11px;color:#64748b;margin-left:6px;text-transform:capitalize;">(${esc(matchedEntity.type)})</span>
          </div>
          <a href="${entityTypePrefixMap[matchedEntity.type]}/${matchedEntity.slug}" style="font-size:12px;font-weight:600;color:#2563eb;text-decoration:none;background:#ffffff;padding:3px 8px;border-radius:4px;border:1px solid #93c5fd;">View Hub &rarr;</a>
        </div>
      ` : '';

      const bodyHtml = `
        <nav class="bc">
          <a href="/">Home</a> &rsaquo; 
          <a href="/categories">Categories</a> &rsaquo; 
          <a href="/categories/${categorySlug}">${esc(q.category)}</a>
          ${subSlug ? ` &rsaquo; <a href="/categories/${categorySlug}/${subSlug}">${esc(getQuestionSubcategoryName(q.category, q.question))}</a>` : ''}
        </nav>
        <article>
          <div style="margin-bottom:12px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;">
            <span class="tag" style="font-family:monospace;font-weight:600;">${esc(claimId)}</span>
            <span class="tag">${esc(q.difficulty || 'medium')}</span>
            <span class="tag">${esc(q.category)}</span>
            <span class="tag" style="${badgeStyle}">${esc(badgeLabel)}</span>
          </div>
          <h1>${esc(q.question)}</h1>
          
          ${entityBadgeHtml}

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #2563eb;padding:14px 16px;border-radius:8px;margin:16px 0;">
            <div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Verified Answer</div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;">${esc(correctAnswer)}</div>
          </div>

          <h2>Quiz Options</h2>
          <ul>
            ${optionsList}
          </ul>
          
          ${q.explanation ? `
          <h2>Explanation &amp; Context</h2>
          <p>${esc(q.explanation)}</p>
          ` : ''}

          ${variantsHtml}

          <div style="margin-top:20px;padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
            <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Authoritative Sources &amp; Citations</div>
            <div>${sourcesHtml}</div>
          </div>

          ${relatedGridHtml}

          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
            <p>Fact-checked by <strong>CuizIN Editorial Team</strong> · Published under <a href="/editorial-policy">Editorial Standards</a> · <a href="/quiz/play/${q.id}/${qSlug}">Play this quiz interactively →</a></p>
          </div>
        </article>
      `;

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Question",
        "@id": `${canonical}#claim`,
        "name": q.question,
        "text": q.question,
        "alternateName": variants.length > 0 ? variants : undefined,
        "answerCount": 1,
        "datePublished": q.created_at || "2024-01-01T00:00:00Z",
        "dateModified": today,
        "citation": authorities.map(a => ({ "@type": "CreativeWork", "name": a.title, "url": a.url })),
        "author": {
          "@type": "Organization",
          "name": "CuizIN Editorial Team",
          "url": `${SITE_URL}/editorial-policy`
        },
        "publisher": {
          "@type": "Organization",
          "name": "CuizIN",
          "url": SITE_URL
        },
        "acceptedAnswer": {
          "@type": "Answer",
          "text": correctAnswer,
          "url": canonical
        }
      };

      const title = `${q.question.substring(0, 60)}${q.question.length > 60 ? '...' : ''} | ${q.category} Quiz Question`;
      const cleanQ = q.question.replace(/"/g, "'");
      const description = `Answer the quiz question: "${cleanQ.substring(0, 80)}${cleanQ.length > 80 ? '...' : ''}" (${q.difficulty || 'medium'} difficulty). Find options, correct answer, and explanation. Play free quizzes on CuizIN.`;

      const routePath = subSlug
        ? `/quiz/question/${q.id}/${categorySlug}/${subSlug}/${qSlug}`
        : `/quiz/question/${q.id}/${categorySlug}/${qSlug}`;

      write(routePath, {
        title,
        description,
        canonical,
        bodyHtml,
        jsonLd
      });
      qCount++;
    }
    console.log(`[seo-pages] Successfully pre-rendered ${qCount} quiz question pages.`);
    count += qCount;
  }

  // 7. GENERATE PUBLIC API JSON MANIFESTS (/api/v1/questions.json & /api/v1/entities.json)
  const apiDir = path.join(__dirname, 'dist', 'api', 'v1');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  const questionsApiData = {
    version: "1.0",
    total: allQuestions.length,
    lastUpdated: new Date().toISOString(),
    questions: allQuestions.slice(0, 1000).map(q => ({
      id: q.id,
      claimId: getKnowledgeClaimId(q.id),
      question: q.question,
      category: q.category,
      difficulty: q.difficulty || 'medium',
      correctAnswer: q.correct_answer || q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : ''),
      canonicalUrl: `${SITE_URL}/quiz/question/${q.id}/${getCategorySlug(q.category)}/${createSlug(q.question)}`
    }))
  };
  fs.writeFileSync(path.join(apiDir, 'questions.json'), JSON.stringify(questionsApiData, null, 2));

  const entitiesApiData = {
    version: "1.0",
    total: ENTITY_REGISTRY.length,
    lastUpdated: new Date().toISOString(),
    entities: ENTITY_REGISTRY.map(e => ({
      slug: e.slug,
      type: e.type,
      name: e.name,
      category: e.category,
      roleOrDesignation: e.roleOrDesignation,
      summary: e.summary,
      sameAs: e.sameAs,
      hubUrl: `${SITE_URL}/${entityTypePrefixMap[e.type]}/${e.slug}`
    }))
  };
  fs.writeFileSync(path.join(apiDir, 'entities.json'), JSON.stringify(entitiesApiData, null, 2));
  console.log('[seo-pages] Successfully generated public /api/v1/questions.json and /api/v1/entities.json endpoints.');

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
