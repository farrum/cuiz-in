
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

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
  ampUrl?: string;
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
  ampUrl,
}) => {
  const location = useLocation();
  const siteName = 'CuizIN';
  const siteUrl = 'https://cuiz.in';
  
  // Generate dynamic canonical URL if not provided
  // This prevents duplicate content issues from URL variations
  const generateCanonicalUrl = (): string => {
    if (canonicalUrl) return canonicalUrl;
    
    // Get clean path without query params or hash
    const cleanPath = location.pathname
      .replace(/\/+$/, '') // Remove trailing slashes
      .replace(/\/+/g, '/'); // Remove duplicate slashes
    
    // Handle root path
    if (cleanPath === '' || cleanPath === '/') {
      return siteUrl;
    }
    
    return `${siteUrl}${cleanPath}`;
  };
  
  const pageUrl = generateCanonicalUrl();
  
  // Build schema based on type
  let schema;
  
  // For FAQPage, use the provided schema directly (it's already complete)
  if (schemaType === 'FAQPage' && schemaData && schemaData['@context']) {
    schema = schemaData;
  } else if (schemaData && Object.keys(schemaData).length > 0) {
    // For other types with custom data, build basic schema and merge
    schema = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: title,
      description: description,
      url: pageUrl,
      ...schemaData
    };
  } else {
    // Default schema
    schema = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: title,
      description: description,
      url: pageUrl,
    };
  }

  // Truncate title and description for optimal SEO
  const seoTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title;
  const seoDescription = description.length > 160 ? `${description.substring(0, 157)}...` : description;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={pageUrl} />
      <link rel="alternate" hrefLang="en-in" href={pageUrl} />
      <link rel="alternate" hrefLang="x-default" href={pageUrl} />
      
      {/* AMP Link - for pages with AMP versions */}
      {ampUrl && <link rel="amphtml" href={ampUrl} />}
      
      {/* Keywords Meta Tag */}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.slice(0, 10).join(', ')} />
      )}
      
      {/* Robots Control */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Open Graph Tags */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={seoTitle} />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@cuizin" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={seoTitle} />
      
      {/* Additional SEO Tags */}
      <meta name="author" content="CuizIN" />
      <meta name="publisher" content="CuizIN" />
      
      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default SEO;
