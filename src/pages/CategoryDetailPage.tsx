
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Search, Filter, Trophy, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { getCategoryData, categoriesArray } from '@/utils/categoryData';
import { createSlug } from '@/utils/urlUtils';
import { supabase } from '@/integrations/supabase/client';
import { isValidCategorySlug, getCategoriesForSlug, getCategoryDisplayName } from '@/utils/categoryMapping';
import { generateCategorySocialMeta } from '@/utils/canonicalUrl';
import { getSubcategories } from '@/utils/subcategoryConfig';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const CategoryDetailPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [realQuestions, setRealQuestions] = useState<any[]>([]);
  const [categoryNotFound, setCategoryNotFound] = useState(false);
  
  // Check if slug is valid
  const isValidSlug = categorySlug ? isValidCategorySlug(categorySlug) : false;
  
  // Get category data by slug
  const category = categorySlug && isValidSlug ? getCategoryData(categorySlug) : null;
  
  useEffect(() => {
    const fetchCategoryQuestions = async () => {
      if (!categorySlug) return;
      
      // If invalid slug, mark as not found
      if (!isValidSlug) {
        setCategoryNotFound(true);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get all database categories that map to this slug
        const dbCategories = getCategoriesForSlug(categorySlug);
        
        // Load real questions from the database for these categories
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .in('category', dbCategories)
          .limit(20);
          
        if (error) {
          console.error("Error fetching category questions:", error);
        } else if (data && data.length > 0) {
          setRealQuestions(data.map(q => ({
            id: q.id,
            question: q.question,
            difficulty: q.difficulty || 'medium'
          })));
        } else {
          // No questions found for this category
          setRealQuestions([]);
        }
      } catch (e) {
        console.error("Error in fetchCategoryQuestions:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoryQuestions();
  }, [categorySlug, isValidSlug]);
  
  // Handle category not found - show helpful page instead of redirect
  if (categoryNotFound || (!loading && !category)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEO
          title="Category Not Found | CuizIN"
          description="The quiz category you're looking for doesn't exist. Browse our available categories to find exciting quizzes."
          noindex={true}
        />
        <Header />
        <NewsTicker className="mt-16" />
        
        <main className="flex-1 container max-w-4xl pt-12 pb-16 px-4">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Category Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The category "{categorySlug}" doesn't exist or has been moved.
            </p>
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Browse Available Categories:</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categoriesArray.map(cat => (
                  <Button key={cat.slug} variant="outline" asChild>
                    <Link to={`/categories/${cat.slug}`}>
                      <span className="mr-2">{cat.icon}</span>
                      {cat.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }
  
  // Use real questions if available, otherwise use featured questions from category data
  const displayQuestions = realQuestions.length > 0 
    ? realQuestions 
    : category.featuredQuestions;
  
  // Generate schema.org structured data for this category
  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `${category.name} Quizzes`,
    'description': category.description,
    'numberOfItems': category.questionCount,
    'itemListElement': displayQuestions.map((question, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': {
        '@type': 'Question',
        'name': question.question
      }
    }))
  };

  // Difficulty badge color mapping
  const difficultyColor = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };

  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.categories(),
    createBreadcrumbs.custom(category.name, `/categories/${categorySlug}`)
  ];

  // Generate social metadata for the category
  const socialMeta = generateCategorySocialMeta(category.name, categorySlug || '');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={socialMeta.title}
        description={socialMeta.description}
        canonicalUrl={socialMeta.canonicalUrl}
        ogType={socialMeta.ogType}
        ogImage={socialMeta.ogImage}
        schemaType="WebPage"
        schemaData={categorySchema}
        keywords={socialMeta.keywords}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />
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
              <BreadcrumbLink asChild>
                <Link to="/categories">Categories</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Ad placement - Top of category page */}
        <SimpleAdBanner position="header" slotId="category-top" className="mb-8" />
        
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl">{category.icon}</div>
          <div>
            <h1 className="text-3xl font-bold">{category.name} Quizzes</h1>
            <p className="text-muted-foreground">{category.questionCount} questions available</p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">About This Category</h2>
          <p className="text-muted-foreground mb-6">{category.longDescription}</p>
          
          <h3 className="text-lg font-medium mb-3">Difficulty Levels</h3>
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between mb-1">
              <span>Easy</span>
              <span>{category.difficultyDistribution.easy}%</span>
            </div>
            <Progress value={category.difficultyDistribution.easy} className="h-2 bg-green-100" />
            
            <div className="flex items-center justify-between mb-1">
              <span>Medium</span>
              <span>{category.difficultyDistribution.medium}%</span>
            </div>
            <Progress value={category.difficultyDistribution.medium} className="h-2 bg-blue-100" />
            
            <div className="flex items-center justify-between mb-1">
              <span>Hard</span>
              <span>{category.difficultyDistribution.hard}%</span>
            </div>
            <Progress value={category.difficultyDistribution.hard} className="h-2 bg-red-100" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button asChild>
              <Link to={`/quiz?category=${encodeURIComponent(category.name)}`}>
                Start {category.name} Quiz
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/quiz">
                View All Questions
              </Link>
            </Button>
          </div>
        </div>
        
        <SimpleAdBanner position="content" slotId="category-middle" />
        
        <div className="grid gap-8 md:grid-cols-3 mt-8">
          <div className="md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-semibold">Featured Questions</h2>
              
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="easy">Easy</TabsTrigger>
                <TabsTrigger value="medium">Medium</TabsTrigger>
                <TabsTrigger value="hard">Hard</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-t-primary border-primary/30 rounded-full animate-spin"></div>
                  <p className="mt-4 text-muted-foreground">Loading questions...</p>
                </div>
              ) : displayQuestions
                .filter(q => activeTab === 'all' || q.difficulty === activeTab)
                .filter(q => q.question.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(question => (
                  <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{question.question}</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${difficultyColor[question.difficulty as 'easy' | 'medium' | 'hard']}`}>
                          {question.difficulty}
                        </span>
                      </div>
                      <div className="mt-3">
                        <Link 
                          to={`/quiz/question/${question.id}/${getCategorySlug(question.category)}/${createSlug(question.question, 50)}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Answer this question
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
              {!loading && displayQuestions
                .filter(q => activeTab === 'all' || q.difficulty === activeTab)
                .filter(q => q.question.toLowerCase().includes(searchTerm.toLowerCase()))
                .length === 0 && (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">No questions found matching your filters.</p>
                </div>
              )}
            </div>
            
            {displayQuestions.length > 4 && (
              <div className="mt-6 text-center">
                <Button variant="outline" onClick={() => console.log('Load more clicked')}>
                  Load More Questions
                </Button>
              </div>
            )}
          </div>
          
          <div>
            <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                Top Performers
              </h2>
              
              <div className="space-y-4">
                {category.topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                        {performer.rank}
                      </div>
                      <span>{performer.username}</span>
                    </div>
                    <span className="font-medium">{performer.gems} pts</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Subcategories</h2>
              {(() => {
                const subs = getSubcategories(categorySlug || '');
                if (subs.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground">No subcategories yet.</p>
                  );
                }
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {subs.map((s) => (
                      <Button
                        key={s.slug}
                        asChild
                        variant="outline"
                        className="justify-start h-auto py-2 px-3 text-sm"
                      >
                        <Link to={`/categories/${categorySlug}/${s.slug}`}>{s.name}</Link>
                      </Button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        
        {/* Ad placement - Bottom of category page */}
        <SimpleAdBanner position="footer" slotId="category-bottom" className="mt-12" />
      </main>
      
      <Footer />
    </div>
  );
};

export default CategoryDetailPage;
