import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Content-Encoding': 'gzip',
  'Cache-Control': 'public, max-age=3600',
  'Vary': 'Accept-Encoding'
};

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

// Consistent slug generation function (must match frontend createSlug exactly)
function createSlug(text: string, maxLength: number = 80): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, maxLength);
}

// Map database category names to valid frontend slugs
// This MUST match the categoryMapping.ts in the frontend
const categoryToSlugMap: Record<string, string> = {
  'History': 'history',
  'Science': 'science',
  'Science & Nature': 'science',
  'Science &amp; Nature': 'science',
  'Nature': 'science',
  'Science: Computers': 'technology',
  'Science: Gadgets': 'technology',
  'Science: Mathematics': 'science',
  'Science and Technology': 'technology',
  'Science & Technology': 'technology',
  'Geography': 'geography',
  'Arts & Literature': 'literature',
  'Arts and Literature': 'literature',
  'Entertainment: Books': 'literature',
  'Entertainment': 'entertainment',
  'Entertainment: Video Games': 'entertainment',
  'Entertainment: Music': 'entertainment',
  'Entertainment: Film': 'entertainment',
  'Entertainment: Television': 'entertainment',
  'Entertainment: Board Games': 'entertainment',
  'Entertainment: Musicals &amp; Theatres': 'entertainment',
  'Entertainment: Japanese Anime &amp; Manga': 'entertainment',
  'Entertainment: Cartoon &amp; Animations': 'entertainment',
  'Entertainment: Comics': 'entertainment',
  'Celebrities': 'entertainment',
  'Art': 'entertainment',
  'Sports': 'sports',
  'Cricket': 'sports',
  'Vehicles': 'technology',
  'General Knowledge': 'general-knowledge',
  'Culture': 'general-knowledge',
  'Animals': 'general-knowledge',
  'Food & Drink': 'general-knowledge',
  'Food and Drinks': 'general-knowledge',
  'Mythology': 'general-knowledge',
  'Politics': 'global-politics',
  'Global Politics': 'global-politics',
  'Law': 'law-justice',
  'Law & Justice': 'law-justice',
  'Music': 'music',
  'Environment': 'environment-nature',
  'Environment & Nature': 'environment-nature',
  'Business': 'business-finance',
  'Business & Finance': 'business-finance',
  'Indian Mythology': 'indian-mythology',
  'Philosophy': 'philosophy',
  'Kids': 'kids-trivia',
  'Kids Corner': 'kids-trivia',
  'Guinness World Records': 'guinness-world-records',
};

// Valid frontend category slugs (only these will be included in sitemap)
const validCategorySlugs = [
  'history', 
  'science', 
  'geography', 
  'literature', 
  'entertainment', 
  'sports', 
  'technology', 
  'general-knowledge',
  'global-politics',
  'kids-trivia',
  'law-justice',
  'music',
  'environment-nature',
  'business-finance',
  'indian-mythology',
  'philosophy',
  'guinness-world-records'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const today = new Date().toISOString().split('T')[0];
    
    // Standard static URLs - all pages that actually exist
    const standardUrls: SitemapEntry[] = [
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

    // Add ONLY valid frontend category slugs (not raw DB categories)
    // This ensures no soft 404s from categories that don't have frontend pages
    validCategorySlugs.forEach(slug => {
      standardUrls.push({
        loc: `https://cuiz.in/categories/${slug}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.8'
      });
    });

    // Fetch all published blog posts - using slug field which matches route
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, created_at')
      .eq('is_published', true);

    if (blogPosts) {
      blogPosts.forEach(post => {
        if (post.slug) {
          const lastMod = post.updated_at 
            ? new Date(post.updated_at).toISOString().split('T')[0]
            : post.created_at 
              ? new Date(post.created_at).toISOString().split('T')[0]
              : today;
              
          standardUrls.push({
            loc: `https://cuiz.in/blog/${post.slug}`,
            lastmod: lastMod,
            changefreq: 'monthly',
            priority: '0.8'
          });
        }
      });
    }

    // Fetch all published FAQs for individual FAQ pages
    const { data: faqs } = await supabase
      .from('faqs')
      .select('id, question, updated_at, created_at')
      .eq('is_published', true);

    if (faqs) {
      faqs.forEach(faq => {
        const slug = createSlug(faq.question, 60);
        if (slug) {
          const lastMod = faq.updated_at 
            ? new Date(faq.updated_at).toISOString().split('T')[0]
            : faq.created_at 
              ? new Date(faq.created_at).toISOString().split('T')[0]
              : today;
              
          standardUrls.push({
            loc: `https://cuiz.in/faq/${faq.id}/${slug}`,
            lastmod: lastMod,
            changefreq: 'monthly',
            priority: '0.7'
          });
        }
      });
    }

    // Fetch quiz questions for question pages
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('id, question, category, correct_answer, created_at');

    if (error) {
      console.error('Error fetching quiz questions for sitemap:', error);
      return new Response(await compressGzip(generateXml(standardUrls)), {
        headers: corsHeaders,
      });
    }

    // Create sitemap entries for each question (exclude answers - they have noindex)
    const questionUrls: SitemapEntry[] = [];
    
    if (questions) {
      questions.forEach((question: any) => {
        const lastmod = question.created_at 
          ? new Date(question.created_at).toISOString().split('T')[0]
          : today;
          
        const questionSlug = createSlug(question.question);
        
        if (questionSlug) {
          const catSlug = categoryToSlugMap[question.category] || 'general-knowledge';
          // Question page URL only - Answer pages have noindex meta tags
          // to focus Google's crawl budget on high-value question pages
          questionUrls.push({
            loc: `https://cuiz.in/quiz/question/${question.id}/${catSlug}/${questionSlug}`,
            lastmod: lastmod,
            changefreq: 'monthly',
            priority: '0.7'
          });
        }
      });
    }

    // Combine all URLs (no answer URLs - they have noindex)
    const allUrls = [...standardUrls, ...questionUrls];
    
    console.log(`Generated sitemap with ${allUrls.length} URLs`);
    
    // Generate XML
    const xml = generateXml(allUrls);

    // Compress with gzip
    const compressedXml = await compressGzip(xml);

    // Return the compressed XML with appropriate headers
    return new Response(compressedXml, { headers: corsHeaders });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500, headers: corsHeaders });
  }
});

// Function to compress content with gzip
async function compressGzip(content: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    }
  });
  
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const reader = compressedStream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  // Combine all chunks into a single Uint8Array
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

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

// Escape special XML characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
