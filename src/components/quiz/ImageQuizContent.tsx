
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Image as ImageIcon, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { QuizQuestion } from '@/utils/quizData';
import { cn } from '@/lib/utils';

interface ImageQuizOptionProps {
  option: string;
  index: number;
  selected: boolean;
  isAnswered: boolean;
  isCorrect: boolean;
  isSelectedWrong: boolean;
  onSelect: (option: string) => void;
}

const ImageQuizOption: React.FC<ImageQuizOptionProps> = ({ 
  option, 
  index, 
  selected, 
  isAnswered,
  isCorrect,
  isSelectedWrong,
  onSelect 
}) => {
  const getOptionStyle = () => {
    if (!isAnswered) {
      return selected 
        ? 'border-primary bg-primary/10 transform scale-[1.02]' 
        : 'hover:bg-accent hover:border-accent cursor-pointer';
    }
    
    if (isCorrect) {
      return 'border-green-500 bg-green-500/10';
    }
    
    if (isSelectedWrong) {
      return 'border-destructive bg-destructive/10';
    }
    
    return 'border-border opacity-50';
  };
  
  return (
    <div 
      className={cn(
        "p-3 border-2 rounded-lg transition-all duration-300",
        getOptionStyle(),
        isAnswered && "cursor-default"
      )}
      onClick={() => !isAnswered && onSelect(option)}
    >
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium border transition-colors",
          isAnswered && isCorrect ? 'border-green-500 bg-green-500 text-white' :
          isAnswered && isSelectedWrong ? 'border-destructive bg-destructive text-white' :
          selected ? 'border-primary bg-primary text-white' : 
          'border-muted-foreground bg-muted'
        )}>
          {isAnswered && isCorrect ? <CheckCircle2 className="w-4 h-4" /> :
           isAnswered && isSelectedWrong ? <XCircle className="w-4 h-4" /> :
           String.fromCharCode(65 + index)}
        </div>
        <div className="flex-1 font-medium">{option}</div>
        {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
        {isAnswered && isSelectedWrong && <XCircle className="w-5 h-5 text-destructive" />}
      </div>
    </div>
  );
};

interface ImageQuizContentProps {
  question: QuizQuestion;
  onComplete: (isCorrect: boolean, selectedAnswer: string) => void;
  isLoading?: boolean;
  isChallenge?: boolean;
}

const ImageQuizContent: React.FC<ImageQuizContentProps> = ({
  question,
  onComplete,
  isLoading = false,
  isChallenge = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
  }, [question.id]);

  // Store image question in local storage for answer page retrieval
  useEffect(() => {
    if (question && question.questionType === 'image') {
      const cachedQuestions = localStorage.getItem('image_quiz_questions') || '[]';
      const imageQuestions = JSON.parse(cachedQuestions);
      
      const existingQuestion = imageQuestions.find((q: QuizQuestion) => q.id === question.id);
      if (!existingQuestion) {
        imageQuestions.push(question);
        localStorage.setItem('image_quiz_questions', JSON.stringify(imageQuestions));
      }
    }
  }, [question]);

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    const correct = option === question.correctAnswer;
    setIsCorrect(correct);
    
    // Auto-advance after showing feedback
    setTimeout(() => {
      onComplete(correct, option);
    }, 1500);
  };

  if (isLoading) {
    return (
      <Card className="quiz-card animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48 w-full rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="quiz-card fun-card overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-center">
          <span className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1",
            question.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {question.difficulty}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Award size={14} />
            {question.category}
          </span>
        </div>
        <CardTitle className="text-xl flex items-center gap-2">
          <ImageIcon className="text-primary h-5 w-5" />
          {question.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
            <img
              src={question.imageUrl}
              alt={`${question.question} - quiz question image`}
              width={640}
              height={360}
              className="object-contain w-full h-full"
              loading="eager"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
        )}
        <div className="space-y-3 mt-4">
          {question.options.map((option, index) => (
            <ImageQuizOption
              key={index}
              option={option}
              index={index}
              selected={selectedOption === option}
              isAnswered={isAnswered}
              isCorrect={option === question.correctAnswer}
              isSelectedWrong={isAnswered && selectedOption === option && option !== question.correctAnswer}
              onSelect={handleSelectOption}
            />
          ))}
        </div>
        
        {/* Inline Feedback */}
        {isAnswered && (
          <div className={cn(
            "mt-4 p-4 rounded-xl text-center font-medium animate-fade-in",
            isCorrect
              ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30"
              : "bg-destructive/10 text-destructive border border-destructive/30"
          )}>
            {isCorrect ? (
              <div className="flex flex-col items-center gap-2">
                <span className="flex items-center justify-center gap-2 text-lg">
                  <CheckCircle2 className="w-6 h-6" />
                  Correct! 🎉
                </span>
                {question.explanation && (
                  <p className="text-sm opacity-80 mt-1">{question.explanation}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="flex items-center justify-center gap-2 text-lg">
                  <XCircle className="w-6 h-6" />
                  Wrong!
                </span>
                <span className="text-sm">
                  Correct answer: <strong>{question.correctAnswer}</strong>
                </span>
                {question.explanation && (
                  <p className="text-sm opacity-80 mt-1">{question.explanation}</p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Loading next indicator */}
        {isAnswered && (
          <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading next question...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageQuizContent;
