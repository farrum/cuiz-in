import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = 'https://pgywvtphfidouakypdno.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'public, max-age=3600',
};

const SITE_URL = 'https://cuiz.in';

// Category slug to database category name mapping
const slugToCategoriesMap: Record<string, string[]> = {
  'history': ['History'],
  'science': ['Science', 'Science & Nature', 'Science: Computers', 'Science: Mathematics', 'Science: Gadgets'],
  'geography': ['Geography'],
  'literature': ['Art', 'Art & Literature'],
  'entertainment': [
    'Entertainment', 'Entertainment: Board Games', 'Entertainment: Books', 
    'Entertainment: Cartoon & Animations', 'Entertainment: Comics', 'Entertainment: Film',
    'Entertainment: Japanese Anime & Manga', 'Entertainment: Music', 'Entertainment: Musicals & Theatres',
    'Entertainment: Television', 'Entertainment: Video Games'
  ],
  'sports': ['Sports'],
  'technology': ['Computers', 'Science: Computers', 'Science: Gadgets', 'Vehicles'],
  'general-knowledge': ['General Knowledge', 'Mythology', 'Animals', 'Celebrities', 'Politics']
};

function createSlug(text: string, maxLength: number = 80): string {
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
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];

    if (type === 'index') {
      // Generate sitemap index
      const categories = Object.keys(slugToCategoriesMap);
      
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Main sitemap
      xml += '  <sitemap>\n';
      xml += `    <loc>${SITE_URL}/sitemap-main.xml</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '  </sitemap>\n';
      
      // Category sitemaps
      for (const cat of categories) {
        xml += '  <sitemap>\n';
        xml += `    <loc>${SITE_URL}/sitemap-category-${cat}.xml</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += '  </sitemap>\n';
      }
      
      xml += '</sitemapindex>';
      
      console.log(`Generated sitemap index with ${categories.length + 1} sitemaps`);
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
        { loc: '/blog', changefreq: 'weekly', priority: '0.8' },
        { loc: '/faq', changefreq: 'weekly', priority: '0.8' },
        { loc: '/referral-program', changefreq: 'monthly', priority: '0.7' },
        { loc: '/how-to-play', changefreq: 'monthly', priority: '0.7' },
        { loc: '/login', changefreq: 'yearly', priority: '0.5' },
        { loc: '/register', changefreq: 'yearly', priority: '0.5' },
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
      // Generate category-specific sitemap
      const dbCategories = slugToCategoriesMap[category];
      if (!dbCategories) {
        return new Response('Category not found', { status: 404, headers: corsHeaders });
      }
      
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, question, created_at')
        .in('category', dbCategories)
        .order('created_at', { ascending: false });
      
      const entries: string[] = [];
      
      if (questions) {
        for (const q of questions) {
          const slug = createSlug(q.question);
          const lastmod = q.created_at ? q.created_at.split('T')[0] : today;
          entries.push(`  <url>
    <loc>${SITE_URL}/quiz/question/${q.id}/${escapeXml(slug)}</loc>
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
      
      console.log(`Generated ${category} sitemap with ${entries.length} URLs`);
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
