
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import SEOMetaTags from '@/components/SEOMetaTags';
import StructuredData from '@/components/StructuredData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Tag, User, Share2, Clock } from 'lucide-react';

// Mock blog post data - in a real app, this would come from a database
const blogPosts = [
  {
    id: 1,
    slug: 'how-to-earn-monthly-income-by-playing-quizzes',
    title: 'How to Earn Monthly Income by Playing Quizzes',
    description: 'Learn strategies to maximize your earnings on quiz platforms and build sustainable monthly income through knowledge-based games.',
    content: `<p>The digital era has brought numerous opportunities to earn money online, and one of the most engaging ways is through quiz platforms like CuizIN. With the right strategies, consistency, and knowledge, you can build a steady monthly income stream. Here's how to make the most of quiz platforms:</p>
    
    <h2>Daily Consistency is Key</h2>
    <p>The foundation of earning through quizzes is consistency. Many platforms, including CuizIN, reward daily logins and participation. By maintaining a daily streak, you not only earn base points but also unlock multipliers that increase your earnings over time. Set aside 15-20 minutes each day to complete your daily quiz activities.</p>
    
    <h2>Master Multiple Categories</h2>
    <p>While it's tempting to stick to topics you're familiar with, expanding your knowledge across various categories can significantly boost your earnings. Platforms often offer bonus points for versatility. Take time to study and improve in categories you're less familiar with to maximize your correct answers across all subjects.</p>
    
    <h2>Leverage Referral Programs</h2>
    <p>Perhaps the most powerful way to increase your earnings is through referral programs. When you bring new active users to the platform, you earn a percentage of their activity. Build a team of dedicated quiz takers, and your passive income can grow substantially month after month.</p>
    
    <h2>Participate in Special Challenges</h2>
    <p>Most quiz platforms offer time-limited challenges with boosted rewards. These might require answering questions on specific topics, completing a set number of questions within a timeframe, or achieving certain accuracy levels. Always prioritize these special events as they often provide 2-3x the normal points.</p>
    
    <h2>Track and Optimize Your Performance</h2>
    <p>Keep a record of your quiz performance, noting which categories yield the highest points and which need improvement. Use this data to focus your learning efforts and maximize your correct answer rate, which directly impacts your earnings.</p>
    
    <h2>Withdrawal Strategies</h2>
    <p>Be strategic about when you withdraw your earnings. Some platforms offer bonuses for larger withdrawal amounts or for maintaining your balance for certain periods. Understand the withdrawal policies and optimize your cashout timing to maximize your returns.</p>
    
    <h2>Conclusion</h2>
    <p>Earning a reliable monthly income through quiz platforms requires strategy, consistency, and active participation. By implementing these approaches and continually refining your knowledge, you can transform what starts as a fun activity into a genuine source of monthly income. Start your journey today on CuizIN and watch your earnings grow month after month!</p>`,
    author: 'CuizIN Team',
    date: '2025-04-15',
    readTime: '5 min read',
    category: 'Earnings',
    tags: ['earnings', 'strategy', 'referrals', 'quiz tips'],
    relatedPosts: [2, 3]
  },
  {
    id: 2,
    slug: 'top-10-benefits-of-daily-quiz-challenges',
    title: 'Top 10 Benefits of Daily Quiz Challenges',
    description: 'Discover how daily quiz challenges can improve your cognitive abilities, expand your knowledge, and create opportunities for rewards.',
    // Content would be here in a real implementation
    author: 'Knowledge Expert',
    date: '2025-04-10',
    readTime: '7 min read',
    category: 'Knowledge',
    tags: ['benefits', 'daily challenges', 'cognitive improvement'],
    relatedPosts: [1, 4]
  },
  {
    id: 3,
    slug: 'building-your-quiz-team-referral-strategies',
    title: 'Building Your Quiz Team: Referral Strategies',
    description: 'Effective strategies to grow your referral network and maximize your team earnings through the CuizIN referral program.',
    // Content would be here in a real implementation
    author: 'Referral Expert',
    date: '2025-04-05',
    readTime: '6 min read',
    category: 'Referrals',
    tags: ['referrals', 'team building', 'earnings'],
    relatedPosts: [1, 2]
  },
  {
    id: 4,
    slug: 'science-behind-knowledge-retention-in-quizzes',
    title: 'The Science Behind Knowledge Retention in Quizzes',
    description: 'Explore how quiz-based learning helps with long-term knowledge retention and improves cognitive function.',
    // Content would be here in a real implementation
    author: 'Cognitive Scientist',
    date: '2025-03-28', 
    readTime: '8 min read',
    category: 'Education',
    tags: ['science', 'learning', 'memory'],
    relatedPosts: [2, 3]
  }
];

const BlogPostPage: React.FC = () => {
  const { blogSlug } = useParams<{ blogSlug: string }>();
  const [post, setPost] = useState<any | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  
  useEffect(() => {
    // In a real implementation, this would be a database fetch
    const foundPost = blogPosts.find(post => post.slug === blogSlug);
    setPost(foundPost || null);
    
    if (foundPost) {
      const related = blogPosts
        .filter(p => foundPost.relatedPosts.includes(p.id))
        .slice(0, 2);
      setRelatedPosts(related);
    }
  }, [blogSlug]);
  
  // Generate structured data for blog post
  const getStructuredData = () => {
    if (!post) return {};
    
    return {
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      image: `https://cuiz.in/blog-images/${post.slug}.jpg`,
      datePublished: post.date,
      author: {
        '@type': 'Person',
        name: post.author
      },
      publisher: {
        '@type': 'Organization',
        name: 'CuizIN',
        logo: {
          '@type': 'ImageObject',
          url: 'https://cuiz.in/og-image.png'
        }
      }
    };
  };
  
  // Handle social sharing
  const handleShare = () => {
    if (!post) return;
    
    const shareUrl = `https://cuiz.in/blog/${post.slug}`;
    
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: shareUrl,
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };
  
  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container max-w-4xl px-4 pt-24 pb-12">
          <Link to="/blog" className="inline-flex items-center text-sm mb-6 hover:text-primary">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Blog
          </Link>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Blog post not found.</p>
              <Button asChild className="mt-4">
                <Link to="/blog">Return to Blog</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMetaTags
        title={`${post.title} | CuizIN Blog`}
        description={post.description}
        keywords={post.tags.join(', ')}
        canonicalUrl={`https://cuiz.in/blog/${post.slug}`}
        ogImage={`/blog-images/${post.slug}.jpg`}
        ogType="article"
      />
      <StructuredData type="Article" data={getStructuredData()} />
      
      <Header />
      
      <main className="flex-1 container max-w-4xl px-4 pt-24 pb-12">
        <Link to="/blog" className="inline-flex items-center text-sm mb-6 hover:text-primary">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Blog
        </Link>
        
        <AdvertisementBanner position="top" slotId="blog-post-top" pageSection="blog-post" />
        
        <article className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                <span>{post.author}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{post.readTime}</span>
              </div>
              
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                <Link 
                  to={`/blog/category/${post.category.toLowerCase()}`}
                  className="hover:text-primary"
                >
                  {post.category}
                </Link>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 flex justify-between items-center mb-8">
              <p className="text-sm text-muted-foreground">
                Share this article with friends interested in earning through quizzes:
              </p>
              <Button 
                size="sm" 
                onClick={handleShare}
                className="flex items-center gap-1"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
          
          {/* In a real implementation, you would safely render HTML content with sanitization */}
          <div 
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          
          <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t">
            {post.tags.map((tag: string) => (
              <Link
                key={tag}
                to={`/blog/tag/${tag}`}
                className="text-xs bg-secondary px-3 py-1 rounded-full hover:bg-secondary/80"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </article>
        
        <AdvertisementBanner position="middle" slotId="blog-post-middle" pageSection="blog-post" className="my-8" />
        
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedPosts.map((related) => (
              <Card key={related.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <Link
                      to={`/blog/category/${related.category.toLowerCase()}`}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                    >
                      {related.category}
                    </Link>
                    <span className="text-xs text-muted-foreground">{related.readTime}</span>
                  </div>
                  
                  <Link to={`/blog/${related.slug}`}>
                    <h3 className="font-bold text-lg mb-2 hover:text-primary transition-colors">
                      {related.title}
                    </h3>
                  </Link>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {related.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {new Date(related.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    
                    <Link 
                      to={`/blog/${related.slug}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button asChild>
              <Link to="/blog">View All Articles</Link>
            </Button>
          </div>
        </section>
        
        <AdvertisementBanner position="bottom" slotId="blog-post-bottom" pageSection="blog-post" className="mt-12" />
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPostPage;
