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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { path: '/', pri: '1.0', freq: 'daily' },
      { path: '/quiz', pri: '0.9', freq: 'daily' },
      { path: '/categories', pri: '0.9', freq: 'weekly' },
      { path: '/all-questions', pri: '0.9', freq: 'daily' },
      { path: '/browse', pri: '0.8', freq: 'daily' },
      { path: '/blog', pri: '0.8', freq: 'weekly' },
      { path: '/faq', pri: '0.8', freq: 'weekly' },
      { path: '/topics', pri: '0.7', freq: 'weekly' },
      { path: '/referral-program', pri: '0.7', freq: 'monthly' },
      { path: '/how-to-play', pri: '0.7', freq: 'monthly' },
      { path: '/login', pri: '0.5', freq: 'yearly' },
      { path: '/register', pri: '0.5', freq: 'yearly' },
      { path: '/terms', pri: '0.3', freq: 'yearly' },
      { path: '/disclaimer', pri: '0.3', freq: 'yearly' },
      { path: '/privacy', pri: '0.3', freq: 'yearly' },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const p of staticPages) {
      xml += `  <url>\n    <loc>${escapeXml(`https://cuiz.in${p.path}`)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.pri}</priority>\n  </url>\n`;
    }
    
    for (const slug of validCategories) {
      xml += `  <url>\n    <loc>${escapeXml(`https://cuiz.in/categories/${slug}`)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    const { data: blogs } = await supabase.from('blog_posts').select('slug, updated_at, created_at').eq('is_published', true);
    if (blogs) {
      for (const b of blogs) {
        if (!b.slug) continue;
        xml += `  <url>\n    <loc>${escapeXml(`https://cuiz.in/blog/${b.slug}`)}</loc>\n    <lastmod>${b.updated_at?.split('T')[0] || b.created_at?.split('T')[0] || today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
    }

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
    console.log(`Sitemap main: ${urlCount} URLs`);
    return new Response(xml, { headers });

  } catch (error) {
    console.error('Sitemap error:', error);
    return new Response('Error generating sitemap', { status: 500, headers });
  }
});
