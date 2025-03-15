
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { QuizQuestion, STORAGE_KEYS } from '@/utils/quizData';
import { cn } from '@/utils/animations';

interface QuizCardProps {
  question: QuizQuestion;
  onComplete: (isCorrect: boolean) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ question, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [animation, setAnimation] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Animation effect when a new question is received
  useEffect(() => {
    setAnimation(true);
    const timer = setTimeout(() => setAnimation(false), 500);
    return () => clearTimeout(timer);
  }, [question]);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
  }, [question]);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    
    // Save completed question to localStorage
    const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
    if (!completedQuestions.includes(question.id)) {
      completedQuestions.push(question.id);
      localStorage.setItem(STORAGE_KEYS.COMPLETED_QUESTIONS, JSON.stringify(completedQuestions));
    }
    
    const isCorrect = question.correctAnswer === option;
    
    // Tell parent component about the result
    onComplete(isCorrect);
    
    // Navigate to answer page
    navigate(`/answer/${question.id}/${encodeURIComponent(option)}`);
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
          {question.difficulty}
        </span>
      </div>
      
      <h3 className="text-2xl font-medium mb-8">{question.question}</h3>
      
      <div className="grid grid-cols-1 gap-4 mb-6">
        {question.options.map((option, index) => (
          <button
            key={option}
            onClick={() => handleOptionClick(option)}
            className={cn(
              "quiz-option group text-left",
              selectedOption === option && "quiz-option-selected"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative z-10 flex items-center justify-between">
              <span className="flex-1">{option}</span>
            </div>
            
            <div className={cn(
              "absolute inset-0 w-0 bg-accent/10 transition-all duration-300",
              "group-hover:w-full"
            )} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizCard;
