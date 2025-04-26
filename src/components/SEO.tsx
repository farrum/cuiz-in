
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  schemaType?: 'WebPage' | 'Quiz' | 'FAQPage' | 'Organization' | 'Person' | 'WebSite' | 'Question' | 'QAPage';
  schemaData?: Record<string, any>;
  noindex?: boolean;
  keywords?: string[];
}

const SEO: React.FC<SEOProps> = ({
  title = 'CuizIN - Free Quiz Game with Rewards',
  description = 'Play quizzes, earn points, and get rewarded. CuizIN is a completely free quiz platform where players can earn monthly income through active play.',
  canonicalUrl,
  ogImage = 'https://cuiz.in/og-image.png',
  ogType = 'website',
  schemaType = 'WebPage',
  schemaData = {},
  noindex = false,
  keywords = [],
}) => {
  const siteName = 'CuizIN';
  const siteUrl = 'https://cuiz.in';
  
  // Build the page URL
  const pageUrl = canonicalUrl || siteUrl;
  
  // Build basic schema
  let schema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: title,
    description: description,
    url: pageUrl,
  };
  
  // Merge with custom schema data
  schema = { ...schema, ...schemaData };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={pageUrl} />
      
      {/* Keywords Meta Tag */}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {/* Robots Control */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Open Graph Tags */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default SEO;
