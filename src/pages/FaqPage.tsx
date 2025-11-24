import React from 'react';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import { useFaqs } from '@/hooks/useFaqs';
import { FaqList } from '@/components/faq/FaqList';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

const FaqPage: React.FC = () => {
  const { faqs, isLoading } = useFaqs();

  // Schema.org FAQ Page structured data - only generate when FAQs are loaded
  const faqSchema = faqs.length > 0 ? {
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
  } : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Frequently Asked Questions | CuizIN"
        description="Find answers to the most common questions about CuizIN quiz game, rewards system, and how to maximize your earnings through regular play."
        canonicalUrl="https://cuiz.in/faq"
        schemaType="FAQPage"
        schemaData={faqSchema}
        keywords={['FAQ', 'quiz game help', 'CuizIN questions', 'rewards system', 'how to play quiz', 'earn money online']}
      />
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-4xl pt-12 pb-16 px-4">
        {/* Top Ad Banner */}
        <div className="mb-8">
          <SimpleAdBanner position="header" />
        </div>
        
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        
        <div className="bg-card rounded-lg shadow-sm p-6">
          <FaqList faqs={faqs} isLoading={isLoading} />
        </div>
        
        {/* Middle Ad Banner */}
        <div className="my-8">
          <SimpleAdBanner position="content" />
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
