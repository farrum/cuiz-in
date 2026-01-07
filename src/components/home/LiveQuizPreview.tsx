
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const sampleQuestions = [
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1,
    category: "Science"
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Rembrandt"],
    correctIndex: 2,
    category: "Art"
  },
  {
    question: "What is the capital of Japan?",
    options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
    correctIndex: 2,
    category: "Geography"
  }
];

const LiveQuizPreview: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentQuestion = sampleQuestions[currentQuestionIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      
      // Simulate answer selection
      setTimeout(() => {
        const randomOption = Math.floor(Math.random() * 4);
        setSelectedOption(randomOption);
        
        setTimeout(() => {
          setShowResult(true);
          
          setTimeout(() => {
            setIsAnimating(false);
            setSelectedOption(null);
            setShowResult(false);
            setCurrentQuestionIndex((prev) => (prev + 1) % sampleQuestions.length);
          }, 1500);
        }, 800);
      }, 1000);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      if (selectedOption === index) {
        return 'border-primary bg-primary/10';
      }
      return 'border-border hover:border-primary/50';
    }
    
    if (index === currentQuestion.correctIndex) {
      return 'border-accent bg-accent/10';
    }
    if (selectedOption === index && index !== currentQuestion.correctIndex) {
      return 'border-destructive bg-destructive/10';
    }
    return 'border-border opacity-50';
  };

  return (
    <div className="premium-card max-w-md mx-auto lg:mx-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {currentQuestion.category}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-accent">
          <Sparkles className="w-4 h-4" />
          <span>+10 pts</span>
        </div>
      </div>

      {/* Question */}
      <div className={cn(
        "transition-all duration-300",
        isAnimating && !showResult ? "opacity-90" : "opacity-100"
      )}>
        <h4 className="text-lg font-semibold mb-4 leading-snug">
          {currentQuestion.question}
        </h4>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-300",
                getOptionStyle(index)
              )}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="font-medium">{option}</span>
              </div>
              
              {showResult && index === currentQuestion.correctIndex && (
                <CheckCircle2 className="w-5 h-5 text-accent animate-scale-in" />
              )}
              {showResult && selectedOption === index && index !== currentQuestion.correctIndex && (
                <XCircle className="w-5 h-5 text-destructive animate-scale-in" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mt-6">
        {sampleQuestions.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentQuestionIndex 
                ? "w-6 bg-primary" 
                : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default LiveQuizPreview;
