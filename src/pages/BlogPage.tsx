
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import SEOMetaTags from '@/components/SEOMetaTags';
import StructuredData from '@/components/StructuredData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Mock blog posts - in a real implementation, these would come from a database
const blogPosts = [
  {
    id: 1,
    title: 'How to Earn Monthly Income by Playing Quizzes',
    description: 'Learn strategies to maximize your earnings on quiz platforms and build sustainable monthly income through knowledge-based games.',
    slug: 'how-to-earn-monthly-income-by-playing-quizzes',
    date: '2025-04-15',
    category: 'Earnings',
    readTime: '5 min read'
  },
  {
    id: 2,
    title: 'Top 10 Benefits of Daily Quiz Challenges',
    description: 'Discover how daily quiz challenges can improve your cognitive abilities, expand your knowledge, and create opportunities for rewards.',
    slug: 'top-10-benefits-of-daily-quiz-challenges',
    date: '2025-04-10',
    category: 'Knowledge',
    readTime: '7 min read'
  },
  {
    id: 3,
    title: 'Building Your Quiz Team: Referral Strategies',
    description: 'Effective strategies to grow your referral network and maximize your team earnings through the CuizIN referral program.',
    slug: 'building-your-quiz-team-referral-strategies',
    date: '2025-04-05',
    category: 'Referrals',
    readTime: '6 min read'
  },
  {
    id: 4,
    title: 'The Science Behind Knowledge Retention in Quizzes',
    description: 'Explore how quiz-based learning helps with long-term knowledge retention and improves cognitive function.',
    slug: 'science-behind-knowledge-retention-in-quizzes',
    date: '2025-03-28',
    category: 'Education',
    readTime: '8 min read'
  }
];

const BlogPage: React.FC = () => {
  // Generate structured data for the blog collection
  const structuredData = {
    name: 'CuizIN Blog',
    description: 'Articles about quiz learning, earning rewards, and building knowledge through gamification.',
    url: 'https://cuiz.in/blog',
    itemListElement: blogPosts.map((post, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Article',
        'headline': post.title,
        'description': post.description,
        'url': `https://cuiz.in/blog/${post.slug}`,
        'datePublished': post.date
      }
    }))
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMetaTags
        title="CuizIN Blog - Quiz Tips, Earning Strategies & Knowledge"
        description="Discover strategies for earning through quizzes, improving knowledge retention, and maximizing rewards with CuizIN's educational blog articles."
        keywords="quiz tips, earn money from quizzes, knowledge games, quiz rewards, online quiz strategies"
        canonicalUrl="https://cuiz.in/blog"
        ogType="website"
      />
      <StructuredData type="BreadcrumbList" data={structuredData} />
      
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        <AdvertisementBanner position="top" slotId="blog-top" pageSection="blog-page" />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">CuizIN Blog</h1>
          <p className="text-muted-foreground">
            Insights, strategies, and tips to enhance your quiz experience and maximize your rewards.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {post.readTime}
                  </span>
                </div>
                <Link to={`/blog/${post.slug}`}>
                  <CardTitle className="text-xl hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </Link>
                <CardDescription>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{post.description}</p>
              </CardContent>
              <CardFooter>
                <Link 
                  to={`/blog/${post.slug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Read More →
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <AdvertisementBanner position="middle" slotId="blog-middle" pageSection="blog-page" className="my-8" />
        
        <div className="mt-8 bg-muted/50 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Popular Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['Earnings', 'Knowledge', 'Referrals', 'Education', 'Tips', 'Strategies', 'Games', 'Quiz'].map((category) => (
              <Link 
                key={category}
                to={`/blog/category/${category.toLowerCase()}`}
                className="block text-center p-3 bg-background rounded-md hover:bg-primary/10 transition-colors"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
        
        <AdvertisementBanner position="bottom" slotId="blog-bottom" pageSection="blog-page" className="mt-8" />
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPage;
