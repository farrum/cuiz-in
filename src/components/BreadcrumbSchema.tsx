import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

/**
 * Generates JSON-LD structured data for breadcrumbs
 * This helps Google understand site hierarchy and display breadcrumbs in search results
 */
const BreadcrumbSchema: React.FC<BreadcrumbSchemaProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default BreadcrumbSchema;

/**
 * Helper function to create common breadcrumb paths
 */
export const createBreadcrumbs = {
  home: (): BreadcrumbItem => ({ name: 'Home', url: 'https://cuiz.in/' }),
  
  quiz: (): BreadcrumbItem => ({ name: 'Quiz', url: 'https://cuiz.in/quiz' }),
  
  faq: (): BreadcrumbItem => ({ name: 'FAQ', url: 'https://cuiz.in/faq' }),
  
  blog: (): BreadcrumbItem => ({ name: 'Blog', url: 'https://cuiz.in/blog' }),
  
  categories: (): BreadcrumbItem => ({ name: 'Categories', url: 'https://cuiz.in/categories' }),
  
  howToPlay: (): BreadcrumbItem => ({ name: 'How to Play', url: 'https://cuiz.in/how-to-play' }),
  
  referral: (): BreadcrumbItem => ({ name: 'Referral Program', url: 'https://cuiz.in/referral-program' }),
  
  custom: (name: string, path: string): BreadcrumbItem => ({ 
    name, 
    url: `https://cuiz.in${path}` 
  })
};
