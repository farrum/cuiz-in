import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Global Organization and LocalBusiness structured data
 * Include this component once in the app layout or on key pages
 */
const OrganizationSchema: React.FC = () => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://cuiz.in/#organization',
    'name': 'CuizIN',
    'alternateName': 'Cuiz IN',
    'url': 'https://cuiz.in',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://cuiz.in/og-image.png',
      'width': 1200,
      'height': 630
    },
    'description': 'CuizIN is India\'s leading free quiz platform where players can earn rewards through active participation. Play quizzes, earn gems, and get rewarded!',
    'foundingDate': '2024',
    'email': 'support@cuiz.in',
    'sameAs': [
      'https://www.facebook.com/cuizin',
      'https://twitter.com/cuizin',
      'https://www.instagram.com/cuizin',
      'https://www.youtube.com/cuizin'
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'customer support',
      'email': 'support@cuiz.in',
      'availableLanguage': ['English', 'Hindi']
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'reviewCount': '3250',
      'bestRating': '5',
      'worstRating': '1'
    }
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineBusiness',
    '@id': 'https://cuiz.in/#business',
    'name': 'CuizIN',
    'url': 'https://cuiz.in',
    'logo': 'https://cuiz.in/og-image.png',
    'image': 'https://cuiz.in/og-image.png',
    'description': 'Free online quiz platform with rewards. Play trivia games, answer questions, and earn real money.',
    'priceRange': 'Free',
    'currenciesAccepted': 'INR',
    'paymentAccepted': ['UPI', 'Bank Transfer'],
    'areaServed': {
      '@type': 'Country',
      'name': 'India'
    },
    'serviceType': 'Online Quiz Game',
    'hasOfferCatalog': {
      '@type': 'OfferCatalog',
      'name': 'Quiz Games',
      'itemListElement': [
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'Daily Quiz Challenges',
            'description': 'Free daily quiz challenges with point rewards'
          }
        },
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'Referral Program',
            'description': 'Earn rewards by referring friends to CuizIN'
          }
        }
      ]
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'reviewCount': '3250',
      'bestRating': '5',
      'worstRating': '1'
    },
    'review': [
      {
        '@type': 'Review',
        'author': { '@type': 'Person', 'name': 'Priya S.' },
        'datePublished': '2025-12-15',
        'reviewBody': 'Amazing quiz app! I love earning rewards while learning new things.',
        'reviewRating': { '@type': 'Rating', 'ratingValue': '5', 'bestRating': '5' }
      },
      {
        '@type': 'Review',
        'author': { '@type': 'Person', 'name': 'Rahul K.' },
        'datePublished': '2025-11-20',
        'reviewBody': 'Great variety of questions across categories. Highly recommended!',
        'reviewRating': { '@type': 'Rating', 'ratingValue': '5', 'bestRating': '5' }
      },
      {
        '@type': 'Review',
        'author': { '@type': 'Person', 'name': 'Ankit M.' },
        'datePublished': '2025-12-10',
        'reviewBody': 'Fun and educational! The daily challenges keep me coming back.',
        'reviewRating': { '@type': 'Rating', 'ratingValue': '5', 'bestRating': '5' }
      }
    ]
  };

  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'CuizIN',
    'url': 'https://cuiz.in',
    'applicationCategory': 'GameApplication',
    'operatingSystem': 'Web Browser',
    'browserRequirements': 'Requires JavaScript. Requires HTML5.',
    'softwareVersion': '2.0',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'INR'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'reviewCount': '3250',
      'bestRating': '5',
      'worstRating': '1'
    },
    'author': {
      '@type': 'Organization',
      'name': 'CuizIN'
    }
  };

  const siteNavigationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    'name': 'Main Navigation',
    'hasPart': [
      { '@type': 'WebPage', 'name': 'Home', 'url': 'https://cuiz.in/' },
      { '@type': 'WebPage', 'name': 'Play Quiz', 'url': 'https://cuiz.in/quiz' },
      { '@type': 'WebPage', 'name': 'Categories', 'url': 'https://cuiz.in/categories' },
      { '@type': 'WebPage', 'name': 'FAQ', 'url': 'https://cuiz.in/faq' },
      { '@type': 'WebPage', 'name': 'Blog', 'url': 'https://cuiz.in/blog' },
      { '@type': 'WebPage', 'name': 'Referral Program', 'url': 'https://cuiz.in/referral-program' }
    ]
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://cuiz.in/'
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(localBusinessSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(webApplicationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(siteNavigationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
};

export default OrganizationSchema;
