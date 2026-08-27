import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = 'https://pgywvtphfidouakypdno.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-version, x-app-platform',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400',
};

const SITE_URL = 'https://cuiz.in';

// COMPLETE category slug to database category name mapping
// Based on actual database categories (36 total)
const slugToCategoriesMap: Record<string, string[]> = {
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

// Subcategory definitions — keep in sync with src/utils/subcategoryConfig.ts
interface SubDef { slug: string; name: string; dbCategories?: string[]; keywords?: string[] }
const subcategoriesByCategory: Record<string, SubDef[]> = {
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

const categoryToSlugMap: Record<string, string> = {};
for (const [slug, cats] of Object.entries(slugToCategoriesMap)) {
  for (const cat of cats) {
    categoryToSlugMap[cat] = slug;
  }
}
function getCategorySlug(cat: string): string {
  return categoryToSlugMap[cat] || 'general-knowledge';
}

function getQuestionSubcategorySlug(dbCategory: string, questionText: string): string | undefined {
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

function createSlug(text: string, maxLength: number = 80): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, maxLength)
    .replace(/-$/, '');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'index';
    const category = url.searchParams.get('category');
    const sub = url.searchParams.get('sub');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];

    if (type === 'index') {
      // Generate sitemap index: main + category (subcategory sitemaps are removed to optimize crawl budget)
      const categories = Object.keys(slugToCategoriesMap);

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Main sitemap
      xml += `  <sitemap>\n    <loc>${SITE_URL}/sitemaps/main.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;

      for (const cat of categories) {
        xml += `  <sitemap>\n    <loc>${SITE_URL}/sitemaps/category/${cat}/sitemap.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
      }

      xml += '</sitemapindex>';
      console.log(`Generated streamlined sitemap index: ${categories.length} categories`);
      return new Response(xml, { headers: corsHeaders });
    }
    
    if (type === 'main') {
      // Generate main sitemap (static pages, blog, FAQs)
      const entries: string[] = [];
      
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
        entries.push(`  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
      }
      
      // Category pages
      for (const cat of Object.keys(slugToCategoriesMap)) {
        entries.push(`  <url>
    <loc>${SITE_URL}/categories/${cat}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
        // Subcategory landing pages
        const subs = subcategoriesByCategory[cat] || [];
        for (const s of subs) {
          entries.push(`  <url>
    <loc>${SITE_URL}/categories/${cat}/${s.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
        }
      }
      
      // Blog posts
      const { data: blogs } = await supabase
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      if (blogs) {
        for (const blog of blogs) {
          const lastmod = blog.updated_at ? blog.updated_at.split('T')[0] : today;
          entries.push(`  <url>
    <loc>${SITE_URL}/blog/${escapeXml(blog.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
        }
      }
      
      // FAQs
      const { data: faqs } = await supabase
        .from('faqs')
        .select('id, question, updated_at')
        .eq('is_published', true)
        .order('order_index', { ascending: true });
      
      if (faqs) {
        for (const faq of faqs) {
          const slug = createSlug(faq.question);
          const lastmod = faq.updated_at ? faq.updated_at.split('T')[0] : today;
          entries.push(`  <url>
    <loc>${SITE_URL}/faq/${faq.id}/${escapeXml(slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
        }
      }
      
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
      
      console.log(`Generated main sitemap with ${entries.length} URLs`);
      return new Response(xml, { headers: corsHeaders });
    }
    
    if (type === 'category' && category) {
      // Generate category-specific sitemap with ALL questions using pagination
      const dbCategories = slugToCategoriesMap[category];
      if (!dbCategories) {
        console.error(`Category not found: ${category}`);
        return new Response('Category not found', { status: 404, headers: corsHeaders });
      }
      
      // Paginate to get ALL questions (Supabase default limit is 1000)
      const allQuestions: { id: string; question: string; category: string; created_at: string | null }[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: questions, error } = await supabase
          .from('quiz_questions')
          .select('id, question, category, created_at')
          .in('category', dbCategories)
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);
        
        if (error) {
          console.error(`Error fetching questions for ${category}:`, error);
          return new Response('Error fetching questions', { status: 500, headers: corsHeaders });
        }
        
        if (questions && questions.length > 0) {
          allQuestions.push(...questions);
          offset += pageSize;
          hasMore = questions.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      const entries: string[] = [];
      
      for (const q of allQuestions) {
        const slug = createSlug(q.question);
        if (slug) {
          const lastmod = q.created_at ? q.created_at.split('T')[0] : today;
          const subSlug = getQuestionSubcategorySlug(q.category, q.question);
          const urlPath = subSlug
            ? `/quiz/question/${q.id}/${category}/${subSlug}/${escapeXml(slug)}`
            : `/quiz/question/${q.id}/${category}/${escapeXml(slug)}`;
          entries.push(`  <url>
    <loc>${SITE_URL}${urlPath}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
        }
      }
      
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
      
      console.log(`Generated ${category} sitemap with ${entries.length} URLs from ${dbCategories.length} DB categories`);
      return new Response(xml, { headers: corsHeaders });
    }

    if (type === 'subcategory' && category && sub) {
      const subDef = (subcategoriesByCategory[category] || []).find((s) => s.slug === sub);
      if (!subDef) {
        return new Response('Subcategory not found', { status: 404, headers: corsHeaders });
      }
      const baseCats = subDef.dbCategories && subDef.dbCategories.length > 0
        ? subDef.dbCategories
        : (slugToCategoriesMap[category] || []);

      const allQuestions: { id: string; question: string; created_at: string | null }[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let q = supabase
          .from('quiz_questions')
          .select('id, question, created_at')
          .in('category', baseCats)
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (subDef.keywords && subDef.keywords.length > 0) {
          const or = subDef.keywords
            .map((kw) => `question.ilike.%${kw.replace(/[,()]/g, '')}%`)
            .join(',');
          q = q.or(or);
        }

        const { data: rows, error } = await q;
        if (error) {
          console.error('Subcategory sitemap error:', error);
          return new Response('Error', { status: 500, headers: corsHeaders });
        }
        if (rows && rows.length > 0) {
          allQuestions.push(...rows);
          offset += pageSize;
          hasMore = rows.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      const entries: string[] = [];
      for (const qq of allQuestions) {
        const slug = createSlug(qq.question);
        if (!slug) continue;
        const lastmod = qq.created_at ? qq.created_at.split('T')[0] : today;
        entries.push(`  <url>
    <loc>${SITE_URL}/quiz/question/${qq.id}/${category}/${sub}/${escapeXml(slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
      console.log(`Generated subcategory sitemap ${category}/${sub}: ${entries.length} URLs`);
      return new Response(xml, { headers: corsHeaders });
    }

    return new Response('Invalid sitemap type', { status: 400, headers: corsHeaders });
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
