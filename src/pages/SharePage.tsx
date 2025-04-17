
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import SEOMetaTags from '@/components/SEOMetaTags';
import { ShareableContent } from '@/components/shareable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Tag, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ContentData {
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
  type: 'quiz' | 'blog' | 'challenge';
  date?: string;
  category?: string;
}

const SharePage: React.FC = () => {
  const { contentType, contentId } = useParams<{ contentType: string; contentId: string }>();
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchContentData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        switch (contentType) {
          case 'quiz': 
            await fetchQuizContent(contentId as string);
            break;
          case 'blog':
            // This would fetch from a blog table in a real implementation
            // For now we'll use mock data
            setContent({
              title: "How to Earn Monthly Income by Playing Quizzes",
              description: "Learn strategies to maximize your earnings on quiz platforms and build sustainable monthly income through knowledge-based games. This comprehensive guide provides step-by-step instructions and proven techniques.",
              imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80",
              url: "/blog/how-to-earn-monthly-income-by-playing-quizzes",
              type: "blog",
              date: "April 15, 2025",
              category: "Earnings"
            });
            break;
          case 'challenge':
            await fetchChallengeContent(contentId as string);
            break;
          default:
            setError("Invalid content type specified");
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchContentData();
  }, [contentType, contentId]);
  
  const fetchQuizContent = async (id: string) => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('id, question, category, difficulty, created_at')
      .eq('id', id)
      .single();
      
    if (error || !data) {
      throw new Error('Quiz question not found');
    }
    
    const questionSlug = encodeURIComponent(
      data.question
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
    );
    
    setContent({
      title: data.question,
      description: `Test your knowledge with this ${data.difficulty} difficulty question from our ${data.category} category.`,
      url: `/quiz/question/${data.id}/${questionSlug}`,
      type: 'quiz',
      category: data.category,
      date: new Date(data.created_at).toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      })
    });
  };
  
  const fetchChallengeContent = async (id: string) => {
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('id, title, description, start_date')
      .eq('id', id)
      .single();
      
    if (error || !data) {
      throw new Error('Challenge not found');
    }
    
    setContent({
      title: data.title,
      description: data.description || `Take part in this exciting challenge and earn bonus points!`,
      url: `/challenge/${data.id}`,
      type: 'challenge',
      date: new Date(data.start_date).toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      })
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {content && (
        <SEOMetaTags 
          title={`${content.title} | CuizIN`}
          description={content.description}
          canonicalUrl={`https://cuiz.in/share/${contentType}/${contentId}`}
          ogImage={content.imageUrl || '/og-image.png'}
          ogType="article"
        />
      )}
      
      <Header />
      
      <main className="flex-1 container max-w-4xl px-4 pt-24 pb-12">
        <Link to="/" className="inline-flex items-center text-sm mb-6 hover:text-primary">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Home
        </Link>
        
        <AdvertisementBanner position="top" slotId="share-top" pageSection="share-page" />
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading content...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button asChild>
                <Link to="/">Return to Home</Link>
              </Button>
            </CardContent>
          </Card>
        ) : content ? (
          <div className="space-y-8">
            <div>
              {content.imageUrl && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
                  <img 
                    src={content.imageUrl} 
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
              
              <div className="flex flex-wrap gap-4 mb-6">
                {content.category && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Tag className="h-4 w-4 mr-1" />
                    {content.category}
                  </div>
                )}
                {content.date && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {content.date}
                  </div>
                )}
              </div>
              
              <p className="text-lg leading-relaxed">{content.description}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-muted/50 p-6 rounded-lg">
              <div>
                <h3 className="font-medium mb-1">Want to share this content?</h3>
                <p className="text-muted-foreground text-sm">Copy the link or share directly with friends</p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}>
                  Copy Link
                </Button>
                <Button onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: content.title,
                      text: content.description,
                      url: window.location.href,
                    });
                  } else {
                    alert('Web Share API not supported in your browser');
                  }
                }}>
                  Share
                </Button>
              </div>
            </div>
            
            <div className="my-8">
              <h2 className="text-2xl font-bold mb-4">Take Action</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {content.type === 'quiz' && (
                  <Button size="lg" asChild className="w-full">
                    <Link to={content.url}>Answer This Question</Link>
                  </Button>
                )}
                
                {content.type === 'blog' && (
                  <Button size="lg" asChild className="w-full">
                    <Link to={content.url}>Read Full Article</Link>
                  </Button>
                )}
                
                {content.type === 'challenge' && (
                  <Button size="lg" asChild className="w-full">
                    <Link to={content.url}>Take This Challenge</Link>
                  </Button>
                )}
                
                <Button variant="outline" size="lg" asChild className="w-full">
                  <Link to={content.type === 'blog' ? '/blog' : content.type === 'quiz' ? '/categories' : '/challenge'}>
                    Browse More {content.type === 'blog' ? 'Articles' : content.type === 'quiz' ? 'Questions' : 'Challenges'}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        
        <AdvertisementBanner position="bottom" slotId="share-bottom" pageSection="share-page" className="mt-8" />
      </main>
      
      <Footer />
    </div>
  );
};

export default SharePage;
