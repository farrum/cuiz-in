
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://pgywvtphfidouakypdno.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

serve(async (req) => {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'max-age=3600'
    };
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Standard site URLs
    const standardUrls: SitemapEntry[] = [
      {
        loc: 'https://cuiz.in/',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        loc: 'https://cuiz.in/quiz',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: 'https://cuiz.in/referral',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        loc: 'https://cuiz.in/profile',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        loc: 'https://cuiz.in/login',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.7'
      },
      {
        loc: 'https://cuiz.in/register',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.7'
      },
      {
        loc: 'https://cuiz.in/how-to-play',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.6'
      },
      {
        loc: 'https://cuiz.in/terms',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'yearly',
        priority: '0.5'
      },
      {
        loc: 'https://cuiz.in/disclaimer',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'yearly',
        priority: '0.5'
      },
      {
        loc: 'https://cuiz.in/privacy',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'yearly',
        priority: '0.5'
      },
      {
        loc: 'https://cuiz.in/blog',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        loc: 'https://cuiz.in/categories',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.7'
      }
    ];

    // Fetch all quiz questions from the database
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('id, question, options, correct_answer, category, difficulty, created_at');

    if (error) {
      console.error('Error fetching quiz questions for sitemap:', error);
      return new Response(generateXml(standardUrls), {
        headers: corsHeaders
      });
    }

    // Create sitemap entries for each question and its answer
    const questionUrls: SitemapEntry[] = questions.map((question: any) => {
      const lastmod = question.created_at 
        ? new Date(question.created_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
        
      // Use a clean, SEO-friendly URL format
      const slug = encodeURIComponent(
        question.question
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50)
      );
      
      return {
        loc: `https://cuiz.in/quiz/question/${question.id}/${slug}`,
        lastmod: lastmod,
        changefreq: 'weekly',
        priority: '0.7'
      };
    });

    // Create category pages URLs
    const categories = [...new Set(questions.map((q: any) => q.category))];
    const categoryUrls: SitemapEntry[] = categories.map(category => {
      if (!category) return null;
      
      const slug = encodeURIComponent(
        String(category)
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
      );
      
      return {
        loc: `https://cuiz.in/categories/${slug}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.7'
      };
    }).filter(Boolean) as SitemapEntry[];

    // Create answer URLs for each question
    const answerUrls: SitemapEntry[] = questions.flatMap((question: any) => {
      const lastmod = question.created_at 
        ? new Date(question.created_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const slug = encodeURIComponent(
        question.question
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50)
      );
      
      // Create an entry for each possible answer option
      return (question.options || []).map((option: string) => {
        const optionSlug = encodeURIComponent(
          option
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 30)
        );
        
        return {
          loc: `https://cuiz.in/answer/${question.id}/${optionSlug}`,
          lastmod: lastmod,
          changefreq: 'monthly',
          priority: '0.6'
        };
      });
    });

    // Combine all URLs
    const allUrls = [...standardUrls, ...categoryUrls, ...questionUrls, ...answerUrls];
    
    // Generate XML
    const xml = generateXml(allUrls);

    // Return the XML with appropriate headers
    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});

function generateXml(entries: SitemapEntry[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  entries.forEach(entry => {
    xml += '  <url>\n';
    xml += `    <loc>${entry.loc}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  return xml;
}
