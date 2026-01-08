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

// Consistent slug generation function
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

// Escape special XML characters
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
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];
    const ampBaseUrl = 'https://pgywvtphfidouakypdno.supabase.co/functions/v1/amp-question';

    // Fetch all quiz questions for AMP pages
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('id, question, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quiz questions for AMP sitemap:', error);
      throw error;
    }

    // Generate AMP sitemap XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    if (questions) {
      questions.forEach((question: any) => {
        const lastmod = question.created_at 
          ? new Date(question.created_at).toISOString().split('T')[0]
          : today;

        // AMP URL format: /amp-question/{questionId}
        xml += '  <url>\n';
        xml += `    <loc>${escapeXml(`${ampBaseUrl}/${question.id}`)}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.6</priority>\n';
        xml += '  </url>\n';
      });
    }

    xml += '</urlset>';

    console.log(`Generated AMP sitemap with ${questions?.length || 0} URLs`);

    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    console.error('Error generating AMP sitemap:', error);
    return new Response('Error generating AMP sitemap', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
