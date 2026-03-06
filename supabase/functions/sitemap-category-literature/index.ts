import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const CATEGORY_SLUG = 'literature';
const DB_CATEGORIES = ['Art', 'Arts & Literature', 'Arts and Literature', 'Entertainment: Books'];

const supabaseUrl = 'https://pgywvtphfidouakypdno.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'public, max-age=600, s-maxage=600',
};

function createSlug(text: string, maxLength = 80): string {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').substring(0, maxLength);
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];
    const allQuestions: { id: string; question: string; created_at: string | null }[] = [];
    let offset = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase.from('quiz_questions').select('id, question, created_at').in('category', DB_CATEGORIES).range(offset, offset + pageSize - 1);
      if (error) { console.error('DB error:', error); return new Response('Error', { status: 500, headers: corsHeaders }); }
      if (data && data.length > 0) { allQuestions.push(...data); offset += pageSize; hasMore = data.length === pageSize; } else { hasMore = false; }
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const q of allQuestions) {
      const slug = createSlug(q.question);
      if (slug) xml += `  <url>\n    <loc>${escapeXml(`https://cuiz.in/quiz/question/${q.id}/${slug}`)}</loc>\n    <lastmod>${q.created_at?.split('T')[0] || today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }
    xml += '</urlset>';
    console.log(`sitemap-category-${CATEGORY_SLUG}: ${allQuestions.length} URLs`);
    return new Response(xml, { headers: corsHeaders });
  } catch (e) { console.error('Error:', e); return new Response('Error', { status: 500, headers: corsHeaders }); }
});
