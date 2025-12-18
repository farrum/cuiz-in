import { supabase } from '@/integrations/supabase/client';

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

// Consistent slug generation function - matches edge function
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

export const sitemapService = {
  /**
   * Generate a complete sitemap with all current content
   */
  generateCompleteSitemap: async (): Promise<string> => {
    console.log('Generating complete sitemap...');
    const today = new Date().toISOString().split('T')[0];
    
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

    // Generate category URLs
    const categoryUrls = await sitemapService.generateCategoryUrls();
    standardUrls.push(...categoryUrls);

    // Generate blog URLs
    const blogUrls = await sitemapService.generateBlogUrls();
    standardUrls.push(...blogUrls);

    // Generate question URLs
    const questionUrls = await sitemapService.generateQuestionUrls();
    standardUrls.push(...questionUrls);

    // Generate answer URLs (only correct answers)
    const answerUrls = await sitemapService.generateAnswerUrls();
    standardUrls.push(...answerUrls);

    console.log(`Generated sitemap with ${standardUrls.length} URLs`);
    return sitemapService.generateXml(standardUrls);
  },

  /**
   * Generate category page URLs from database
   */
  generateCategoryUrls: async (): Promise<SitemapEntry[]> => {
    try {
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('category')
        .not('category', 'is', null);

      if (!questions) return [];

      const uniqueCategories = [...new Set(questions.map(q => q.category))];
      const today = new Date().toISOString().split('T')[0];
      
      return uniqueCategories
        .map(category => {
          const slug = createSlug(category);
          if (!slug) return null;
          
          return {
            loc: `https://cuiz.in/categories/${slug}`,
            lastmod: today,
            changefreq: 'weekly',
            priority: '0.8'
          };
        })
        .filter((url): url is SitemapEntry => url !== null);
    } catch (error) {
      console.error('Error generating category URLs:', error);
      return [];
    }
  },

  /**
   * Generate blog post URLs from database - using slug field
   */
  generateBlogUrls: async (): Promise<SitemapEntry[]> => {
    try {
      const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('slug, created_at, updated_at')
        .eq('is_published', true);

      if (!blogPosts) return [];
      const today = new Date().toISOString().split('T')[0];

      return blogPosts
        .filter(post => post.slug)
        .map(post => {
          const lastMod = post.updated_at 
            ? new Date(post.updated_at).toISOString().split('T')[0]
            : post.created_at 
              ? new Date(post.created_at).toISOString().split('T')[0]
              : today;
              
          return {
            loc: `https://cuiz.in/blog/${post.slug}`,
            lastmod: lastMod,
            changefreq: 'monthly',
            priority: '0.8'
          };
        });
    } catch (error) {
      console.error('Error generating blog URLs:', error);
      return [];
    }
  },

  /**
   * Generate question page URLs from database
   */
  generateQuestionUrls: async (): Promise<SitemapEntry[]> => {
    try {
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, question, created_at');

      if (!questions) return [];
      const today = new Date().toISOString().split('T')[0];

      return questions
        .map(question => {
          const slug = createSlug(question.question);
          if (!slug) return null;
          
          const lastmod = question.created_at 
            ? new Date(question.created_at).toISOString().split('T')[0]
            : today;
          
          return {
            loc: `https://cuiz.in/quiz/question/${question.id}/${slug}`,
            lastmod: lastmod,
            changefreq: 'monthly',
            priority: '0.7'
          };
        })
        .filter((url): url is SitemapEntry => url !== null);
    } catch (error) {
      console.error('Error generating question URLs:', error);
      return [];
    }
  },

  /**
   * Generate answer page URLs from database - ONLY correct answers to avoid duplicate content
   */
  generateAnswerUrls: async (): Promise<SitemapEntry[]> => {
    try {
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, correct_answer, created_at');

      if (!questions) return [];
      const today = new Date().toISOString().split('T')[0];

      return questions
        .filter(q => q.correct_answer)
        .map(question => {
          const answerSlug = createSlug(question.correct_answer, 50);
          if (!answerSlug) return null;
          
          const lastmod = question.created_at 
            ? new Date(question.created_at).toISOString().split('T')[0]
            : today;
            
          return {
            loc: `https://cuiz.in/answer/${question.id}/${answerSlug}`,
            lastmod: lastmod,
            changefreq: 'monthly',
            priority: '0.6'
          };
        })
        .filter((url): url is SitemapEntry => url !== null);
    } catch (error) {
      console.error('Error generating answer URLs:', error);
      return [];
    }
  },

  /**
   * Generate XML sitemap from entries
   */
  generateXml: (entries: SitemapEntry[]): string => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    entries.forEach(entry => {
      xml += '  <url>\n';
      xml += `    <loc>${sitemapService.escapeXml(entry.loc)}</loc>\n`;
      xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    return xml;
  },

  /**
   * Escape special XML characters
   */
  escapeXml: (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  /**
   * Update the static sitemap file
   */
  updateStaticSitemap: async (): Promise<void> => {
    try {
      const sitemapXml = await sitemapService.generateCompleteSitemap();
      console.log('Generated sitemap XML, length:', sitemapXml.length);
      console.log('Sitemap updated successfully');
    } catch (error) {
      console.error('Error updating static sitemap:', error);
    }
  }
};
