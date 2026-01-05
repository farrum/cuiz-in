
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import SEO from '@/components/SEO';
import { Award, ArrowRight, Tag, Home } from 'lucide-react';
import { useQuizAnswer } from '@/hooks/useQuizAnswer';
import CountdownButton from '@/components/CountdownButton';
import ResultCard from '@/components/ResultCard';
import LoadingCard from '@/components/LoadingCard';
import QuestionNotFound from '@/components/QuestionNotFound';
import TopPlayersSection from '@/components/TopPlayersSection';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { extractKeywords } from '@/services/keywordService';
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/utils/quizData';
import { createSlug } from '@/utils/urlUtils';
import { getCategorySlug } from '@/utils/categoryMapping';

const AnswerPage: React.FC = () => {
  const { questionId, selectedOption } = useParams();
  const {
    isLoading,
    question,
    isCorrect,
    funMessage,
    funEmoji,
    backgroundClass,
    handleNextQuestion
  } = useQuizAnswer(questionId, selectedOption);

  const [keywords, setKeywords] = useState<string[]>([]);
  const [similarQuestions, setSimilarQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (question) {
      // Extract keywords for SEO
      const extractedKeywords = extractKeywords(question.question);
      question.options.forEach(option => {
        extractedKeywords.push(...extractKeywords(option));
      });
      
      if (question.explanation) {
        extractedKeywords.push(...extractKeywords(question.explanation));
      }
      
      extractedKeywords.push(question.category.toLowerCase());
      extractedKeywords.push(question.difficulty.toLowerCase());
      
      // Remove duplicates and limit to 15 keywords
      const uniqueKeywords = [...new Set(extractedKeywords)].slice(0, 15);
      setKeywords(uniqueKeywords);
      
      // Fetch similar questions by keywords
      fetchSimilarQuestions(uniqueKeywords, question.id, question.category);
    }
  }, [question]);

  const fetchSimilarQuestions = async (keywords: string[], currentQuestionId: string, category: string) => {
    try {
      // First try to get questions in the same category
      const { data } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('category', category)
        .neq('id', currentQuestionId)
        .limit(3);
      
      if (data && data.length > 0) {
        const formattedQuestions = data.map(q => ({
          id: q.id,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : Object.values(q.options || {}),
          correctAnswer: q.correct_answer,
          difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
          category: q.category,
          points: q.points || 10,
          explanation: q.explanation || ''
        }));
        
        setSimilarQuestions(formattedQuestions);
      }
    } catch (error) {
      console.error('Error fetching similar questions:', error);
    }
  };

  const generateAnswerSchema = () => {
    if (!question || !selectedOption) return null;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'QAPage',
      'mainEntity': {
        '@type': 'Question',
        'name': question.question,
        'text': question.question,
        'keywords': keywords.join(', '),
        'answerCount': 1,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': selectedOption,
          'correct': isCorrect ? 'True' : 'False',
          'additionalDescription': question.explanation || undefined
        }
      }
    };
  };

  const pageTitle = question 
    ? `Answer: ${question.question} | ${question.category} Quiz` 
    : 'Quiz Answer | CuizIN';
    
  const pageDescription = question
    ? `${isCorrect ? 'Correct' : 'Incorrect'} answer to the ${question.difficulty} level question "${question.question}". ${question.explanation || 'Learn more about this quiz question.'}`
    : 'View the answer to this quiz question and learn more about the topic.';

  // Use consistent slug generation from urlUtils
  const categorySlug = question ? createSlug(question.category) : '';
  const questionSlug = question ? createSlug(question.question, 50) : '';
  
  // Create consistent slug for canonical URL using the same createSlug function
  const answerSlug = selectedOption ? createSlug(selectedOption, 50) : '';

  return (
    <PageLayout>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={question && answerSlug ? `https://cuiz.in/answer/${questionId}/${answerSlug}` : undefined}
        schemaType="QAPage"
        schemaData={generateAnswerSchema()}
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
                    <Link to={`/categories/${getCategorySlug(question.category)}`}>{question.category}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/quiz/question/${questionId}/${questionSlug}`}>Question</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>Answer</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* First Advertisement */}
        <SimpleAdBanner position="header" className="mb-8" />
        
        {isLoading ? (
          <LoadingCard />
        ) : question ? (
          <>
            {/* Hidden SEO content */}
            <div className="hidden">
              <h1>Answer to: {question.question}</h1>
              <p>Category: {question.category}</p>
              <p>Difficulty: {question.difficulty}</p>
              <p>Selected Answer: {selectedOption}</p>
              <p>Correct: {isCorrect ? 'Yes' : 'No'}</p>
              <p>Correct Answer: {question.correctAnswer}</p>
              {question.explanation && <p>Explanation: {question.explanation}</p>}
              <div>
                <h2>Keywords</h2>
                <p>{keywords.join(', ')}</p>
              </div>
            </div>
            
            <ResultCard 
              question={question}
              isCorrect={isCorrect}
              funMessage={funMessage}
              funEmoji={funEmoji}
              backgroundClass={backgroundClass}
            />
            
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
            
            {/* Third Advertisement */}
            <SimpleAdBanner position="content" className="my-8" />
            
            {/* Next Question Button */}
            <div className="mt-6 flex justify-end relative z-10">
              <CountdownButton 
                onCountdownComplete={handleNextQuestion}
                initialSeconds={5}
                className="fun-button"
                icon={<Award className="h-5 w-5" />}
              >
                Next Question
              </CountdownButton>
            </div>
            
            {/* Similar Questions */}
            {similarQuestions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">More Questions You Might Like</h2>
                <div className="space-y-4">
                  {similarQuestions.map(q => (
                    <Card key={q.id} className="p-4">
                      <h3 className="font-medium">{q.question}</h3>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {q.category}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          q.difficulty === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        asChild
                      >
                        <Link to={`/quiz/question/${q.id}/${createSlug(q.question, 50)}`}>
                          <ArrowRight className="h-4 w-4 mr-1" /> Try This Question
                        </Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Top Players Section */}
            <div className="mt-8">
              <TopPlayersSection showMonthlyComparison={true} />
            </div>
          </>
        ) : (
          <QuestionNotFound />
        )}
        
        {/* Fourth Advertisement */}
        <SimpleAdBanner position="footer" className="mt-8" />
      </main>
    </PageLayout>
  );
};

export default AnswerPage;
