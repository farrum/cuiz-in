
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Trophy, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import IQResultModal from './IQResultModal';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  category: string;
  points: number;
}

const TOTAL_QUESTIONS = 5;

const InteractiveQuizPreview: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);

  const loadQuestion = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch a random question that hasn't been used yet
      let query = supabase
        .from('quiz_questions')
        .select('id, question, options, correct_answer, category, points')
        .eq('question_type', 'text')
        .limit(20);
      
      if (usedQuestionIds.length > 0) {
        query = query.not('id', 'in', `(${usedQuestionIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        // Fallback to a default question if database is empty
        setCurrentQuestion({
          id: 'default-1',
          question: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correct_answer: 'Mars',
          category: 'Science',
          points: 10
        });
      } else {
        // Pick a random question from results
        const randomIndex = Math.floor(Math.random() * data.length);
        const q = data[randomIndex];
        const options = Array.isArray(q.options) 
          ? q.options as string[]
          : typeof q.options === 'object' 
            ? Object.values(q.options as object) as string[]
            : ['Option A', 'Option B', 'Option C', 'Option D'];
        
        setCurrentQuestion({
          id: q.id,
          question: q.question,
          options: options,
          correct_answer: q.correct_answer,
          category: q.category,
          points: q.points || 10
        });
        setUsedQuestionIds(prev => [...prev, q.id]);
      }
    } catch (err) {
      console.error('Error loading question:', err);
      // Fallback question
      setCurrentQuestion({
        id: 'default-1',
        question: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correct_answer: 'Mars',
        category: 'Science',
        points: 10
      });
    }
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsLoading(false);
  }, [usedQuestionIds]);

  useEffect(() => {
    loadQuestion();
  }, []);

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered || isLoading) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    const isCorrect = answer === currentQuestion?.correct_answer;
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setTotalPoints(prev => prev + (currentQuestion?.points || 10));
    }

    // Auto-advance after 1.5 seconds
    setTimeout(() => {
      const newCount = questionsAnswered + 1;
      setQuestionsAnswered(newCount);

      if (newCount >= TOTAL_QUESTIONS) {
        setShowResult(true);
      } else {
        loadQuestion();
      }
    }, 1500);
  };

  const handlePlayAgain = () => {
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setTotalPoints(0);
    setShowResult(false);
    setUsedQuestionIds([]);
    loadQuestion();
  };

  const getOptionStyle = (option: string) => {
    if (!isAnswered) {
      return 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer';
    }

    if (option === currentQuestion?.correct_answer) {
      return 'border-accent bg-accent/10';
    }

    if (option === selectedAnswer && option !== currentQuestion?.correct_answer) {
      return 'border-destructive bg-destructive/10';
    }

    return 'border-border opacity-50';
  };

  if (isLoading && !currentQuestion) {
    return (
      <div className="premium-card max-w-md mx-auto lg:mx-0 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="premium-card max-w-md mx-auto lg:mx-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {currentQuestion?.category || 'Quiz'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-accent">
            <Sparkles className="w-4 h-4" />
            <span>+{currentQuestion?.points || 10} pts</span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  i < questionsAnswered
                    ? "bg-accent"
                    : i === questionsAnswered
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            Question {questionsAnswered + 1} of {TOTAL_QUESTIONS}
          </span>
        </div>

        {/* Points display */}
        {totalPoints > 0 && (
          <div className="mb-4 text-sm font-medium text-primary">
            Total: {totalPoints} points
          </div>
        )}

        {/* Question */}
        <div className={cn("transition-opacity duration-300", isLoading && "opacity-50")}>
          <h4 className="text-lg font-semibold mb-4 leading-snug">
            {currentQuestion?.question}
          </h4>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={isAnswered || isLoading}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 text-left",
                  getOptionStyle(option)
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="font-medium">{option}</span>
                </div>

                {isAnswered && option === currentQuestion?.correct_answer && (
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                )}
                {isAnswered && option === selectedAnswer && option !== currentQuestion?.correct_answer && (
                  <XCircle className="w-5 h-5 text-destructive shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Loading next question indicator */}
        {isAnswered && questionsAnswered < TOTAL_QUESTIONS - 1 && (
          <div className="mt-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading next question...
          </div>
        )}
      </div>

      {/* IQ Result Modal */}
      <IQResultModal
        isOpen={showResult}
        correctAnswers={correctAnswers}
        totalQuestions={TOTAL_QUESTIONS}
        totalPoints={totalPoints}
        onPlayAgain={handlePlayAgain}
      />
    </>
  );
};

export default InteractiveQuizPreview;
