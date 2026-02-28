import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
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

// Sample blog data - in a real app, this would come from a database
const blogPosts = [
  {
    id: 1,
    slug: 'how-to-maximize-your-quiz-points',
    title: 'How to Maximize Your Quiz Points on CuizIN',
    excerpt: 'Learn the top strategies for increasing your points when playing quizzes on CuizIN.',
    category: 'Tips & Tricks',
    date: '2025-04-15',
    author: 'Quiz Master',
    readTime: '5 min read'
  },
  {
    id: 2,
    slug: 'benefits-of-daily-quiz-challenges',
    title: 'The Benefits of Completing Daily Quiz Challenges',
    excerpt: 'Discover why daily challenges are the best way to boost your knowledge and earn more rewards.',
    category: 'Guides',
    date: '2025-04-10',
    author: 'Quiz Expert',
    readTime: '4 min read'
  },
  {
    id: 3,
    slug: 'science-behind-quiz-learning',
    title: 'The Science Behind Learning Through Quizzes',
    excerpt: 'Research shows that quiz-based learning enhances memory retention and cognitive capabilities.',
    category: 'Education',
    date: '2025-04-05',
    author: 'Dr. Quiz',
    readTime: '7 min read'
  },
  {
    id: 4,
    slug: 'building-quiz-streaks',
    title: 'The Power of Building Quiz Streaks',
    excerpt: 'How maintaining a consistent quiz streak can exponentially increase your points and knowledge.',
    category: 'Strategy',
    date: '2025-03-28',
    author: 'Streak Master',
    readTime: '6 min read'
  }
];

const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Function to handle blog post click navigation
  const handlePostClick = (slug: string) => {
    navigate(`/blog/${slug}`);
  };

  // Schema.org Blog structured data
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    'name': 'CuizIN Blog',
    'description': 'Articles, tips, and guides about quizzes, learning strategies, and earning rewards on CuizIN.',
    'url': 'https://cuiz.in/blog',
    'blogPost': blogPosts.map(post => ({
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
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Quiz Knowledge Blog | CuizIN"
        description="Discover articles, tips, and guides about quiz strategies, learning techniques, and how to maximize your rewards on CuizIN."
        canonicalUrl="https://cuiz.in/blog"
        ogType="website"
        schemaType="WebPage"
        schemaData={blogSchema}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-6xl pt-12 pb-16 px-4">
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
          {blogPosts.map(post => (
            <Card 
              key={post.id} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => handlePostClick(post.slug)}
            >
              <CardHeader className="pb-2">
                <div className="text-sm text-muted-foreground mb-2">{post.category} • {post.date}</div>
                <CardTitle className="text-xl">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{post.excerpt}</CardDescription>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">{post.author}</span>
                <span className="text-sm text-muted-foreground">{post.readTime}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {/* Middle Ad Banner */}
        <div className="my-12">
          <SimpleAdBanner position="content" />
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            to="/blog/categories" 
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 mr-4"
          >
            Browse by Category
          </Link>
          <Link 
            to="/blog/archive" 
            className="inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2"
          >
            View Archive
          </Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPage;
