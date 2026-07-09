import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import { Calendar, Clock, User, Share2, ChevronLeft, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { blogPosts } from '@/utils/blogData';
import { supabase } from '@/integrations/supabase/client';

const BlogPostPage: React.FC = () => {
  const { postSlug } = useParams<{ postSlug: string }>();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadPost() {
      try {
        setIsLoading(true);
        // Try fetching from database first
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', postSlug)
          .eq('is_published', true)
          .maybeSingle();

        if (!error && data) {
          setPost({
            id: data.id,
            slug: data.slug,
            title: data.title,
            excerpt: data.excerpt || '',
            category: data.category || 'General',
            date: data.published_at ? data.published_at.split('T')[0] : data.created_at ? data.created_at.split('T')[0] : '',
            author: data.author || 'CuizIN Team',
            readTime: (data as any).read_time || '5 min read',
            content: data.content || ''
          });
        } else {
          // Fall back to static blogPosts
          const staticPost = blogPosts.find(p => p.slug === postSlug);
          if (staticPost) {
            setPost(staticPost);
          } else {
            setPost(null);
          }
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        // Fallback on exception
        const staticPost = blogPosts.find(p => p.slug === postSlug);
        if (staticPost) {
          setPost(staticPost);
        } else {
          setPost(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (postSlug) {
      loadPost();
    }
  }, [postSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <NewsTicker className="mt-16" />
        <main className="flex-grow flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground text-sm">Loading article...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
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

  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.blog(),
    createBreadcrumbs.custom(post.title.substring(0, 40) + (post.title.length > 40 ? '...' : ''), `/blog/${post.slug}`)
  ];

  // Ensure meta description is 150-160 chars for SEO (Bing flags shorter ones)
  const rawExcerpt = (post.excerpt || '').replace(/\.\.\.$/, '').trim();
  const plainContent = (post.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  let metaDescription = rawExcerpt;
  if (metaDescription.length < 150 && plainContent) {
    const remaining = plainContent.slice(rawExcerpt.length);
    metaDescription = (rawExcerpt + ' ' + remaining).trim();
  }
  metaDescription = metaDescription.length > 160
    ? metaDescription.substring(0, 157).trim() + '...'
    : metaDescription;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${post.title} | CuizIN Blog`}
        description={metaDescription}
        canonicalUrl={`https://cuiz.in/blog/${post.slug}`}
        ogType="article"
        schemaType="WebPage"
        schemaData={blogPostSchema}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-4xl pt-12 pb-16 px-4">
        {/* Visual Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/blog">Blog</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{post.title.substring(0, 30)}...</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Top Ad Banner */}
        <div className="mb-6">
          <SimpleAdBanner position="header" />
        </div>
        
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
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }}
          />
          
          {/* Middle Ad Banner */}
          <div className="my-8">
            <SimpleAdBanner position="content" />
          </div>
          
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

        {/* Internal Links Section */}
        <section className="mt-12 p-6 bg-muted/30 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Explore CuizIN</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link to="/quiz" className="block p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors">
              <h3 className="font-medium text-primary mb-1">Play Quiz</h3>
              <p className="text-sm text-muted-foreground">Test your knowledge now</p>
            </Link>
            <Link to="/categories" className="block p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors">
              <h3 className="font-medium text-primary mb-1">Browse Categories</h3>
              <p className="text-sm text-muted-foreground">Find quizzes by topic</p>
            </Link>
            <Link to="/faq" className="block p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors">
              <h3 className="font-medium text-primary mb-1">FAQ</h3>
              <p className="text-sm text-muted-foreground">Get answers to your questions</p>
            </Link>
          </div>
        </section>
        
        {/* Bottom Ad Banner */}
        <div className="mt-12">
          <SimpleAdBanner position="footer" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPostPage;
