
import { supabase } from '@/integrations/supabase/client';

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

export const sitemapService = {
  /**
   * Generate a complete sitemap with all current content
   */
  generateCompleteSitemap: async (): Promise<string> => {
    console.log('Generating complete sitemap...');
    
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
        loc: 'https://cuiz.in/categories',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.9'
      },
      {
        loc: 'https://cuiz.in/blog',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: 'https://cuiz.in/faq',
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8'
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

    // Generate category URLs
    const categoryUrls = await sitemapService.generateCategoryUrls();
    standardUrls.push(...categoryUrls);

    // Generate FAQ URLs
    const faqUrls = await sitemapService.generateFaqUrls();
    standardUrls.push(...faqUrls);

    // Generate blog URLs
    const blogUrls = await sitemapService.generateBlogUrls();
    standardUrls.push(...blogUrls);

    // Generate question URLs
    const questionUrls = await sitemapService.generateQuestionUrls();
    standardUrls.push(...questionUrls);

    // Generate answer URLs
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

      // Get unique categories
      const uniqueCategories = [...new Set(questions.map(q => q.category))];
      
      return uniqueCategories.map(category => {
        const slug = encodeURIComponent(
          category.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
        );
        
        return {
          loc: `https://cuiz.in/categories/${slug}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.8'
        };
      });
    } catch (error) {
      console.error('Error generating category URLs:', error);
      return [];
    }
  },

  /**
   * Generate FAQ page URLs from database
   */
  generateFaqUrls: async (): Promise<SitemapEntry[]> => {
    try {
      const { data: faqs } = await supabase
        .from('faqs')
        .select('id, question, updated_at')
        .eq('is_published', true);

      if (!faqs) return [];

      return faqs.map(faq => {
        const slug = encodeURIComponent(
          faq.question
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100)
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
    } catch (error) {
      console.error('Error generating FAQ URLs:', error);
      return [];
    }
  },

  /**
   * Generate blog post URLs from database
   */
  generateBlogUrls: async (): Promise<SitemapEntry[]> => {
    try {
      const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('id, title, created_at, updated_at')
        .eq('is_published', true);

      if (!blogPosts) return [];

      return blogPosts.map(post => {
        const slug = encodeURIComponent(
          post.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100)
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

      return questions.map(question => {
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
        
        return {
          loc: `https://cuiz.in/quiz/question/${question.id}/${slug}`,
          lastmod: lastmod,
          changefreq: 'monthly',
          priority: '0.7'
        };
      });
    } catch (error) {
      console.error('Error generating question URLs:', error);
      return [];
    }
  },

  /**
   * Generate answer page URLs from database
   */
  generateAnswerUrls: async (): Promise<SitemapEntry[]> => {
    try {
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, question, options, created_at');

      if (!questions) return [];

      const answerUrls: SitemapEntry[] = [];
      
      questions.forEach(question => {
        const lastmod = question.created_at 
          ? new Date(question.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        if (question.options && Array.isArray(question.options)) {
          question.options.forEach((option: string) => {
            const optionSlug = encodeURIComponent(
              option
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 30)
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

      return answerUrls;
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
  },

  /**
   * Update the static sitemap file
   */
  updateStaticSitemap: async (): Promise<void> => {
    try {
      const sitemapXml = await sitemapService.generateCompleteSitemap();
      console.log('Generated sitemap XML, length:', sitemapXml.length);
      
      // In a real implementation, you would save this to your static files
      // For now, we'll log that it's been generated
      console.log('Sitemap updated successfully');
    } catch (error) {
      console.error('Error updating static sitemap:', error);
    }
  }
};
