import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import PageLayout from '@/components/layout/PageLayout';
import { useFaqs } from '@/hooks/useFaqs';
import { FaqList } from '@/components/faq/FaqList';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const FaqPage: React.FC = () => {
  const { faqs, isLoading } = useFaqs();

  // Schema.org FAQ Page structured data - only generate when FAQs are loaded
  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'dateCreated': new Date().toISOString().split('T')[0],
      'author': {
        '@type': 'Organization',
        'name': 'CuizIN'
      },
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer,
        'url': `https://cuiz.in/faq/${item.id}`,
        'dateCreated': new Date().toISOString().split('T')[0],
        'upvoteCount': 0,
        'author': {
          '@type': 'Organization',
          'name': 'CuizIN'
        }
      }
    }))
  } : undefined;

  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.faq()
  ];

  return (
    <PageLayout showNewsTicker containerClassName="container max-w-4xl pt-12 pb-16 px-4">
      <SEO
        title="Frequently Asked Questions | CuizIN"
        description="Find comprehensive answers to common questions about CuizIN — gameplay rules, earning gems, claiming rewards, leaderboards, and account security."
        canonicalUrl="https://cuiz.in/faq"
        schemaType="FAQPage"
        schemaData={faqSchema}
        keywords={['FAQ', 'quiz game help', 'CuizIN questions', 'gems system', 'how to play quiz', 'trivia game']}
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
            <BreadcrumbPage>FAQ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
    </PageLayout>
  );
};

export default FaqPage;
