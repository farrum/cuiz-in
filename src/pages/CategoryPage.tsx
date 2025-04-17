
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import SEOMetaTags from '@/components/SEOMetaTags';
import StructuredData from '@/components/StructuredData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface QuizQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
}

const CategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        
        // Convert slug back to category name format
        const decodedCategory = decodeURIComponent(categorySlug || '')
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        setCategoryName(decodedCategory);
        
        // Fetch questions in this category
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('id, question, category, difficulty')
          .eq('category', decodedCategory)
          .limit(50);
          
        if (error) throw error;
        
        setQuestions(data || []);
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoryData();
  }, [categorySlug]);
  
  // Generate the structured data for this category page
  const structuredData = {
    name: `${categoryName} Quizzes`,
    description: `Test your knowledge with our collection of ${categoryName} quizzes. Answer questions and earn rewards on CuizIN.`,
    url: `https://cuiz.in/categories/${categorySlug}`,
    mainEntityOfPage: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      url: `https://cuiz.in/quiz/question/${q.id}/${encodeURIComponent(q.question.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50))}`
    }))
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMetaTags
        title={`${categoryName} Quizzes & Questions`} 
        description={`Explore our collection of ${categoryName} quizzes. Test your knowledge, answer questions, and earn rewards on CuizIN.`}
        keywords={`${categoryName} quiz, ${categoryName} questions, cuiz.in, quiz app, quiz rewards`}
        canonicalUrl={`https://cuiz.in/categories/${categorySlug}`}
        ogType="website"
      />
      <StructuredData type="WebPage" data={structuredData} />
      
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        <AdvertisementBanner position="top" slotId="category-top" pageSection="category-page" />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{categoryName} Quizzes</h1>
          <p className="text-muted-foreground">
            Explore our collection of {questions.length} questions about {categoryName}. Test your knowledge and earn rewards!
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
        ) : questions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {questions.map((question) => {
              const questionSlug = encodeURIComponent(
                question.question
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .substring(0, 50)
              );
              
              return (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">{question.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <div>
                      <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-sm mr-2">
                        {question.difficulty}
                      </span>
                    </div>
                    <Button asChild>
                      <Link to={`/quiz/question/${question.id}/${questionSlug}`}>
                        Answer Question
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No questions found in this category.</p>
            </CardContent>
          </Card>
        )}
        
        <AdvertisementBanner position="middle" slotId="category-middle" pageSection="category-page" className="my-8" />
        
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Other Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {['General Knowledge', 'Science', 'History', 'Geography', 'Sports', 'Entertainment', 'Technology'].map((cat) => {
              if (cat === categoryName) return null;
              
              const catSlug = cat.toLowerCase().replace(/\s+/g, '-');
              return (
                <Button 
                  key={cat} 
                  variant="outline" 
                  className="w-full" 
                  asChild
                >
                  <Link to={`/categories/${catSlug}`}>{cat}</Link>
                </Button>
              );
            })}
          </div>
        </div>
        
        <AdvertisementBanner position="bottom" slotId="category-bottom" pageSection="category-page" className="mt-8" />
      </main>
      
      <Footer />
    </div>
  );
};

export default CategoryPage;
