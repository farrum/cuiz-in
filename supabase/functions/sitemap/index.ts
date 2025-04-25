
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'public, max-age=3600'
};

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Standard URLs including new pages
    const standardUrls: SitemapEntry[] = [
      {
        loc: 'https://cuiz.in/',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '1.0'
      },
      {
        loc: 'https://cuiz.in/quiz',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: 'https://cuiz.in/categories',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.9'
      },
      {
        loc: 'https://cuiz.in/blog',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8'
      },
      {
        loc: 'https://cuiz.in/faq',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8'
      }
    ];

    // Fetch all categories 
    const { data: categories } = await supabase
      .from('quiz_questions')
      .select('category')
      .is('category', 'not.null');
    
    if (categories) {
      // Get unique categories
      const uniqueCategories = [...new Set(categories.map(item => item.category))];
      
      // Create category URLs
      const categoryUrls = uniqueCategories.map(category => {
        const slug = encodeURIComponent(category.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'));
        return {
          loc: `https://cuiz.in/categories/${slug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.8'
        };
      });
      
      standardUrls.push(...categoryUrls);
    }

    // Fetch all FAQs
    const { data: faqs } = await supabase
      .from('faqs')
      .select('id, question, updated_at')
      .eq('is_published', true);

    if (faqs) {
      const faqUrls = faqs.map(faq => {
        const slug = encodeURIComponent(
          faq.question
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100) // Increased from 50
        );
        
        const lastMod = faq.updated_at 
          ? new Date(faq.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
          
        return {
          loc: `https://cuiz.in/faq/${faq.id}/${slug}`,
          lastmod: lastMod,
          changefreq: 'monthly',
          priority: '0.7'
        };
      });
      standardUrls.push(...faqUrls);
    }

    // Fetch all blog posts
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('id, title, created_at, updated_at')
      .eq('is_published', true);

    if (blogPosts) {
      const blogUrls = blogPosts.map(post => {
        const slug = encodeURIComponent(
          post.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100) // Increased from 50
        );
        
        const lastMod = post.updated_at 
          ? new Date(post.updated_at).toISOString().split('T')[0]
          : new Date(post.created_at).toISOString().split('T')[0];
          
        return {
          loc: `https://cuiz.in/blog/${post.id}/${slug}`,
          lastmod: lastMod,
          changefreq: 'monthly',
          priority: '0.8'
        };
      });
      standardUrls.push(...blogUrls);
    }

    // Fetch quiz questions with keywords
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('id, question, options, correct_answer, category, difficulty, created_at');

    if (error) {
      console.error('Error fetching quiz questions for sitemap:', error);
      return new Response(generateXml(standardUrls), {
        headers: corsHeaders,
      });
    }

    // Process questions and extract keywords
    const processedQuestions = questions.map((q: any) => {
      // Extract keywords from question text
      const keywords = extractKeywords(q.question);
      
      if (q.options && Array.isArray(q.options)) {
        q.options.forEach((option: string) => {
          keywords.push(...extractKeywords(option));
        });
      }
      
      // Add category and difficulty as keywords
      if (q.category) keywords.push(q.category.toLowerCase());
      if (q.difficulty) keywords.push(q.difficulty.toLowerCase());
      
      // Remove duplicates
      const uniqueKeywords = [...new Set(keywords)];
      
      return {
        ...q,
        keywords: uniqueKeywords
      };
    });

    // Create sitemap entries for each question and its answer
    const questionUrls: SitemapEntry[] = processedQuestions.map((question: any) => {
      const lastmod = question.created_at 
        ? new Date(question.created_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
        
      // Use a clean, SEO-friendly URL format with keywords
      const slug = encodeURIComponent(
        question.question
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
      );
      
      // Add keywords to URL
      const keywordString = question.keywords.slice(0, 3).join('-');
      
      return {
        loc: `https://cuiz.in/quiz/question/${question.id}/${slug}`,
        lastmod: lastmod,
        changefreq: 'monthly',
        priority: '0.7'
      };
    });

    // Create answer URLs for each question
    const answerUrls: SitemapEntry[] = [];
    
    processedQuestions.forEach((question: any) => {
      const lastmod = question.created_at 
        ? new Date(question.created_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const questionSlug = encodeURIComponent(
        question.question
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
      );
      
      // Create an entry for each possible answer option
      if (question.options && Array.isArray(question.options)) {
        question.options.forEach((option: string) => {
          const optionSlug = encodeURIComponent(
            option
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
          );
          
          answerUrls.push({
            loc: `https://cuiz.in/answer/${question.id}/${optionSlug}`,
            lastmod: lastmod,
            changefreq: 'monthly',
            priority: '0.6'
          });
        });
      }
    });

    // Combine all URLs
    const allUrls = [...standardUrls, ...questionUrls, ...answerUrls];
    
    // Generate XML
    const xml = generateXml(allUrls);

    // Return the XML with appropriate headers
    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500, headers: corsHeaders });
  }
});

// Function to extract keywords from text
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Remove special characters and split into words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter out words shorter than 4 characters
    
  // Remove common stop words
  const stopWords = ['this', 'that', 'these', 'those', 'with', 'from', 'about', 'have', 'what', 'which'];
  return words.filter(word => !stopWords.includes(word));
}

function generateXml(entries: SitemapEntry[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
  
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
