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

// Map frontend slug to database categories
const slugToCategoriesMap: Record<string, string[]> = {
  'history': ['History'],
  'science': ['Science', 'Science & Nature', 'Science &amp; Nature', 'Nature', 'Science: Mathematics'],
  'geography': ['Geography'],
  'literature': ['Arts & Literature', 'Arts and Literature', 'Entertainment: Books'],
  'entertainment': [
    'Entertainment', 'Entertainment: Video Games', 'Entertainment: Music', 
    'Entertainment: Film', 'Entertainment: Television', 'Entertainment: Board Games',
    'Entertainment: Musicals &amp; Theatres', 'Entertainment: Japanese Anime &amp; Manga',
    'Entertainment: Cartoon &amp; Animations', 'Entertainment: Comics', 'Celebrities', 'Art'
  ],
  'sports': ['Sports', 'Cricket'],
  'technology': ['Science: Computers', 'Science: Gadgets', 'Science and Technology', 'Science & Technology', 'Vehicles'],
  'general-knowledge': ['General Knowledge', 'Culture', 'Animals', 'Food & Drink', 'Food and Drinks', 'Mythology', 'Politics'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const categorySlug = url.searchParams.get('category') || 'general-knowledge';
    
    const dbCategories = slugToCategoriesMap[categorySlug] || ['General Knowledge'];
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch questions for this category
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('id, question, created_at')
      .in('category', dbCategories);

    if (error) {
      console.error('Error fetching questions:', error);
      return new Response('Error fetching questions', { status: 500, headers: corsHeaders });
    }

    const urls: SitemapEntry[] = [];
    
    if (questions) {
      questions.forEach(question => {
        const slug = createSlug(question.question);
        if (slug) {
          urls.push({
            loc: `https://cuiz.in/quiz/question/${question.id}/${slug}`,
            lastmod: question.created_at?.split('T')[0] || today,
            changefreq: 'monthly',
            priority: '0.7'
          });
        }
      });
    }

    console.log(`Generated ${categorySlug} sitemap with ${urls.length} question URLs`);

    const xml = generateXml(urls);
    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    console.error('Error generating category sitemap:', error);
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
