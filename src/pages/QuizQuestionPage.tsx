import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuizCard from '@/components/QuizCard';
import { QuizQuestion } from '@/utils/quizData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, BookOpen } from 'lucide-react';
import LoadingCard from '@/components/LoadingCard';
import SEOKeywords from '@/components/SEOKeywords';
import { getQuestionKeywords } from '@/services/keywordService';

const QuizQuestionPage: React.FC = () => {
  const { questionId, questionSlug } = useParams();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedQuestions, setRelatedQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    const fetchQuestionData = async () => {
      setIsLoading(true);
      
      try {
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
          
          const { data: relatedData, error: relatedError } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('category', data.category)
            .neq('id', questionId)
            .limit(5);
            
          if (!relatedError && relatedData) {
            const formattedRelated = relatedData.map(q => ({
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
    window.location.href = `/answer/${questionId}/${selectedAnswer}`;
  };

  const generateQuestionSchema = () => {
    if (!question) return null;
    
    const keywords = getQuestionKeywords(question);
    
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
        'suggestedAnswer': question.options.map(option => ({
          '@type': 'Answer',
          'text': option
        }))
      }
    };
  };

  const pageTitle = question 
    ? `${question.question} | CuizIN Quiz` 
    : 'Quiz Question | CuizIN';
    
  const pageDescription = question
    ? `Test your ${question.category} knowledge with this ${question.difficulty} level quiz question. Answer correctly to earn points!`
    : 'Play our interactive quiz game and challenge yourself with interesting questions across various categories.';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOKeywords />
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        <Link to="/quiz" className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Quiz
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">Quiz Question</h1>
        
        {isLoading ? (
          <LoadingCard />
        ) : question ? (
          <div className="space-y-6">
            <div className="hidden">
              <h1>{question.question}</h1>
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
            
            <script type="application/ld+json" dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Quiz",
                "name": question.question,
                "about": question.category,
                "educationalLevel": question.difficulty
              })
            }} />
            
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {relatedQ.category} · {relatedQ.difficulty}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        asChild
                      >
                        <Link to={`/quiz/question/${relatedQ.id}/${encodeURIComponent(relatedQ.question.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50))}`}>
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
      
      <Footer />
    </div>
  );
};

export default QuizQuestionPage;
