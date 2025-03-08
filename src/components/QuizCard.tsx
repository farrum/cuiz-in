
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { QuizQuestion, checkAnswer, STORAGE_KEYS } from '../utils/quizData';
import { cn } from '@/utils/animations';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuizCardProps {
  question: QuizQuestion;
  onComplete: (points: number, correct: boolean) => void;
  onNext: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ question, onComplete, onNext }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [animation, setAnimation] = useState(false);
  const { toast } = useToast();

  // Animation effect when a new question is received
  useEffect(() => {
    setAnimation(true);
    const timer = setTimeout(() => setAnimation(false), 500);
    return () => clearTimeout(timer);
  }, [question]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
  }, [question]);

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    const correct = checkAnswer(question, option);
    setIsCorrect(correct);
    
    const pointsEarned = correct ? question.points : 0;
    
    // Save completed question to localStorage
    const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
    if (!completedQuestions.includes(question.id)) {
      completedQuestions.push(question.id);
      localStorage.setItem(STORAGE_KEYS.COMPLETED_QUESTIONS, JSON.stringify(completedQuestions));
    }
    
    // Show toast with result
    toast({
      title: correct ? "Correct!" : "Incorrect",
      description: correct 
        ? `You earned ${pointsEarned} points!` 
        : `The correct answer was ${question.correctAnswer}`,
      variant: correct ? "default" : "destructive",
    });
    
    // Tell parent component about the result
    onComplete(pointsEarned, correct);
  };

  const getOptionClass = (option: string) => {
    if (!isAnswered) {
      return cn("quiz-option", selectedOption === option && "quiz-option-selected");
    }
    
    if (option === question.correctAnswer) {
      return "quiz-option quiz-option-correct";
    }
    
    if (selectedOption === option && option !== question.correctAnswer) {
      return "quiz-option quiz-option-incorrect";
    }
    
    return "quiz-option opacity-60";
  };

  return (
    <div className={cn(
      "quiz-card flex flex-col w-full max-w-3xl mx-auto transition-all duration-500",
      animation ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
    )}>
      <div className="absolute -z-10 inset-0">
        <div className="animated-bg top-0 left-1/4 w-72 h-72 rounded-full bg-primary/20" />
        <div className="animated-bg bottom-0 right-1/4 w-96 h-96 rounded-full bg-accent/20" />
      </div>
      
      <div className="mb-2 text-xs text-muted-foreground">
        <span className="inline-block px-3 py-1 rounded-full bg-secondary">
          {question.category}
        </span>
        <span className="ml-2 inline-block px-3 py-1 rounded-full bg-secondary">
          {question.difficulty} • {question.points} pts
        </span>
      </div>
      
      <h3 className="text-2xl font-medium mb-8">{question.question}</h3>
      
      <div className="grid grid-cols-1 gap-4 mb-6">
        {question.options.map((option, index) => (
          <button
            key={option}
            onClick={() => handleOptionClick(option)}
            disabled={isAnswered}
            className={cn(
              getOptionClass(option),
              "group text-left",
              isAnswered && option === question.correctAnswer && "ring-2 ring-green-500"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative z-10 flex items-center justify-between">
              <span className="flex-1">{option}</span>
              {isAnswered && option === question.correctAnswer && (
                <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
              )}
              {isAnswered && selectedOption === option && option !== question.correctAnswer && (
                <XCircle className="w-5 h-5 text-red-500 ml-2" />
              )}
            </div>
            
            <div className={cn(
              "absolute inset-0 w-0 bg-accent/10 transition-all duration-300",
              !isAnswered && "group-hover:w-full"
            )} />
          </button>
        ))}
      </div>
      
      {isAnswered && (
        <div className="mt-4 flex justify-end animate-fade-in">
          <Button onClick={onNext} className="btn-shine">
            Next Question
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuizCard;
