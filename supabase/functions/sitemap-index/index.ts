declare const Deno: any;
// @ts-ignore: Deno specific URL import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'public, max-age=3600',
};

// Map of raw DB categories to URL slugs
// This helps ensure we generate clean URLs even if DB categories have spaces/special chars
function createSlug(text: string): string {
  if (!text) return '';
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

Deno.serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];
    const baseUrl = 'https://cuiz.in';

    // Fetch all unique categories from the quiz_questions table with pagination to ensure we get all of them
    const allCategoriesSet = new Set<string>();
    let offset = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: categoryData, error } = await supabase
        .from('quiz_questions')
        .select('category')
        .not('category', 'is', null)
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      
      if (categoryData && categoryData.length > 0) {
        categoryData.forEach((q: any) => {
          if (q.category) allCategoriesSet.add(createSlug(q.category));
        });
        offset += pageSize;
        hasMore = categoryData.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    const uniqueCategories = Array.from(allCategoriesSet).filter(Boolean);

    // Generate sitemap index XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Main sitemap for static pages
    xml += '  <sitemap>\n';
    xml += `    <loc>${baseUrl}/sitemap-main.xml</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '  </sitemap>\n';
    
    // Dynamic category sitemaps
    for (const category of uniqueCategories) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${baseUrl}/sitemap-cat-${category}.xml</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }
    
    // AMP sitemap
    xml += '  <sitemap>\n';
    xml += `    <loc>${baseUrl}/sitemap-amp.xml</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '  </sitemap>\n';
    
    xml += '</sitemapindex>';

    console.log(`Generated dynamic sitemap index with ${uniqueCategories.length} category sitemaps`);
    return new Response(xml, { headers: corsHeaders });
    
    // AMP sitemap for all AMP question pages
    xml += '  <sitemap>\n';
    xml += `    <loc>${baseUrl}/sitemap-amp.xml</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '  </sitemap>\n';
    
    xml += '</sitemapindex>';

    console.log(`Generated sitemap index with ${categories.length + 1} sitemaps using cuiz.in URLs`);

    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    return new Response('Error generating sitemap index', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
