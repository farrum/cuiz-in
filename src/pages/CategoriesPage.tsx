import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

// Quiz categories with descriptions, counts, and SEO-friendly slugs
const categories = [
  {
    id: 1,
    name: 'History',
    slug: 'history',
    description: 'Test your knowledge of world history, important events, and historical figures.',
    questionCount: 153,
    icon: '📜'
  },
  {
    id: 2,
    name: 'Science',
    slug: 'science',
    description: 'Challenge yourself with questions about physics, chemistry, biology, and scientific discoveries.',
    questionCount: 178,
    icon: '🔬'
  },
  {
    id: 3,
    name: 'Geography',
    slug: 'geography',
    description: 'Explore your knowledge of countries, capitals, landmarks, and geographical features.',
    questionCount: 124,
    icon: '🌍'
  },
  {
    id: 4,
    name: 'Literature',
    slug: 'literature',
    description: 'Test your familiarity with famous authors, books, literary characters, and quotes.',
    questionCount: 98,
    icon: '📚'
  },
  {
    id: 5,
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Questions about movies, TV shows, music, celebrities, and pop culture.',
    questionCount: 210,
    icon: '🎬'
  },
  {
    id: 6,
    name: 'Sports',
    slug: 'sports',
    description: 'Challenge your knowledge of sports events, rules, athletes, and championships.',
    questionCount: 132,
    icon: '⚽'
  },
  {
    id: 7,
    name: 'Technology',
    slug: 'technology',
    description: 'Test what you know about computers, gadgets, the internet, and technological innovations.',
    questionCount: 116,
    icon: '💻'
  },
  {
    id: 8,
    name: 'General Knowledge',
    slug: 'general-knowledge',
    description: 'A mix of questions covering various topics for a broad knowledge challenge.',
    questionCount: 225,
    icon: '🧠'
  }
];

const CategoriesPage: React.FC = () => {
  // Generate schema.org structured data
  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': categories.map((category, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Thing',
        'name': category.name,
        'description': category.description,
        'url': `https://cuiz.in/categories/${category.slug}`
      }
    }))
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Quiz Categories | CuizIN"
        description="Explore our diverse range of quiz categories including history, science, geography, entertainment, and more. Find the perfect quiz challenge for your interests."
        canonicalUrl="https://cuiz.in/categories"
        schemaType="WebPage"
        schemaData={categorySchema}
      />
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-6xl pt-12 pb-16 px-4">
        {/* Top Ad Banner */}
        <div className="mb-8">
          <SimpleAdBanner position="top" slotId="categories-top" pageSection="categories" />
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Quiz Categories</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our diverse range of quiz topics and challenge yourself in your favorite categories
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map(category => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-2">{category.icon}</div>
                <CardTitle className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">{category.questionCount} questions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{category.description}</CardDescription>
                <Link 
                  to={`/categories/${category.slug}`} 
                  className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 w-full"
                >
                  Explore Category
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Bottom Ad Banner */}
        <div className="mt-12">
          <SimpleAdBanner position="bottom" slotId="categories-bottom" pageSection="categories" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CategoriesPage;
