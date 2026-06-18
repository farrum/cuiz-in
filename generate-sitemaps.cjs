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
  ]
};

const subcategoriesByCategory = {
  history: [
    { slug: 'indian-history', name: 'Indian History' },
    { slug: 'world-wars', name: 'World Wars' },
    { slug: 'ancient-history', name: 'Ancient History' },
    { slug: 'medieval', name: 'Medieval Period' },
    { slug: 'modern-history', name: 'Modern History' },
  ],
  science: [
    { slug: 'physics', name: 'Physics' },
    { slug: 'chemistry', name: 'Chemistry' },
    { slug: 'biology', name: 'Biology' },
    { slug: 'astronomy', name: 'Astronomy' },
    { slug: 'mathematics', name: 'Mathematics' },
    { slug: 'nature', name: 'Nature' },
    { slug: 'space-exploration', name: 'Space & Exploration' },
  ],
  geography: [
    { slug: 'countries-capitals', name: 'Countries & Capitals' },
    { slug: 'landmarks', name: 'Landmarks & Wonders' },
    { slug: 'physical-geography', name: 'Physical Geography' },
    { slug: 'indian-geography', name: 'Indian Geography' },
  ],
  literature: [
    { slug: 'books', name: 'Books & Novels' },
    { slug: 'art', name: 'Art' },
  ],
  entertainment: [
    { slug: 'movies', name: 'Movies' },
    { slug: 'music', name: 'Music' },
    { slug: 'television', name: 'Television' },
    { slug: 'video-games', name: 'Video Games' },
    { slug: 'celebrities', name: 'Celebrities' },
    { slug: 'anime-manga', name: 'Anime & Manga' },
    { slug: 'cartoons', name: 'Cartoons & Animation' },
    { slug: 'board-games', name: 'Board Games' },
    { slug: 'bollywood', name: 'Bollywood' },
  ],
  sports: [
    { slug: 'cricket', name: 'Cricket' },
    { slug: 'football', name: 'Football / Soccer' },
    { slug: 'tennis', name: 'Tennis' },
    { slug: 'olympics', name: 'Olympics' },
    { slug: 'basketball', name: 'Basketball' },
  ],
  technology: [
    { slug: 'computers', name: 'Computers' },
    { slug: 'gadgets', name: 'Gadgets' },
    { slug: 'vehicles', name: 'Vehicles' },
    { slug: 'programming', name: 'Programming' },
    { slug: 'ai-robotics', name: 'AI & Robotics' },
    { slug: 'internet', name: 'Internet & Web' },
    { slug: 'ai-machine-learning', name: 'AI & Machine Learning' },
    { slug: 'electric-vehicles', name: 'Electric Vehicles' },
  ],
  'general-knowledge': [
    { slug: 'mythology', name: 'Mythology' },
    { slug: 'animals', name: 'Animals' },
    { slug: 'food-drink', name: 'Food & Drink' },
    { slug: 'politics', name: 'Politics' },
    { slug: 'culture', name: 'Culture' },
    { slug: 'green-energy', name: 'Green Energy & Sustainability' },
  ],
  'guinness-world-records': [
    { slug: 'human-achievements', name: 'Human Achievements' },
    { slug: 'sports-records', name: 'Sports Records' },
    { slug: 'nature-records', name: 'Nature & Animals' },
    { slug: 'food-records', name: 'Food Records' },
    { slug: 'entertainment-records', name: 'Entertainment Records' },
    { slug: 'science-records', name: 'Science & Technology' },
  ],
};

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
  } else if (blogs) {
    for (const blog of blogs) {
      const lastmod = blog.updated_at ? blog.updated_at.split('T')[0] : today;
      mainEntries.push(`  <url>
    <loc>${SITE_URL}/blog/${escapeXml(blog.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
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

  // 2. GENERATE AMP SITEMAP (sitemaps/amp.xml)
  console.log('Generating AMP sitemap...');
  const ampEntries = [];
  let offset = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: questions, error: qError } = await supabase
      .from('quiz_questions')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (qError) {
      console.error('Error fetching questions for AMP sitemap:', qError);
      throw qError;
    }

    if (questions && questions.length > 0) {
      for (const q of questions) {
        const lastmod = q.created_at ? q.created_at.split('T')[0] : today;
        ampEntries.push(`  <url>
    <loc>${SITE_URL}/amp/question/${q.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
      }
      offset += pageSize;
      hasMore = questions.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  const ampXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ampEntries.join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(sitemapsDir, 'amp.xml'), ampXml);
  console.log(`Generated AMP sitemap with ${ampEntries.length} entries.`);

  // 3. GENERATE CATEGORY SITEMAPS (sitemaps/category/[category]/sitemap.xml)
  const categories = Object.keys(slugToCategoriesMap);
  for (const cat of categories) {
    console.log(`Generating category sitemap for ${cat}...`);
    const dbCategories = slugToCategoriesMap[cat];
    const catEntries = [];
    let catOffset = 0;
    let catHasMore = true;

    const catDir = path.join(sitemapsDir, 'category', cat);
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir, { recursive: true });
    }

    while (catHasMore) {
      const { data: catQuestions, error: catQError } = await supabase
        .from('quiz_questions')
        .select('id, question, created_at')
        .in('category', dbCategories)
        .order('created_at', { ascending: false })
        .range(catOffset, catOffset + pageSize - 1);

      if (catQError) {
        console.error(`Error fetching questions for category ${cat}:`, catQError);
        throw catQError;
      }

      if (catQuestions && catQuestions.length > 0) {
        for (const q of catQuestions) {
          const slug = createSlug(q.question);
          if (slug) {
            const lastmod = q.created_at ? q.created_at.split('T')[0] : today;
            catEntries.push(`  <url>
    <loc>${SITE_URL}/quiz/question/${q.id}/${cat}/${escapeXml(slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
          }
        }
        catOffset += pageSize;
        catHasMore = catQuestions.length === pageSize;
      } else {
        catHasMore = false;
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
