import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import PageLayout from '@/components/layout/PageLayout';
import NewsTicker from '@/components/NewsTicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { categoriesArray } from '@/utils/categoryData';
import { getCategorySlug } from '@/utils/categoryMapping';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDynamicCategories = async () => {
      try {
        setIsLoading(true);
        // Fetch unique categories from database
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('category');

        if (error) throw error;

        // Aggregate raw DB categories into the known frontend categories so each
        // card has a proper icon, clean name and a slug that actually resolves.
        const slugCounts: Record<string, number> = {};
        data.forEach(q => {
          if (q.category) {
            const slug = getCategorySlug(q.category);
            slugCounts[slug] = (slugCounts[slug] || 0) + 1;
          }
        });

        const dynamicCats = categoriesArray
          .map(c => ({
            ...c,
            questionCount: slugCounts[c.slug] || 0,
          }))
          .filter(c => c.questionCount > 0);

        // Sort by question count descending
        setCategories(dynamicCats.sort((a, b) => b.questionCount - a.questionCount));
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories(categoriesArray); // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchDynamicCategories();
  }, []);

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

  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.categories()
  ];

  return (
    <>
      <SEO
        title="Quiz Categories | CuizIN"
        description="Explore our diverse range of quiz categories including history, science, geography, entertainment, and more. Find the perfect quiz challenge for your interests."
        canonicalUrl="https://cuiz.in/categories"
        schemaType="WebPage"
        schemaData={categorySchema}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <PageLayout>
        <NewsTicker className="mt-16" />
        
        <main className="flex-1 container max-w-6xl pt-12 pb-16 px-4">
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
                <BreadcrumbPage>Categories</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Top Ad Banner */}
          <div className="mb-8">
            <SimpleAdBanner position="header" />
          </div>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Quiz Categories</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our diverse range of quiz topics and challenge yourself in your favorite categories
            </p>
          </div>

          {/* Featured landing pages — high-intent SEO entry gems */}
          <section aria-label="Featured quizzes" className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Featured Quizzes
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { slug: 'gk-quiz', name: 'GK Quiz', icon: '🧠', desc: '200+ general knowledge questions for exams and trivia nights.' },
                { slug: 'cricket-quiz', name: 'Cricket Quiz', icon: '🏏', desc: 'IPL, World Cup, Indian cricket legends and records.' },
                { slug: 'bollywood-quiz', name: 'Bollywood Quiz', icon: '🎬', desc: 'Hindi cinema, iconic songs, stars and dialogues.' },
              ].map(f => (
                <Card key={f.slug} className="hover:shadow-md transition-shadow border-primary/40">
                  <CardHeader>
                    <div className="text-4xl mb-2">{f.icon}</div>
                    <CardTitle>{f.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{f.desc}</CardDescription>
                    <Button asChild className="w-full">
                      <Link to={`/${f.slug}`}>Play {f.name}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map(category => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="text-4xl mb-2">{category.icon}</div>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate mr-2">{category.name}</span>
                      <span className="text-sm font-normal text-muted-foreground whitespace-nowrap">{category.questionCount}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4 line-clamp-2">{category.description}</CardDescription>
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
          )}
          
          {/* Bottom Ad Banner */}
          <div className="mt-12">
            <SimpleAdBanner position="footer" />
          </div>
        </main>
      </PageLayout>
    </>
  );
};

export default CategoriesPage;

