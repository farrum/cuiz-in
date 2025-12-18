import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

const createSlug = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
};

const FaqDetailPage: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();
  const [faq, setFaq] = useState<Faq | null>(null);
  const [relatedFaqs, setRelatedFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prevFaq, setPrevFaq] = useState<Faq | null>(null);
  const [nextFaq, setNextFaq] = useState<Faq | null>(null);

  useEffect(() => {
    const fetchFaq = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Fetch the specific FAQ
        const { data: faqData, error: faqError } = await supabase
          .from('faqs')
          .select('*')
          .eq('id', id)
          .eq('is_published', true)
          .single();

        if (faqError || !faqData) {
          console.error('FAQ not found:', faqError);
          navigate('/faq', { replace: true });
          return;
        }

        setFaq(faqData);

        // Fetch all FAQs to get related and navigation
        const { data: allFaqs } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (allFaqs) {
          // Find current index
          const currentIndex = allFaqs.findIndex(f => f.id === id);
          
          // Set prev/next navigation
          if (currentIndex > 0) {
            setPrevFaq(allFaqs[currentIndex - 1]);
          }
          if (currentIndex < allFaqs.length - 1) {
            setNextFaq(allFaqs[currentIndex + 1]);
          }

          // Get related FAQs (same category or random)
          const related = allFaqs
            .filter(f => f.id !== id)
            .filter(f => f.category === faqData.category || !faqData.category)
            .slice(0, 3);
          setRelatedFaqs(related);
        }
      } catch (error) {
        console.error('Error fetching FAQ:', error);
        navigate('/faq', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaq();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <NewsTicker className="mt-16" />
        <main className="flex-1 container max-w-4xl pt-12 pb-16 px-4">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!faq) {
    return null;
  }

  const canonicalUrl = `https://cuiz.in/faq/${faq.id}/${createSlug(faq.question)}`;
  
  // Q&A Page Schema for individual FAQ
  const qaSchema = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    'mainEntity': {
      '@type': 'Question',
      'name': faq.question,
      'text': faq.question,
      'answerCount': 1,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
        'url': canonicalUrl
      }
    }
  };

  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.faq(),
    createBreadcrumbs.custom(faq.question.substring(0, 40) + (faq.question.length > 40 ? '...' : ''), `/faq/${faq.id}/${createSlug(faq.question)}`)
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${faq.question} | CuizIN FAQ`}
        description={faq.answer.substring(0, 155) + (faq.answer.length > 155 ? '...' : '')}
        canonicalUrl={canonicalUrl}
        schemaType="QAPage"
        schemaData={qaSchema}
        keywords={['FAQ', 'CuizIN', 'quiz help', faq.category || 'general']}
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
                <Link to="/faq">FAQ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{faq.question.substring(0, 30)}...</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Top Ad Banner */}
        <div className="mb-8">
          <SimpleAdBanner position="header" />
        </div>
        
        {/* Main FAQ Content */}
        <article className="bg-card rounded-lg shadow-sm p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              {faq.category && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full mb-2 inline-block">
                  {faq.category}
                </span>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {faq.question}
              </h1>
            </div>
          </div>
          
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {faq.answer}
            </p>
          </div>
        </article>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 gap-4">
          {prevFaq ? (
            <Link 
              to={`/faq/${prevFaq.id}/${createSlug(prevFaq.question)}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous:</span>
              <span className="truncate max-w-[150px] sm:max-w-[200px]">{prevFaq.question}</span>
            </Link>
          ) : <div />}
          
          {nextFaq ? (
            <Link 
              to={`/faq/${nextFaq.id}/${createSlug(nextFaq.question)}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="truncate max-w-[150px] sm:max-w-[200px]">{nextFaq.question}</span>
              <span className="hidden sm:inline">:Next</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : <div />}
        </div>

        {/* Middle Ad Banner */}
        <div className="my-8">
          <SimpleAdBanner position="content" />
        </div>

        {/* Related FAQs */}
        {relatedFaqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-semibold mb-6">Related Questions</h2>
            <div className="space-y-4">
              {relatedFaqs.map((relatedFaq) => (
                <Link
                  key={relatedFaq.id}
                  to={`/faq/${relatedFaq.id}/${createSlug(relatedFaq.question)}`}
                  className="block p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-medium text-foreground hover:text-primary">
                    {relatedFaq.question}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {relatedFaq.answer}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Internal Links Section */}
        <section className="mt-12 p-6 bg-muted/30 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Explore More</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link to="/quiz" className="block p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors">
              <h3 className="font-medium text-primary mb-1">Play Quiz</h3>
              <p className="text-sm text-muted-foreground">Test your knowledge and earn points</p>
            </Link>
            <Link to="/categories" className="block p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors">
              <h3 className="font-medium text-primary mb-1">Browse Categories</h3>
              <p className="text-sm text-muted-foreground">Explore quiz topics by category</p>
            </Link>
            <Link to="/blog" className="block p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors">
              <h3 className="font-medium text-primary mb-1">Read Blog</h3>
              <p className="text-sm text-muted-foreground">Tips, strategies, and more</p>
            </Link>
          </div>
        </section>

        {/* Back to FAQ */}
        <div className="mt-12 text-center">
          <Button asChild variant="outline">
            <Link to="/faq">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to All FAQs
            </Link>
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FaqDetailPage;
