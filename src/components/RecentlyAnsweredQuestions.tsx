
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnsweredQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  selected_answer: string;
  answered_at: string;
  explanation: string;
  category: string;
  correct: boolean;
}

// This represents a single quiz question as stored in the database
interface QuizQuestion {
  id: string;
  question: string;
  options: any; // Could be array, object, or string
  correct_answer: string;
  explanation: string;
  category: string;
}

// This represents what we get back from the database query
interface QuizAnswer {
  id: string;
  question_id: string;
  selected_answer: string;
  correct: boolean;
  answered_at: string;
  quiz_questions: QuizQuestion; // This is a single object, not an array
}

interface RecentlyAnsweredQuestionsProps {
  userId: string;
  limit?: number;
}

const RecentlyAnsweredQuestions: React.FC<RecentlyAnsweredQuestionsProps> = ({ 
  userId, 
  limit = 5 
}) => {
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAnsweredQuestions();
  }, [userId, limit]);

  const fetchAnsweredQuestions = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_answers')
        .select(`
          id,
          question_id,
          selected_answer,
          correct,
          answered_at,
          quiz_questions (
            id,
            question,
            options,
            correct_answer,
            explanation,
            category
          )
        `)
        .eq('user_id', userId)
        .order('answered_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching answered questions:', error);
        return;
      }

      // Transform data to AnsweredQuestion format
      const formattedData: AnsweredQuestion[] = data.map((item) => {
        // Convert options to string array regardless of what format it comes in
        let parsedOptions: string[] = [];
        
        // Check if quiz_questions exists and is an object (not an array)
        if (item.quiz_questions && typeof item.quiz_questions === 'object' && !Array.isArray(item.quiz_questions)) {
          // Handle different possible formats
          const options = item.quiz_questions.options;
          
          if (Array.isArray(options)) {
            // If it's already an array, make sure all elements are strings
            parsedOptions = options.map(opt => String(opt));
          } else if (typeof options === 'object' && options !== null) {
            // If it's an object, extract values
            parsedOptions = Object.values(options).map(opt => String(opt));
          } else if (typeof options === 'string') {
            // If it's a JSON string, try to parse it
            try {
              const parsed = JSON.parse(options);
              if (Array.isArray(parsed)) {
                parsedOptions = parsed.map(opt => String(opt));
              } else if (typeof parsed === 'object' && parsed !== null) {
                parsedOptions = Object.values(parsed).map(opt => String(opt));
              }
            } catch {
              // If parsing fails, use it as a single item array
              parsedOptions = [String(options)];
            }
          }
        }

        // Access quiz_questions safely, ensuring it's a single object not an array
        const quizQuestions = !Array.isArray(item.quiz_questions) && item.quiz_questions 
          ? item.quiz_questions 
          : { question: 'Question not available', correct_answer: '', explanation: 'No explanation available', category: 'General' };

        return {
          id: item.id,
          question: quizQuestions.question || 'Question not available',
          options: parsedOptions,
          correct_answer: quizQuestions.correct_answer || '',
          selected_answer: item.selected_answer,
          answered_at: item.answered_at,
          explanation: quizQuestions.explanation || 'No explanation available',
          category: quizQuestions.category || 'General',
          correct: item.correct
        };
      });

      setAnsweredQuestions(formattedData);
    } catch (err) {
      console.error('Failed to fetch answered questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (questionId: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (answeredQuestions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>You haven't answered any questions yet.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/quiz'}>
          Start Answering Questions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {answeredQuestions.map(question => (
        <Card key={question.id} className={`transition-all ${question.correct ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {question.correct ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Badge variant="outline" className="bg-secondary/50">
                    {question.category}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(question.answered_at)}
                  </div>
                </div>
                <CardTitle className="text-base font-medium">{question.question}</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 h-8 w-8 p-0" 
                onClick={() => toggleExpand(question.id)}
              >
                {expandedQuestions[question.id] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className={expandedQuestions[question.id] ? "block" : "hidden"}>
            <div className="space-y-2 pt-2">
              <Separator />
              
              <div className="mt-2 space-y-2">
                <p className="text-sm font-medium">Your answer:</p>
                <div className={`text-sm px-3 py-2 rounded-md ${
                  question.correct ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {question.selected_answer}
                </div>
                
                {!question.correct && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Correct answer:</p>
                    <div className="text-sm px-3 py-2 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      {question.correct_answer}
                    </div>
                  </div>
                )}
                
                {question.explanation && (
                  <div className="space-y-1 mt-3">
                    <p className="text-sm font-medium">Explanation:</p>
                    <div className="text-sm px-3 py-2 rounded-md bg-secondary/50">
                      {question.explanation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RecentlyAnsweredQuestions;
