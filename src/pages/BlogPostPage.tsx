
import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import { Calendar, Clock, User, Share2, ChevronLeft, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Sample blog posts data - in a real app, this would come from a database
const blogPosts = [
  {
    id: 1,
    slug: 'how-to-maximize-your-quiz-earnings',
    title: 'How to Maximize Your Quiz Earnings on CuizIN',
    excerpt: 'Learn the top strategies for increasing your points and rewards when playing quizzes on CuizIN.',
    category: 'Tips & Tricks',
    date: '2025-04-15',
    author: 'Quiz Master',
    readTime: '5 min read',
    content: `
      <h2>Introduction</h2>
      <p>CuizIN offers various ways to earn points and rewards through quiz participation. This article explores proven strategies to maximize your earnings.</p>
      
      <h2>1. Maintain Daily Streaks</h2>
      <p>One of the most effective ways to boost your earnings is by maintaining a daily streak. CuizIN rewards consistency with multipliers that can significantly increase your point earnings.</p>
      <p>Try to log in and answer at least a few questions every day. Even on busy days, taking 5 minutes to answer a handful of questions can maintain your streak.</p>
      
      <h2>2. Focus on Accuracy</h2>
      <p>While answering questions quickly can be beneficial, accuracy is often more important. Correct answers earn substantially more points than fast but incorrect answers.</p>
      <p>Take your time to read questions thoroughly, especially in difficult categories. The extra few seconds spent can lead to higher earnings overall.</p>
      
      <h2>3. Complete Daily Challenges</h2>
      <p>Daily challenges offer bonus points beyond regular quizzes. These special quiz sets refresh every 24 hours and typically provide higher point values.</p>
      <p>Make completing daily challenges a part of your routine to maximize your earnings potential.</p>
      
      <h2>4. Leverage the Referral Program</h2>
      <p>CuizIN's referral program is a powerful way to boost your earnings without answering additional questions. You earn a percentage of points based on your referred friends' activities.</p>
      <p>Share your referral link with friends who might enjoy quiz games, and you'll both benefit from the arrangement.</p>
      
      <h2>5. Participate in Special Events</h2>
      <p>CuizIN regularly hosts special events and tournaments with increased rewards. These limited-time opportunities can significantly boost your earnings.</p>
      <p>Keep an eye on the news ticker and announcements for upcoming special events.</p>
      
      <h2>Conclusion</h2>
      <p>By implementing these strategies consistently, you can maximize your earnings on CuizIN. Remember that regular participation combined with strategic play will yield the best results over time.</p>
    `
  },
  // More blog posts would be here in a real implementation
];

const BlogPostPage: React.FC = () => {
  const { postSlug } = useParams<{ postSlug: string }>();
  
  // Find the blog post by slug
  const post = blogPosts.find(post => post.slug === postSlug);
  
  // If post not found, redirect to blog index
  if (!post) {
    return <Navigate to="/blog" replace />;
  }
  
  // Format date for display
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Generate schema.org BlogPosting structured data
  const blogPostSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'description': post.excerpt,
    'datePublished': post.date,
    'author': {
      '@type': 'Person',
      'name': post.author
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'CuizIN',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://cuiz.in/logo.png'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://cuiz.in/blog/${post.slug}`
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${post.title} | CuizIN Blog`}
        description={post.excerpt}
        canonicalUrl={`https://cuiz.in/blog/${post.slug}`}
        ogType="article"
        schemaType="WebPage"
        schemaData={blogPostSchema}
      />
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-4xl pt-12 pb-16 px-4">
        <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to all articles
        </Link>
        
        <article className="bg-card rounded-lg shadow-sm p-6 md:p-8">
          <header>
            <div className="text-sm text-primary font-medium mb-2">{post.category}</div>
            <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
            
            <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-4 mb-6">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {post.author}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formattedDate}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {post.readTime}
              </div>
            </div>
          </header>
          
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          
          <Separator className="my-8" />
          
          <footer>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Share this article
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </footer>
        </article>
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {blogPosts
              .filter(p => p.id !== post.id)
              .slice(0, 2)
              .map(relatedPost => (
                <Card key={relatedPost.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-sm text-muted-foreground mb-2">{relatedPost.category}</div>
                    <h3 className="text-xl font-semibold mb-2">
                      <Link to={`/blog/${relatedPost.slug}`} className="hover:text-primary transition-colors">
                        {relatedPost.title}
                      </Link>
                    </h3>
                    <p className="text-muted-foreground mb-4">{relatedPost.excerpt}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>{relatedPost.author}</span>
                      <span>{relatedPost.readTime}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPostPage;
