import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'public, max-age=300, s-maxage=300',
  'CDN-Cache-Control': 'max-age=300',
};

const validCategories = ['history', 'science', 'geography', 'literature', 'entertainment', 'sports', 'technology', 'general-knowledge'];

const slugToCategoriesMap: Record<string, string[]> = {
  'history': ['History'],
  'science': ['Science', 'Science & Nature', 'Science &amp; Nature', 'Nature', 'Science: Mathematics'],
  'geography': ['Geography'],
  'literature': ['Art', 'Arts & Literature', 'Arts and Literature', 'Entertainment: Books'],
  'entertainment': ['Entertainment', 'Entertainment: Board Games', 'Entertainment: Books', 'Entertainment: Cartoon & Animations', 'Entertainment: Cartoon &amp; Animations', 'Entertainment: Comics', 'Entertainment: Film', 'Entertainment: Japanese Anime & Manga', 'Entertainment: Japanese Anime &amp; Manga', 'Entertainment: Music', 'Entertainment: Musicals & Theatres', 'Entertainment: Musicals &amp; Theatres', 'Entertainment: Television', 'Entertainment: Video Games', 'Celebrities'],
  'sports': ['Sports', 'Cricket'],
  'technology': ['Science: Computers', 'Science: Gadgets', 'Science and Technology', 'Science & Technology', 'Vehicles'],
  'general-knowledge': ['General Knowledge', 'Mythology', 'Animals', 'Culture', 'Food & Drink', 'Food and Drinks', 'Politics']
};

function createSlug(text: string, maxLength = 80): string {
  if (!text) return '';
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, maxLength);
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function fetchAllQuestions(supabase: any, categoryFilter?: string[]) {
  const all: { id: string; question: string; created_at: string | null }[] = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    let query = supabase.from('quiz_questions').select('id, question, created_at');
    if (categoryFilter) query = query.in('category', categoryFilter);
    const { data, error } = await query.range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const cat = url.searchParams.get('cat');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];

    // ROUTE 1: ?cat=history etc → category question sitemap
    if (cat && validCategories.includes(cat)) {
      const dbCategories = slugToCategoriesMap[cat];
      if (!dbCategories) return new Response('Category not found', { status: 404, headers });
      
      const questions = await fetchAllQuestions(supabase, dbCategories);
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      for (const q of questions) {
        const slug = createSlug(q.question);
        if (!slug) continue;
        xml += `  <url>\n    <loc>${escapeXml(`https://cuiz.in/quiz/question/${q.id}/${slug}`)}</loc>\n    <lastmod>${q.created_at?.split('T')[0] || today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
      xml += '</urlset>';
      
      console.log(`Sitemap cat=${cat}: ${questions.length} URLs`);
      return new Response(xml, { headers });
    }

    // ROUTE 2: ?type=main → static pages, categories, blog, FAQs
    if (type === 'main') {
      const staticPages = [
        { path: '/', pri: '1.0', freq: 'daily' },
        { path: '/quiz', pri: '0.9', freq: 'daily' },
        { path: '/categories', pri: '0.9', freq: 'weekly' },
        { path: '/blog', pri: '0.8', freq: 'weekly' },
        { path: '/faq', pri: '0.8', freq: 'weekly' },
        { path: '/referral-program', pri: '0.7', freq: 'monthly' },
        { path: '/how-to-play', pri: '0.7', freq: 'monthly' },
        { path: '/login', pri: '0.5', freq: 'yearly' },
        { path: '/register', pri: '0.5', freq: 'yearly' },
        { path: '/terms', pri: '0.3', freq: 'yearly' },
        { path: '/disclaimer', pri: '0.3', freq: 'yearly' },
        { path: '/privacy', pri: '0.3', freq: 'yearly' },
      ];

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Static pages
      for (const p of staticPages) {
        xml += `  <url>\n    <loc>${escapeXml(`https://cuiz.in${p.path}`)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.pri}</priority>\n  </url>\n`;
      }
      
      // Category pages
      for (const slug of validCategories) {
        xml += `  <url>\n    <loc>${escapeXml(`https://cuiz.in/categories/${slug}`)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }

      // Blog posts
      const { data: blogs } = await supabase.from('blog_posts').select('slug, updated_at, created_at').eq('is_published', true);
      if (blogs) {
        for (const b of blogs) {
          if (!b.slug) continue;
          xml += `  <url>\n    <loc>${escapeXml(`https://cuiz.in/blog/${b.slug}`)}</loc>\n    <lastmod>${b.updated_at?.split('T')[0] || b.created_at?.split('T')[0] || today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        }
      }

      // FAQs
      const { data: faqs } = await supabase.from('faqs').select('id, question, updated_at, created_at').eq('is_published', true);
      if (faqs) {
        for (const f of faqs) {
          const slug = createSlug(f.question, 60);
          if (!slug) continue;
          xml += `  <url>\n    <loc>${escapeXml(`https://cuiz.in/faq/${f.id}/${slug}`)}</loc>\n    <lastmod>${f.updated_at?.split('T')[0] || f.created_at?.split('T')[0] || today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        }
      }

      xml += '</urlset>';
      const urlCount = (xml.match(/<url>/g) || []).length;
      console.log(`Sitemap type=main: ${urlCount} URLs`);
      return new Response(xml, { headers });
    }

    // ROUTE 3: No params → sitemap index (use path-based URLs, NOT query params)
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Main sitemap (static + blog + FAQ + answers)
    xml += `  <sitemap>\n    <loc>https://cuiz.in/sitemap-main.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
    
    // Category sitemaps (path-based, proxied via _redirects)
    for (const cat of validCategories) {
      xml += `  <sitemap>\n    <loc>https://cuiz.in/sitemap-cat-${cat}.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
    }
    
    xml += '</sitemapindex>';
    console.log(`Sitemap index: 1 main + ${validCategories.length} categories = ${1 + validCategories.length} children`);
    return new Response(xml, { headers });

  } catch (error) {
    console.error('Sitemap error:', error);
    return new Response('Error generating sitemap', { status: 500, headers });
  }
});
