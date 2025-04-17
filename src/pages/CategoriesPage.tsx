
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import SEOMetaTags from '@/components/SEOMetaTags';
import StructuredData from '@/components/StructuredData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryStats {
  category: string;
  count: number;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        // Fetch all questions to extract categories
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('category');
          
        if (error) throw error;
        
        // Process data to count questions per category
        const categoryMap = new Map<string, number>();
        data.forEach((item: any) => {
          const category = item.category || 'Uncategorized';
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        });
        
        // Convert to array for rendering
        const categoryStats: CategoryStats[] = Array.from(categoryMap.entries())
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);
        
        setCategories(categoryStats);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Generate structured data for categories
  const structuredData = {
    name: 'Quiz Categories',
    description: 'Explore our wide range of quiz categories. Find questions on various subjects and test your knowledge.',
    url: 'https://cuiz.in/categories',
    itemListElement: categories.map((cat, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': cat.category,
      'item': {
        '@type': 'Thing',
        'name': `${cat.category} Quizzes`,
        'url': `https://cuiz.in/categories/${cat.category.toLowerCase().replace(/\s+/g, '-')}`,
        'description': `${cat.count} questions about ${cat.category}`
      }
    }))
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMetaTags
        title="Quiz Categories - Explore Topics & Test Your Knowledge"
        description="Browse our extensive collection of quiz categories. Find questions on various topics and test your knowledge in different subjects."
        keywords="quiz categories, quiz topics, knowledge test, subject quizzes, educational quizzes"
        canonicalUrl="https://cuiz.in/categories"
        ogType="website"
      />
      <StructuredData type="BreadcrumbList" data={structuredData} />
      
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        <AdvertisementBanner position="top" slotId="categories-top" pageSection="categories-page" />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Quiz Categories</h1>
          <p className="text-muted-foreground">
            Explore our diverse collection of quiz categories. Find questions that match your interests and expertise.
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((category) => {
              const categorySlug = category.category.toLowerCase().replace(/\s+/g, '-');
              
              return (
                <Link key={category.category} to={`/categories/${categorySlug}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle>{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {category.count} {category.count === 1 ? 'question' : 'questions'} available
                      </p>
                    </CardContent>
                    <CardFooter>
                      <p className="text-sm text-primary">Explore category →</p>
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No categories found.</p>
            </CardContent>
          </Card>
        )}
        
        <AdvertisementBanner position="middle" slotId="categories-middle" pageSection="categories-page" className="my-8" />
        
        <div className="mt-8 bg-muted/50 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Why Explore Different Categories?</h2>
          <div className="space-y-4">
            <p>
              Testing your knowledge across various subjects helps expand your understanding and improves 
              cognitive abilities. By exploring different quiz categories, you can:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Discover new areas of interest</li>
              <li>Challenge yourself with unfamiliar topics</li>
              <li>Earn more rewards by mastering multiple subjects</li>
              <li>Improve your general knowledge</li>
              <li>Prepare for competitive exams</li>
            </ul>
          </div>
        </div>
        
        <AdvertisementBanner position="bottom" slotId="categories-bottom" pageSection="categories-page" className="mt-8" />
      </main>
      
      <Footer />
    </div>
  );
};

export default CategoriesPage;
