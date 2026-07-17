import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

const BlogPage: React.FC = () => {
  const [displayPosts, setDisplayPosts] = useState<any[]>(blogPosts);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadBlogs() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false });

        if (!error && data) {
          const dbPosts = data.map((b: any) => ({
            id: b.id,
            slug: b.slug,
            title: b.title,
            excerpt: b.excerpt || '',
            category: b.category || 'General',
            date: b.published_at ? b.published_at.split('T')[0] : b.created_at ? b.created_at.split('T')[0] : '',
            author: b.author || 'CuizIN Team',
            readTime: b.read_time || '5 min read',
            content: b.content || ''
          }));

          // Merge database posts and static posts
          // De-duplicate by slug, favoring database version
          const merged = [...dbPosts];
          const dbSlugs = new Set(dbPosts.map(p => p.slug));

          blogPosts.forEach(sp => {
            if (!dbSlugs.has(sp.slug)) {
              merged.push(sp);
            }
          });

          // Sort by date desc
          merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setDisplayPosts(merged);
        }
      } catch (err) {
        console.error('Error fetching dynamic blogs:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBlogs();
  }, []);

  // Schema.org Blog structured data
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'name': 'CuizIN Blog',
    'description': 'Articles, tips, and guides about quizzes, learning strategies, and earning rewards on CuizIN.',
    'url': 'https://cuiz.in/blog',
    'blogPost': displayPosts.map(post => ({
      '@type': 'BlogPosting',
      'headline': post.title,
      'description': post.excerpt,
      'datePublished': post.date,
      'author': {
        '@type': 'Person',
        'name': post.author
      },
      'url': `https://cuiz.in/blog/${post.slug}`
    }))
  };

  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.blog()
  ];

  return (
    <PageLayout showNewsTicker containerClassName="container max-w-6xl pt-12 pb-16 px-4">
      <SEO
        title="Quiz Knowledge Blog | CuizIN"
        description="Discover articles, tips, and guides about quiz strategies, learning techniques, and how to maximize your rewards on CuizIN."
        canonicalUrl="https://cuiz.in/blog"
        ogType="website"
        schemaType="WebPage"
        schemaData={blogSchema}
      />
      <BreadcrumbSchema items={breadcrumbs} />

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
              <BreadcrumbPage>Blog</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Top Ad Banner */}
        <div className="mb-8">
          <SimpleAdBanner position="header" />
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">CuizIN Blog</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Articles, tips, and guides to help you improve your quiz skills and maximize your rewards
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayPosts.map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="block group">
              <Card 
                className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col border border-border bg-card text-card-foreground" 
              >
                <CardHeader className="pb-2">
                  <div className="text-sm text-muted-foreground mb-2">{post.category} • {post.date}</div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className="text-base">{post.excerpt}</CardDescription>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">{post.author}</span>
                  <span className="text-sm text-muted-foreground">{post.readTime}</span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
        
        {/* Middle Ad Banner */}
        <div className="my-12">
          <SimpleAdBanner position="content" />
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            to="/categories" 
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 mr-4"
          >
            Browse by Category
          </Link>
          <Link 
            to="/faq" 
            className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2"
          >
            View FAQ
          </Link>
        </div>
    </PageLayout>
  );
};

export default BlogPage;
