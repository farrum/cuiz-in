
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (error) throw error;

        setFaqs(data || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        toast({
          title: 'Error',
          description: 'Unable to load FAQs. Please try again later.',
          variant: 'destructive'
        });
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  // Schema.org FAQ Page structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Frequently Asked Questions | CuizIN"
        description="Find answers to the most common questions about CuizIN quiz game, rewards system, and how to maximize your earnings through regular play."
        canonicalUrl="https://cuiz.in/faq"
        schemaType="FAQPage"
        schemaData={faqSchema}
      />
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-4xl pt-12 pb-16 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        
        <div className="bg-card rounded-lg shadow-sm p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((item) => (
                <AccordionItem key={item.id} value={`item-${item.id}`}>
                  <AccordionTrigger className="text-left font-medium">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
        
        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find the answer you're looking for? Please reach out to our support team.
          </p>
          <a 
            href="mailto:support@cuiz.in" 
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2"
          >
            Contact Support
          </a>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FaqPage;
