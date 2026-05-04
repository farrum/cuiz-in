import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import PageLayout from '@/components/layout/PageLayout';
import NewsTicker from '@/components/NewsTicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/urlUtils';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 50;

const BrowseQuestionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentCategory = searchParams.get('category') || 'all';

  // Fetch unique categories for the filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('category')
          .not('category', 'is', null);
        
        if (error) throw error;
        
        const uniqueNames = [...new Set(data.map(q => q.category))];
        const options = [
          { value: 'all', label: 'All Categories' },
          ...uniqueNames.sort().map(cat => ({
            value: cat, // Use raw category name as value for direct DB matching
            label: cat
          }))
        ];
        setCategories(options);
      } catch (err) {
        console.error('Error fetching categories for filter:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      
      try {
        let query = supabase
          .from('quiz_questions')
          .select('id, question, category, difficulty, created_at', { count: 'exact' });
        
        // Apply category filter - dynamic matching
        if (currentCategory !== 'all') {
          query = query.eq('category', currentCategory);
        }
        
        // Apply search filter
        if (searchTerm) {
          query = query.ilike('question', `%${searchTerm}%`);
        }
        
        // Apply pagination
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        
        const { data, count, error } = await query
          .order('created_at', { ascending: false })
          .range(from, to);
        
        if (error) {
          console.error('Error fetching questions:', error);
          return;
        }
        
        setQuestions(data || []);
        setTotalCount(count || 0);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuestions();
  }, [currentPage, currentCategory, searchTerm]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('category', value);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set('q', searchTerm);
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const breadcrumbs = [
    createBreadcrumbs.home(),
    { name: 'Browse Questions', url: 'https://cuiz.in/browse' }
  ];

  // Schema for the page
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'Browse Quiz Questions',
    'description': `Browse ${totalCount.toLocaleString()} quiz questions across multiple categories. Find questions on history, science, sports, entertainment, and more.`,
    'url': 'https://cuiz.in/browse',
    'numberOfItems': totalCount,
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': totalCount,
      'itemListElement': questions.slice(0, 10).map((q, index) => ({
        '@type': 'ListItem',
        'position': (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
        'url': `https://cuiz.in/quiz/question/${q.id}/${createSlug(q.question)}`
      }))
    }
  };

  return (
    <>
      <SEO
        title={`Browse ${totalCount.toLocaleString()} Quiz Questions | CuizIN`}
        description={`Explore our collection of ${totalCount.toLocaleString()} quiz questions. Filter by category, search for specific topics, and test your knowledge on history, science, sports, and more.`}
        canonicalUrl={`https://cuiz.in/browse${currentPage > 1 ? `?page=${currentPage}` : ''}`}
        schemaType="WebPage"
        schemaData={pageSchema}
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
                <BreadcrumbPage>Browse Questions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Top Ad Banner */}
          <div className="mb-8">
            <SimpleAdBanner position="header" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Browse Quiz Questions</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our collection of {totalCount.toLocaleString()} quiz questions across multiple categories
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={currentCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit">Search</Button>
              </form>
            </CardContent>
          </Card>

          {/* Questions List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No questions found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <span className="text-sm font-medium text-muted-foreground min-w-[40px]">
                          #{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </span>
                        <div className="flex-1">
                          <Link 
                            to={`/quiz/question/${question.id}/${createSlug(question.question)}`}
                            className="text-foreground hover:text-primary transition-colors font-medium"
                          >
                            {question.question}
                          </Link>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-secondary px-2 py-1 rounded">
                              {question.category}
                            </span>
                            {question.difficulty && (
                              <span className="text-xs bg-secondary px-2 py-1 rounded">
                                {question.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
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

export default BrowseQuestionsPage;
