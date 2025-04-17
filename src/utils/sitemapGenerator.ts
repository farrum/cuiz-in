import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/utils/quizData';

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

export const generateSitemapXml = async (): Promise<string> => {
  // Standard site URLs with updated priorities for new content pages
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
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      loc: 'https://cuiz.in/referral',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.8'
    },
    {
      loc: 'https://cuiz.in/profile',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
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
      loc: 'https://cuiz.in/faq',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      loc: 'https://cuiz.in/faq/how-to-play',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.7'
    },
    {
      loc: 'https://cuiz.in/faq/points-system',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.7'
    },
    {
      loc: 'https://cuiz.in/blog',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: '0.9'
    },
    {
      loc: 'https://cuiz.in/blog/categories',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      loc: 'https://cuiz.in/categories',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      loc: 'https://cuiz.in/categories/history',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      loc: 'https://cuiz.in/categories/science',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      loc: 'https://cuiz.in/categories/geography',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      loc: 'https://cuiz.in/categories/literature',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      loc: 'https://cuiz.in/categories/entertainment',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      loc: 'https://cuiz.in/categories/sports',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      loc: 'https://cuiz.in/categories/technology',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      loc: 'https://cuiz.in/categories/general-knowledge',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8'
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
    }
  ];

  // Fetch all FAQs to generate individual FAQ URLs
  const { data: faqs } = await supabase
    .from('faqs')
    .select('id, question')
    .eq('is_published', true);

  if (faqs) {
    const faqUrls: SitemapEntry[] = faqs.map(faq => {
      const slug = encodeURIComponent(
        faq.question
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50)
      );
      
      return {
        loc: `https://cuiz.in/faq/${faq.id}/${slug}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.7'
      };
    });
    standardUrls.push(...faqUrls);
  }

  // Fetch all blog posts
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('id, title, created_at')
    .eq('is_published', true);

  if (blogPosts) {
    const blogUrls: SitemapEntry[] = blogPosts.map(post => {
      const slug = encodeURIComponent(
        post.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50)
      );
      
      return {
        loc: `https://cuiz.in/blog/${slug}`,
        lastmod: new Date(post.created_at).toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.8'
      };
    });
    standardUrls.push(...blogUrls);
  }

  // Fetch quiz questions and generate answer URLs
  const { data: questions, error } = await supabase
    .from('quiz_questions')
    .select('id, question, options, correct_answer, category, difficulty, created_at');

  if (error) {
    console.error('Error fetching quiz questions for sitemap:', error);
    return generateXml(standardUrls);
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
      changefreq: 'monthly',
      priority: '0.7'
    };
  });

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
  const allUrls = [...standardUrls, ...questionUrls, ...answerUrls];
  
  // Generate XML
  return generateXml(allUrls);
};

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
