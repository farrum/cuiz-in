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
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

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
  {
    id: 2,
    slug: 'benefits-of-daily-quiz-challenges',
    title: 'The Benefits of Completing Daily Quiz Challenges',
    excerpt: 'Discover why daily challenges are the best way to boost your knowledge and earn more rewards.',
    category: 'Guides',
    date: '2025-04-10',
    author: 'Quiz Expert',
    readTime: '4 min read',
    content: `
      <h2>Introduction to Daily Challenges</h2>
      <p>Daily challenges are specially curated quiz sets that change every 24 hours. These challenges are designed to test different knowledge areas and provide enhanced rewards compared to regular quiz questions.</p>
      
      <h2>1. Higher Point Multipliers</h2>
      <p>Daily challenges typically offer higher point multipliers than standard quizzes. While a normal quiz question might award 10 points, the same question in a daily challenge could be worth 15-30 points depending on the difficulty level.</p>
      <p>This multiplier effect makes daily challenges one of the most efficient ways to earn points on the platform.</p>
      
      <h2>2. Knowledge Diversity</h2>
      <p>Daily challenges often cover multiple categories in a single session, helping you expand your knowledge across different domains. This variety makes the experience both educational and entertaining.</p>
      <p>By encountering questions from various fields each day, you'll gradually build a well-rounded knowledge base that helps in future challenges.</p>
      
      <h2>3. Achievement Unlocks</h2>
      <p>Completing consecutive daily challenges unlocks special achievements and badges on your profile. These visual indicators of your dedication not only look impressive but sometimes come with bonus point rewards.</p>
      <p>Try to maintain a streak of daily challenge completions to maximize these achievement-based rewards.</p>
      
      <h2>4. Community Competition</h2>
      <p>Daily challenges often feature leaderboards where you can compare your performance with other players. This friendly competition can motivate you to improve your score and learn more efficiently.</p>
      <p>Check the daily leaderboard to see where you stand and challenge yourself to climb the ranks over time.</p>
      
      <h2>5. Time Efficiency</h2>
      <p>Unlike open-ended quiz sessions, daily challenges have a defined scope and length. This makes them perfect for busy schedules, as you know exactly how much time you need to commit.</p>
      <p>Most daily challenges can be completed in 5-10 minutes, making them a perfect mental exercise during a coffee break or commute.</p>
      
      <h2>Conclusion</h2>
      <p>Daily challenges represent the perfect balance of entertainment, education, and rewards. By incorporating them into your daily routine, you'll maximize your earning potential while continuously expanding your knowledge base.</p>
    `
  },
  {
    id: 3,
    slug: 'science-behind-quiz-learning',
    title: 'The Science Behind Learning Through Quizzes',
    excerpt: 'Research shows that quiz-based learning enhances memory retention and cognitive capabilities.',
    category: 'Education',
    date: '2025-04-05',
    author: 'Dr. Quiz',
    readTime: '7 min read',
    content: `
      <h2>Understanding Active Recall</h2>
      <p>Quiz-based learning leverages a powerful cognitive principle known as active recall. Unlike passive reading, quizzes force your brain to actively retrieve information, strengthening neural pathways in the process.</p>
      <p>Research in cognitive psychology has consistently shown that active recall is significantly more effective for long-term retention than simply reviewing material repeatedly.</p>
      
      <h2>1. The Testing Effect</h2>
      <p>The "testing effect" refers to the improved ability to remember information by actively testing your knowledge rather than just studying. When you attempt to answer a quiz question, your brain works harder to retrieve the information.</p>
      <p>This increased cognitive effort creates stronger memory traces, making it easier to recall that information in the future.</p>
      
      <h2>2. Spaced Repetition</h2>
      <p>Quiz platforms often employ spaced repetition algorithms, presenting information at increasing intervals as you demonstrate mastery. This technique prevents forgetting by reviewing content just before you're likely to forget it.</p>
      <p>Daily quizzes create a natural spaced repetition effect, especially when topics reappear at strategic intervals.</p>
      
      <h2>3. Immediate Feedback</h2>
      <p>The instant feedback provided after answering a quiz question helps correct misconceptions immediately. This prevents the reinforcement of incorrect information and creates opportunities for learning from mistakes.</p>
      <p>Studies show that immediate feedback increases learning efficiency by up to 60% compared to delayed feedback or no feedback at all.</p>
      
      <h2>4. Motivation Through Gamification</h2>
      <p>The point systems, achievements, and competitive elements of quiz platforms trigger dopamine release, creating positive associations with learning. This gamification makes the learning process more enjoyable and sustainable.</p>
      <p>When learning feels rewarding, your brain allocates more resources to it, improving both attention and retention.</p>
      
      <h2>5. Cognitive Benefits Beyond Content</h2>
      <p>Regular quiz participation has been shown to improve general cognitive functions like processing speed, working memory, and even attention span. These benefits extend beyond the specific content you're learning.</p>
      <p>Researchers found that people who engage in quiz-based learning for just 15 minutes daily show measurable cognitive improvements within weeks.</p>
      
      <h2>Conclusion</h2>
      <p>The science is clear: quiz-based learning isn't just fun—it's one of the most effective ways to build lasting knowledge and improve cognitive function. By understanding these principles, you can approach CuizIN not just as entertainment but as a powerful tool for personal development.</p>
    `
  },
  {
    id: 4,
    slug: 'building-quiz-streaks',
    title: 'The Power of Building Quiz Streaks',
    excerpt: 'How maintaining a consistent quiz streak can exponentially increase your points and knowledge.',
    category: 'Strategy',
    date: '2025-03-28',
    author: 'Streak Master',
    readTime: '6 min read',
    content: `
      <h2>Understanding Streak Mechanics</h2>
      <p>A streak in CuizIN refers to consecutive days of quiz participation. The platform rewards this consistency with increasing point multipliers, making each question you answer worth significantly more as your streak grows.</p>
      <p>This compounding effect makes streak maintenance one of the most powerful strategies for point accumulation.</p>
      
      <h2>1. Multiplier Growth</h2>
      <p>Every consecutive day adds to your multiplier, typically starting at 1.0x and increasing by 0.1x daily. By day 10, you're earning 2.0x points for every question, effectively doubling your earnings with the same effort.</p>
      <p>The highest achievable multipliers can reach 5.0x or more, making long-term streaks extraordinarily valuable.</p>
      
      <h2>2. Streak Protection</h2>
      <p>CuizIN offers streak protection mechanisms that can save your progress if you miss a day. These might be earned through achievements or available as special rewards.</p>
      <p>Always keep a few streak protectors in reserve for emergencies, such as when you're traveling or might not have internet access.</p>
      
      <h2>3. Minimum Effort Days</h2>
      <p>On busy days when you can't commit to a full quiz session, remember that even answering just 3-5 questions is enough to maintain your streak. These "minimum effort days" are crucial for long-term success.</p>
      <p>Consider setting a daily reminder for times when you're typically less busy to ensure you never miss a day.</p>
      
      <h2>4. The Psychology of Streaks</h2>
      <p>Streaks tap into powerful psychological motivators. The fear of breaking a long streak (loss aversion) combined with the satisfaction of seeing the streak counter increase creates strong behavioral incentives.</p>
      <p>This psychological hook helps build lasting habits around quiz learning, leading to consistent knowledge growth.</p>
      
      <h2>5. Recovery Strategies</h2>
      <p>If you do break a streak, don't get discouraged. The platform often offers "streak recovery" opportunities through special challenges or events.</p>
      <p>Focus on immediately starting a new streak rather than dwelling on the broken one. Many top earners have had multiple streak cycles.</p>
      
      <h2>Conclusion</h2>
      <p>Building and maintaining streaks is both an art and a science. The exponential point benefits make it worthwhile to develop systems that ensure daily participation. Even short sessions can maintain your momentum and contribute to significant long-term earnings.</p>
    `
  }
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
            dangerouslySetInnerHTML={{ __html: post.content }}
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
