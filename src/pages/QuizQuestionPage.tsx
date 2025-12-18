
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import { extractKeywords } from '@/services/keywordService';
import PageLayout from '@/components/layout/PageLayout';
import QuizCard from '@/components/QuizCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  BookOpen, 
  ChevronRight, 
  Tag,
  Home 
} from 'lucide-react';
import LoadingCard from '@/components/LoadingCard';
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';
import { QuizQuestion } from '@/utils/quizData';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

const QuizQuestionPage: React.FC = () => {
  const { questionId, questionSlug } = useParams();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedQuestions, setRelatedQuestions] = useState<QuizQuestion[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [prevQuestion, setPrevQuestion] = useState<QuizQuestion | null>(null);
  const [nextQuestion, setNextQuestion] = useState<QuizQuestion | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestionData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch current question
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('id', questionId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          const formattedQuestion: QuizQuestion = {
            id: data.id,
            question: data.question,
            options: Array.isArray(data.options) ? data.options : Object.values(data.options || {}),
            correctAnswer: data.correct_answer,
            difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
            category: data.category,
            points: data.points || 10,
            explanation: data.explanation || ''
          };
          
          setQuestion(formattedQuestion);
          
          // Extract keywords for SEO
          const questionKeywords = extractKeywords(formattedQuestion.question);
          formattedQuestion.options.forEach(option => {
            questionKeywords.push(...extractKeywords(option));
          });
          questionKeywords.push(formattedQuestion.category.toLowerCase());
          questionKeywords.push(formattedQuestion.difficulty.toLowerCase());
          
          // Remove duplicates and limit to 15 keywords
          const uniqueKeywords = [...new Set(questionKeywords)].slice(0, 15);
          setKeywords(uniqueKeywords);
          
          // Fetch related questions (by category AND difficulty)
          const { data: relatedData } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('category', data.category)
            .eq('difficulty', data.difficulty)
            .neq('id', questionId)
            .limit(4);
            
          // If we don't have enough related questions by same category and difficulty,
          // fetch some more by just category
          let additionalData = [];
          if (!relatedData || relatedData.length < 4) {
            const { data: additionalRelated } = await supabase
              .from('quiz_questions')
              .select('*')
              .eq('category', data.category)
              .neq('difficulty', data.difficulty)
              .neq('id', questionId)
              .limit(4 - (relatedData?.length || 0));
              
            if (additionalRelated) {
              additionalData = additionalRelated;
            }
          }
          
          // Format related questions
          const allRelatedData = [...(relatedData || []), ...additionalData];
          if (allRelatedData.length > 0) {
            const formattedRelated = allRelatedData.map(q => ({
              id: q.id,
              question: q.question,
              options: Array.isArray(q.options) ? q.options : Object.values(q.options || {}),
              correctAnswer: q.correct_answer,
              difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
              category: q.category,
              points: q.points || 10,
              explanation: q.explanation || ''
            }));
            
            setRelatedQuestions(formattedRelated);
          }
          
          // Fetch previous and next questions (for navigation)
          // First get by same category and difficulty
          const { data: prevData } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('category', data.category)
            .eq('difficulty', data.difficulty)
            .neq('id', questionId)
            .order('created_at', { ascending: false })
            .limit(1);
            
          const { data: nextData } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('category', data.category)
            .eq('difficulty', data.difficulty)
            .neq('id', questionId)
            .order('created_at', { ascending: true })
            .limit(1);
            
          if (prevData && prevData.length > 0) {
            setPrevQuestion({
              id: prevData[0].id,
              question: prevData[0].question,
              options: Array.isArray(prevData[0].options) ? prevData[0].options : Object.values(prevData[0].options || {}),
              correctAnswer: prevData[0].correct_answer,
              difficulty: (prevData[0].difficulty || 'medium') as 'easy' | 'medium' | 'hard',
              category: prevData[0].category,
              points: prevData[0].points || 10,
              explanation: prevData[0].explanation || ''
            });
          }
          
          if (nextData && nextData.length > 0) {
            setNextQuestion({
              id: nextData[0].id,
              question: nextData[0].question,
              options: Array.isArray(nextData[0].options) ? nextData[0].options : Object.values(nextData[0].options || {}),
              correctAnswer: nextData[0].correct_answer,
              difficulty: (nextData[0].difficulty || 'medium') as 'easy' | 'medium' | 'hard',
              category: nextData[0].category,
              points: nextData[0].points || 10,
              explanation: nextData[0].explanation || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching question:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuestionData();
  }, [questionId, questionSlug]);

  const handleQuizComplete = (isCorrect: boolean, selectedAnswer: string) => {
    navigate(`/answer/${questionId}/${encodeURIComponent(selectedAnswer)}`);
  };

  const generateQuestionSchema = () => {
    if (!question) return null;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      'name': question.question,
      'about': question.category,
      'educationalLevel': question.difficulty,
      'keywords': keywords.join(', '),
      'hasPart': {
        '@type': 'Question',
        'name': question.question,
        'text': question.question,
        'eduQuestionType': 'Multiple choice',
        'suggestedAnswer': question.options.map(option => ({
          '@type': 'Answer',
          'text': option
        }))
      },
      'isPartOf': {
        '@type': 'CreativeWork',
        'name': `${question.category} Quiz`,
        'educationalAlignment': {
          '@type': 'AlignmentObject',
          'alignmentType': 'educationalSubject',
          'targetName': question.category
        }
      }
    };
  };

  const pageTitle = question 
    ? `${question.question} | ${question.category} Quiz` 
    : 'Quiz Question | CuizIN';
    
  const pageDescription = question
    ? `Test your ${question.category} knowledge with this ${question.difficulty} level question: ${question.question}. Answer correctly to earn points!`
    : 'Play our interactive quiz game and challenge yourself with interesting questions across various categories.';

  const categorySlug = question ? question.category.toLowerCase().replace(/\s+/g, '-') : '';
  
  // Create consistent slug for canonical URL (matches sitemap generation)
  const canonicalSlug = question 
    ? question.question.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 80)
    : '';

  return (
    <PageLayout>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={question && canonicalSlug ? `https://cuiz.in/quiz/question/${questionId}/${canonicalSlug}` : undefined}
        schemaType="Quiz"
        schemaData={generateQuestionSchema()}
        keywords={keywords}
      />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/"><Home className="h-4 w-4 mr-1" /></Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/quiz">Quiz</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {question && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/categories/${categorySlug}`}>{question.category}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{question ? 'Question' : 'Loading...'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <h1 className="text-3xl font-bold mb-2">Quiz Question</h1>
        
        {isLoading ? (
          <LoadingCard />
        ) : question ? (
          <div className="space-y-6">
            {/* Hidden SEO content for search engines */}
            <div className="hidden">
              <h1>{question.question}</h1>
              <p>Category: {question.category}</p>
              <p>Difficulty: {question.difficulty}</p>
              <ul>
                {question.options.map((option, idx) => (
                  <li key={idx}>{option}</li>
                ))}
              </ul>
              <div>
                <h2>Keywords</h2>
                <p>{keywords.join(', ')}</p>
              </div>
            </div>
            
            <QuizCard 
              question={question} 
              onComplete={handleQuizComplete} 
            />
            
            {/* Question navigation */}
            <div className="flex justify-between mt-8">
              {prevQuestion ? (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  asChild
                >
                  <Link 
                    to={`/quiz/question/${prevQuestion.id}/${encodeURIComponent(prevQuestion.question.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'))}`}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous Question
                  </Link>
                </Button>
              ) : (
                <div></div>
              )}
              
              {nextQuestion && (
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                  asChild
                >
                  <Link 
                    to={`/quiz/question/${nextQuestion.id}/${encodeURIComponent(nextQuestion.question.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'))}`}
                  >
                    Next Question <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
            
            <SimpleAdBanner position="content" className="my-8" />
            
            {/* Keywords/Tags section */}
            {keywords.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Tag className="h-4 w-4" /> Related Topics:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.slice(0, 8).map((keyword, index) => (
                    <span key={index} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {relatedQuestions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Related Questions
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {relatedQuestions.map(relatedQ => (
                    <Card key={relatedQ.id} className="p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-medium">{relatedQ.question}</h3>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {relatedQ.category}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          relatedQ.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          relatedQ.difficulty === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {relatedQ.difficulty}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        asChild
                      >
                        <Link to={`/quiz/question/${relatedQ.id}/${encodeURIComponent(relatedQ.question.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'))}`}>
                          View Question
                        </Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold">Question Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              The quiz question you are looking for doesn't exist or has been removed.
            </p>
            <Button asChild className="mt-4">
              <Link to="/quiz">Go to Quiz Page</Link>
            </Button>
          </div>
        )}
      </main>
    </PageLayout>
  );
};

export default QuizQuestionPage;
