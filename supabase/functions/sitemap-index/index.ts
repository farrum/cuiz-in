import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'public, max-age=3600',
};

// Valid frontend category slugs
const categories = [
  'history',
  'science', 
  'geography',
  'literature',
  'entertainment',
  'sports',
  'technology',
  'general-knowledge'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    // Use canonical cuiz.in URLs to avoid cross-domain sitemap issues
    const baseUrl = 'https://cuiz.in';

    // Generate sitemap index XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Main sitemap for static pages, blog, and FAQs
    xml += '  <sitemap>\n';
    xml += `    <loc>${baseUrl}/sitemap-main.xml</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '  </sitemap>\n';
    
    // Category-specific sitemaps for questions
    for (const category of categories) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${baseUrl}/sitemap-category-${category}.xml</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }
    
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
