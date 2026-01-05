import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'public, max-age=3600',
};

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

function createSlug(text: string, maxLength: number = 80): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, maxLength);
}

const validCategorySlugs = ['history', 'science', 'geography', 'literature', 'entertainment', 'sports', 'technology', 'general-knowledge'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];
    
    const urls: SitemapEntry[] = [
      { loc: 'https://cuiz.in/', lastmod: today, changefreq: 'daily', priority: '1.0' },
      { loc: 'https://cuiz.in/quiz', lastmod: today, changefreq: 'daily', priority: '0.9' },
      { loc: 'https://cuiz.in/categories', lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { loc: 'https://cuiz.in/blog', lastmod: today, changefreq: 'weekly', priority: '0.8' },
      { loc: 'https://cuiz.in/faq', lastmod: today, changefreq: 'weekly', priority: '0.8' },
      { loc: 'https://cuiz.in/referral-program', lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: 'https://cuiz.in/how-to-play', lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: 'https://cuiz.in/login', lastmod: today, changefreq: 'yearly', priority: '0.5' },
      { loc: 'https://cuiz.in/register', lastmod: today, changefreq: 'yearly', priority: '0.5' },
      { loc: 'https://cuiz.in/terms', lastmod: today, changefreq: 'yearly', priority: '0.3' },
      { loc: 'https://cuiz.in/disclaimer', lastmod: today, changefreq: 'yearly', priority: '0.3' },
      { loc: 'https://cuiz.in/privacy', lastmod: today, changefreq: 'yearly', priority: '0.3' }
    ];

    // Add category pages
    validCategorySlugs.forEach(slug => {
      urls.push({
        loc: `https://cuiz.in/categories/${slug}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.8'
      });
    });

    // Fetch blog posts
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, created_at')
      .eq('is_published', true);

    if (blogPosts) {
      blogPosts.forEach(post => {
        if (post.slug) {
          urls.push({
            loc: `https://cuiz.in/blog/${post.slug}`,
            lastmod: post.updated_at?.split('T')[0] || post.created_at?.split('T')[0] || today,
            changefreq: 'monthly',
            priority: '0.8'
          });
        }
      });
    }

    // Fetch FAQs
    const { data: faqs } = await supabase
      .from('faqs')
      .select('id, question, updated_at, created_at')
      .eq('is_published', true);

    if (faqs) {
      faqs.forEach(faq => {
        const slug = createSlug(faq.question, 60);
        if (slug) {
          urls.push({
            loc: `https://cuiz.in/faq/${faq.id}/${slug}`,
            lastmod: faq.updated_at?.split('T')[0] || faq.created_at?.split('T')[0] || today,
            changefreq: 'monthly',
            priority: '0.7'
          });
        }
      });
    }

    console.log(`Generated main sitemap with ${urls.length} URLs`);

    const xml = generateXml(urls);
    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    console.error('Error generating main sitemap:', error);
    return new Response('Error generating sitemap', { status: 500, headers: corsHeaders });
  }
});

function generateXml(entries: SitemapEntry[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  entries.forEach(entry => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
