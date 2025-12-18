
import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import PageLayout from '@/components/layout/PageLayout';
import NewsTicker from '@/components/NewsTicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { categoriesArray } from '@/utils/categoryData';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const CategoriesPage: React.FC = () => {
  // Generate schema.org structured data
  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'itemListElement': categoriesArray.map((category, index) => ({
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
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoriesArray.map(category => (
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
            <SimpleAdBanner position="footer" />
          </div>
        </main>
      </PageLayout>
    </>
  );
};

export default CategoriesPage;

