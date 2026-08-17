const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const SITE_URL = 'https://cuiz.in';

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

const categoryToSlugMap = {};
for (const [slug, cats] of Object.entries(slugToCategoriesMap)) {
  for (const cat of cats) {
    categoryToSlugMap[cat] = slug;
  }
}
function getCategorySlug(cat) {
  return categoryToSlugMap[cat] || 'general-knowledge';
}

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

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function run() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables are required to generate sitemaps.');
    console.log('Skipping sitemap generation and using existing/fallback sitemaps to prevent build failure.');
    return;
  }

  console.log('Starting sitemap generation using Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  const today = new Date().toISOString().split('T')[0];

  const sitemapsDir = path.join(__dirname, 'public', 'sitemaps');
  if (!fs.existsSync(sitemapsDir)) {
    fs.mkdirSync(sitemapsDir, { recursive: true });
  }

  // 1. GENERATE MAIN SITEMAP (sitemaps/main.xml)
  console.log('Generating main sitemap...');
  const mainEntries = [];

  // Static pages
  const staticPages = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/quiz', changefreq: 'daily', priority: '0.9' },
    { loc: '/categories', changefreq: 'weekly', priority: '0.9' },
    { loc: '/browse', changefreq: 'daily', priority: '0.9' },
    { loc: '/blog', changefreq: 'weekly', priority: '0.8' },
    { loc: '/faq', changefreq: 'weekly', priority: '0.8' },
    { loc: '/referral-program', changefreq: 'monthly', priority: '0.7' },
    { loc: '/how-to-play', changefreq: 'monthly', priority: '0.7' },
    { loc: '/topics', changefreq: 'weekly', priority: '0.8' },
    { loc: '/cricket-quiz', changefreq: 'weekly', priority: '0.9' },
    { loc: '/bollywood-quiz', changefreq: 'weekly', priority: '0.9' },
    { loc: '/gk-quiz', changefreq: 'weekly', priority: '0.9' },
    { loc: '/topics/indian-history', changefreq: 'weekly', priority: '0.8' },
    { loc: '/topics/bollywood', changefreq: 'weekly', priority: '0.8' },
    { loc: '/topics/cricket', changefreq: 'weekly', priority: '0.8' },
    { loc: '/topics/world-geography', changefreq: 'weekly', priority: '0.8' },
    { loc: '/topics/science-technology', changefreq: 'weekly', priority: '0.8' },
    { loc: '/topics/world-history', changefreq: 'weekly', priority: '0.8' },
    { loc: '/topics/mythology', changefreq: 'weekly', priority: '0.8' },
    { loc: '/topics/video-games', changefreq: 'weekly', priority: '0.8' },
    { loc: '/topics/movies-tv', changefreq: 'weekly', priority: '0.8' },
    { loc: '/topics/food-cuisine', changefreq: 'weekly', priority: '0.8' },
    { loc: '/login', changefreq: 'yearly', priority: '0.5' },
    { loc: '/register', changefreq: 'yearly', priority: '0.5' },
    { loc: '/stories', changefreq: 'daily', priority: '0.8' },
    { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
    { loc: '/disclaimer', changefreq: 'yearly', priority: '0.3' },
    { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
  ];

  for (const page of staticPages) {
    mainEntries.push(`  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // Category and subcategory landing pages
  for (const cat of Object.keys(slugToCategoriesMap)) {
    mainEntries.push(`  <url>
    <loc>${SITE_URL}/categories/${cat}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    
    const subs = subcategoriesByCategory[cat] || [];
    for (const s of subs) {
      mainEntries.push(`  <url>
    <loc>${SITE_URL}/categories/${cat}/${s.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  }

  // Blog posts
  const { data: blogs, error: blogError } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (blogError) {
    console.error('Error fetching blog posts for sitemap:', blogError);
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
        console.log(`Loaded ${staticBlogs.length} static blogs from blogData.ts for sitemap.`);
      } else {
        console.warn('Warning: Could not find blogPosts marker in blogData.ts for sitemap');
      }
    } catch (err) {
      console.warn('Warning: Failed to parse static blogData.ts for sitemap:', err.message);
    }
  }

  const allBlogsMap = new Map();
  if (blogs) {
    for (const blog of blogs) {
      if (blog.slug) {
        allBlogsMap.set(blog.slug, {
          slug: blog.slug,
          lastmod: blog.updated_at ? blog.updated_at.split('T')[0] : today
        });
      }
    }
  }

  for (const staticBlog of staticBlogs) {
    if (staticBlog.slug && !allBlogsMap.has(staticBlog.slug)) {
      allBlogsMap.set(staticBlog.slug, {
        slug: staticBlog.slug,
        lastmod: staticBlog.date || today
      });
    }
  }

  console.log(`Including ${allBlogsMap.size} unique blogs in the sitemap.`);
  for (const blog of allBlogsMap.values()) {
    mainEntries.push(`  <url>
    <loc>${SITE_URL}/blog/${escapeXml(blog.slug)}</loc>
    <lastmod>${blog.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  // FAQs
  const { data: faqs, error: faqError } = await supabase
    .from('faqs')
    .select('id, question, updated_at')
    .eq('is_published', true)
    .order('order_index', { ascending: true });

  if (faqError) {
    console.error('Error fetching FAQs for sitemap:', faqError);
  } else if (faqs) {
    for (const faq of faqs) {
      const slug = createSlug(faq.question);
      const lastmod = faq.updated_at ? faq.updated_at.split('T')[0] : today;
      mainEntries.push(`  <url>
    <loc>${SITE_URL}/faq/${faq.id}/${escapeXml(slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }
  }

  const mainXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${mainEntries.join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(sitemapsDir, 'main.xml'), mainXml);
  console.log(`Generated main sitemap with ${mainEntries.length} entries.`);

  // 2. FETCH ALL QUIZ QUESTIONS (Single query batching sorted by ID)
  console.log('Fetching all quiz questions for AMP and Category sitemaps...');
  const allQuestions = [];
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
      console.error('Error fetching quiz questions:', error);
      throw error;
    }

    if (data && data.length > 0) {
      allQuestions.push(...data);
      from += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }
  console.log(`Fetched ${allQuestions.length} questions successfully.`);

  // Write temporary cache file for generate-seo-pages.cjs
  const cachePath = path.join(__dirname, 'temp-questions-cache.json');
  try {
    fs.writeFileSync(cachePath, JSON.stringify(allQuestions), 'utf8');
    console.log('Temporary questions cache written for SEO generator.');
  } catch (err) {
    console.warn('Warning: Could not write questions cache file:', err.message);
  }

  // 3. GENERATE AMP SITEMAP (sitemaps/amp.xml)
  console.log('Generating AMP sitemap...');
  const ampEntries = [];
  
  // Sort in memory by created_at DESC to put newest first
  const sortedQuestions = [...allQuestions].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  for (const q of sortedQuestions) {
    const lastmod = q.created_at ? q.created_at.split('T')[0] : today;
    ampEntries.push(`  <url>
    <loc>${SITE_URL}/amp/question/${q.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  const ampXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ampEntries.join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(sitemapsDir, 'amp.xml'), ampXml);
  console.log(`Generated AMP sitemap with ${ampEntries.length} entries.`);

  // 4. GENERATE CATEGORY SITEMAPS (sitemaps/category/[category]/sitemap.xml)
  const categories = Object.keys(slugToCategoriesMap);
  for (const cat of categories) {
    console.log(`Generating category sitemap for ${cat}...`);
    const dbCategories = slugToCategoriesMap[cat] || [];
    
    // Filter and sort in memory by created_at DESC
    const catQuestions = allQuestions
      .filter(q => dbCategories.includes(q.category))
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

    const catEntries = [];
    const catDir = path.join(sitemapsDir, 'category', cat);
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir, { recursive: true });
    }

    for (const q of catQuestions) {
      const slug = createSlug(q.question);
      if (slug) {
        const lastmod = q.created_at ? q.created_at.split('T')[0] : today;
        const subSlug = getQuestionSubcategorySlug(q.category, q.question);
        const urlPath = subSlug
          ? `/quiz/question/${q.id}/${cat}/${subSlug}/${escapeXml(slug)}`
          : `/quiz/question/${q.id}/${cat}/${escapeXml(slug)}`;
        catEntries.push(`  <url>
    <loc>${SITE_URL}${urlPath}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
    }

    const catXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${catEntries.join('\n')}
</urlset>`;

    fs.writeFileSync(path.join(catDir, 'sitemap.xml'), catXml);
    console.log(`Generated ${cat} category sitemap with ${catEntries.length} entries.`);
  }

  // 4. GENERATE SITEMAP INDEX (public/sitemap.xml)
  console.log('Generating index sitemap...');
  let indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  indexXml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Main
  indexXml += `  <sitemap>\n    <loc>${SITE_URL}/sitemaps/main.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
  
  // Categories
  for (const cat of categories) {
    indexXml += `  <sitemap>\n    <loc>${SITE_URL}/sitemaps/category/${cat}/sitemap.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
  }
  
  // AMP
  indexXml += `  <sitemap>\n    <loc>${SITE_URL}/sitemaps/amp.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
  
  indexXml += '</sitemapindex>';

  fs.writeFileSync(path.join(__dirname, 'public', 'sitemap.xml'), indexXml);
  console.log('Generated index sitemap.');

  console.log('Sitemap generation completed successfully!');
}

run().catch((err) => {
  console.error('Critical error during sitemap generation:', err);
  process.exit(1);
});
