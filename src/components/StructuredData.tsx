
import React from 'react';
import { Helmet } from 'react-helmet-async';

type SchemaType = 'Organization' | 'FAQPage' | 'Quiz' | 'Article' | 'WebPage' | 'Person' | 'BreadcrumbList' | 'WebSite';

interface StructuredDataProps {
  type: SchemaType;
  data: any;
}

const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };
    
    return JSON.stringify(baseData);
  };

  return (
    <Helmet>
      <script type="application/ld+json">{getStructuredData()}</script>
    </Helmet>
  );
};

export default StructuredData;
