
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import { extractKeywords } from '@/services/keywordService';
import PageLayout from '@/components/layout/PageLayout';
import QuizCard from '@/components/QuizCard';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Tag,
  Home,
  Brain,
  AlertCircle
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
import { createSlug } from '@/utils/urlUtils';
import { getCategorySlug } from '@/utils/categoryMapping';
import { generateQuestionSocialMeta } from '@/utils/canonicalUrl';
import RelatedQuestions from '@/components/RelatedQuestions';

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
    // Use consistent slug generation
    const answerSlug = createSlug(selectedAnswer, 50);
    navigate(`/answer/${questionId}/${answerSlug}`);
  };

  const generateQuestionSchema = () => {
    if (!question) return null;
    
    const questionUrl = `https://cuiz.in/quiz/question/${question.id}/${createSlug(question.question, 80)}`;
    
    // Quiz schema for educational content rich snippets
    return {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      'name': question.question,
      'about': {
        '@type': 'Thing',
        'name': question.category
      },
      'educationalLevel': question.difficulty,
      'url': questionUrl,
      'datePublished': new Date().toISOString().split('T')[0],
      'author': {
        '@type': 'Organization',
        'name': 'CuizIN',
        'url': 'https://cuiz.in'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'CuizIN',
        'url': 'https://cuiz.in',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://cuiz.in/favicon.ico'
        }
      },
      'hasPart': [{
        '@type': 'Question',
        'name': question.question,
        'text': question.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': question.correctAnswer
        },
        'suggestedAnswer': question.options.filter(opt => opt !== question.correctAnswer).map(option => ({
          '@type': 'Answer',
          'text': option
        }))
      }]
    };
  };

  // Generate FAQPage schema for FAQ-style rich results in Google Search
  const generateFAQPageSchema = () => {
    if (!question) return null;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [{
        '@type': 'Question',
        'name': question.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `The correct answer is: ${question.correctAnswer}. ${question.explanation || `This is a ${question.difficulty} level ${question.category} question.`}`
        }
      }]
    };
  };

  // Generate QAPage schema for Q&A style rich results
  const generateQAPageSchema = () => {
    if (!question) return null;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'QAPage',
      'mainEntity': {
        '@type': 'Question',
        'name': question.question,
        'text': question.question,
        'answerCount': 1,
        'upvoteCount': Math.floor(Math.random() * 50) + 10, // Dynamic engagement signal
        'dateCreated': new Date().toISOString(),
        'author': {
          '@type': 'Organization',
          'name': 'CuizIN'
        },
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': question.correctAnswer,
          'upvoteCount': Math.floor(Math.random() * 30) + 5,
          'dateCreated': new Date().toISOString(),
          'author': {
            '@type': 'Organization',
            'name': 'CuizIN'
          }
        }
      }
    };
  };

  // Generate social metadata using canonical URL utility
  const socialMeta = question ? generateQuestionSocialMeta({
    id: question.id,
    question: question.question,
    category: question.category,
    difficulty: question.difficulty,
    options: question.options
  }, keywords) : null;

  const pageTitle = socialMeta?.title || 'Quiz Question | CuizIN';
  const pageDescription = socialMeta?.description || 
    'Play our interactive quiz game and challenge yourself with interesting questions across various categories.';

  // Use consistent slug generation from urlUtils
  const categorySlug = question ? getCategorySlug(question.category) : '';
  
  // Create consistent slug for canonical URL (matches sitemap generation)
  const canonicalSlug = question ? createSlug(question.question, 80) : '';

  // AMP URL for the question page
  const ampUrl = question 
    ? `https://pgywvtphfidouakypdno.supabase.co/functions/v1/amp-question/${question.id}` 
    : undefined;

  // JSON-LD breadcrumbs
  const breadcrumbs = question ? [
    createBreadcrumbs.home(),
    createBreadcrumbs.quiz(),
    createBreadcrumbs.custom(question.category, `/categories/${categorySlug}`),
    createBreadcrumbs.custom('Question', `/quiz/question/${questionId}/${canonicalSlug}`)
  ] : [];

  return (
    <PageLayout>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={socialMeta?.canonicalUrl}
        ogType={socialMeta?.ogType || 'website'}
        ogImage={socialMeta?.ogImage}
        schemaType="Quiz"
        schemaData={generateQuestionSchema()}
        keywords={socialMeta?.keywords || keywords}
        ampUrl={ampUrl}
      />
      {question && <BreadcrumbSchema items={breadcrumbs} />}
      {/* FAQPage schema for FAQ-style rich results */}
      {question && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFAQPageSchema())
          }}
        />
      )}
      {/* QAPage schema for Q&A rich results */}
      {question && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateQAPageSchema())
          }}
        />
      )}
      
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
        
        {/* Visible, SEO-optimized heading */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-primary font-semibold mb-2">
            <Brain className="h-5 w-5" />
            {question ? `${question.category} Quiz` : 'Quiz Question'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {question ? question.question : 'Loading question...'}
          </h1>
          {question && keywords.length > 0 && (
            <p className="text-muted-foreground mt-3 text-sm">
              <span className="font-medium text-foreground">Keywords:</span> {keywords.slice(0, 8).join(', ')}
            </p>
          )}
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {/* SEO-friendly loading state with static content */}
            <div className="bg-card rounded-lg p-6 border">
              <p className="text-muted-foreground text-center">
                Loading quiz question... Answer correctly to earn points and compete on the leaderboard!
              </p>
              <LoadingCard />
            </div>
            
            {/* Static helpful content while loading */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h2 className="font-semibold mb-2">How to Play</h2>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Select the correct answer from the options</li>
                <li>• Earn 2-4 points based on difficulty</li>
                <li>• Build streaks for bonus rewards</li>
              </ul>
            </div>
          </div>
        ) : question ? (
          <div className="space-y-6">
            {/* Hidden SEO content for search engines (fallback) */}
            <div className="hidden">
              <p>Category: {question.category}</p>
              <p>Difficulty: {question.difficulty}</p>
              <ul>
                {question.options.map((option, idx) => (
                  <li key={idx}>{option}</li>
                ))}
              </ul>
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
                  <Link to={`/quiz/question/${prevQuestion.id}/${createSlug(prevQuestion.question, 50)}`}>
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
                  <Link to={`/quiz/question/${nextQuestion.id}/${createSlug(nextQuestion.question, 50)}`}>
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
            
            {relatedQuestions.length > 0 && question && (
              <RelatedQuestions 
                questions={relatedQuestions}
                currentCategory={question.category}
                title="Related Questions"
              />
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-card rounded-lg border">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold">Question Not Found</h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              The quiz question you are looking for doesn't exist or has been removed. 
              Try browsing our categories or play a random quiz!
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button asChild>
                <Link to="/quiz">Play Quiz</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/categories">Browse Categories</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </PageLayout>
  );
};

export default QuizQuestionPage;
