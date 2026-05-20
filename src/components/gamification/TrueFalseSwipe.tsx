import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { Check, X, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TrueFalseSwipeProps {
  questions: QuizQuestion[];
  onGameComplete: (score: number, total: number) => void;
  timeLimit?: number; // in seconds
}

export const TrueFalseSwipe: React.FC<TrueFalseSwipeProps> = ({
  questions,
  onGameComplete,
  timeLimit = 60
}) => {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Generate a True/False statement for the current question
  const [currentStatement, setCurrentStatement] = useState<{ text: string; isTrue: boolean } | null>(null);

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const q = questions[currentIndex];
      // 50% chance to show the correct answer (True), 50% chance to show a wrong option (False)
      const showTrue = Math.random() > 0.5;
      
      const correctOption = q.correctAnswer;
      const wrongOptions = q.options.filter(o => o !== q.correctAnswer);
      
      let answerText = '';
      if (showTrue && correctOption) {
        answerText = correctOption;
      } else if (wrongOptions.length > 0) {
        const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        answerText = randomWrong;
      } else {
        // Fallback if no options are properly formatted
        answerText = 'Unknown';
      }

      setCurrentStatement({
        text: `Q: ${q.question}\n\nA: ${answerText}`,
        isTrue: showTrue
      });
    } else if (currentIndex >= questions.length && questions.length > 0) {
      handleGameOver();
    }
  }, [currentIndex, questions]);

  useEffect(() => {
    if (isGameOver || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, questions]);

  const handleGameOver = () => {
    setIsGameOver(true);
    setTimeout(() => {
      onGameComplete(score, currentIndex);
    }, 1500);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isGameOver || !currentStatement || swipeDirection !== null) return;

    setSwipeDirection(direction);
    
    // Evaluate
    const userSaidTrue = direction === 'right';
    const isCorrect = userSaidTrue === currentStatement.isTrue;

    if (isCorrect) {
      setScore(s => s + 1);
      toast({ title: "Correct!", duration: 1000, className: "bg-green-50" });
    } else {
      toast({ title: "Wrong!", duration: 1000, variant: "destructive" });
    }

    // Wait for animation to finish before moving to next card
    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentIndex(prev => prev + 1);
    }, 400); // 400ms CSS transition
  };

  if (questions.length === 0) {
    return <div className="p-8 text-center text-slate-500">Loading questions...</div>;
  }

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-50 rounded-3xl p-8 text-center animate-in zoom-in">
        <h2 className="text-4xl font-black text-primary mb-4">Time's Up!</h2>
        <p className="text-xl text-slate-600 mb-8">You got <span className="font-bold text-green-600">{score}</span> correct!</p>
        <Button onClick={() => onGameComplete(score, currentIndex)}>Continue</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full">
      {/* HUD */}
      <div className="flex justify-between w-full mb-6 px-4">
        <div className="flex items-center gap-2 font-bold text-slate-700 bg-white px-4 py-2 rounded-full shadow-sm">
          <Timer className={cn("w-5 h-5", timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-blue-500")} />
          <span className={timeLeft <= 10 ? "text-red-500" : ""}>00:{timeLeft.toString().padStart(2, '0')}</span>
        </div>
        <div className="font-bold text-slate-700 bg-white px-4 py-2 rounded-full shadow-sm">
          Score: <span className="text-green-500">{score}</span>
        </div>
      </div>

      {/* Swipe Area */}
      <div className="relative w-full h-[400px] flex items-center justify-center perspective-[1000px]">
        {currentStatement && (
          <div 
            className={cn(
              "absolute w-full h-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 flex flex-col justify-center items-center text-center transition-all duration-300 select-none touch-none",
              swipeDirection === 'left' ? "-translate-x-full -rotate-12 opacity-0" : "",
              swipeDirection === 'right' ? "translate-x-full rotate-12 opacity-0" : ""
            )}
          >
            {swipeDirection === 'left' && (
              <div className="absolute top-8 right-8 border-4 border-red-500 text-red-500 text-3xl font-black px-4 py-2 rounded-xl rotate-12 opacity-80 z-10">
                FALSE
              </div>
            )}
            {swipeDirection === 'right' && (
              <div className="absolute top-8 left-8 border-4 border-green-500 text-green-500 text-3xl font-black px-4 py-2 rounded-xl -rotate-12 opacity-80 z-10">
                TRUE
              </div>
            )}

            <p className="text-2xl font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
              {currentStatement.text}
            </p>
            <p className="text-sm text-slate-400 mt-8">Is this statement true or false?</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-8 mt-8 w-full">
        <button 
          onClick={() => handleSwipe('left')}
          disabled={swipeDirection !== null}
          className="w-20 h-20 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center hover:scale-110 hover:bg-red-50 transition-all text-red-500 disabled:opacity-50"
        >
          <X className="w-10 h-10" />
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          disabled={swipeDirection !== null}
          className="w-20 h-20 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center hover:scale-110 hover:bg-green-50 transition-all text-green-500 disabled:opacity-50"
        >
          <Check className="w-10 h-10" />
        </button>
      </div>
      <p className="text-slate-400 text-xs mt-6">Swipe left for FALSE, swipe right for TRUE</p>
    </div>
  );
};
