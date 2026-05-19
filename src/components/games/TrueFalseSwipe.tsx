import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  isTrue: boolean;
}

interface TrueFalseSwipeProps {
  questions: Question[];
  onComplete: (score: number) => void;
}

export const TrueFalseSwipe: React.FC<TrueFalseSwipeProps> = ({
  questions,
  onComplete
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (swipeDirection) return; // Prevent double swipe
    
    setSwipeDirection(direction);
    
    const currentQ = questions[currentIndex];
    const answeredTrue = direction === 'right';
    
    if (answeredTrue === currentQ.isTrue) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      setSwipeDirection(null);
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(i => i + 1);
      } else {
        onComplete(score + (answeredTrue === currentQ.isTrue ? 1 : 0));
      }
    }, 300); // Wait for animation
  };

  if (currentIndex >= questions.length) {
    return <div className="p-8 text-center">Game Over!</div>;
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col items-center max-w-sm w-full mx-auto p-4 overflow-hidden">
      <div className="flex justify-between w-full mb-6 px-4 text-sm font-bold text-slate-500">
        <span>Question {currentIndex + 1}/{questions.length}</span>
        <span>Score: {score}</span>
      </div>

      <div className="relative w-full aspect-[3/4] max-h-[400px]">
        {/* The Card */}
        <div 
          className={cn(
            "absolute inset-0 bg-white rounded-3xl shadow-xl border-2 border-slate-100 flex flex-col justify-center items-center p-8 text-center transition-all duration-300 ease-out",
            swipeDirection === 'left' && "-translate-x-full rotate-[-20deg] opacity-0",
            swipeDirection === 'right' && "translate-x-full rotate-[20deg] opacity-0"
          )}
        >
          <h2 className="text-2xl font-bold text-slate-800 leading-snug">
            {currentQ.text}
          </h2>
          
          <div className="absolute bottom-8 w-full px-8 flex justify-between opacity-50">
            <span className="text-red-500 font-bold flex items-center gap-1"><X size={16}/> False</span>
            <span className="text-green-500 font-bold flex items-center gap-1">True <Check size={16}/></span>
          </div>
        </div>
      </div>

      {/* Buttons for those who don't want to physically swipe */}
      <div className="flex gap-6 mt-8">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-white shadow-md border-2 border-red-100 flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 transition-all"
        >
          <X size={32} />
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-white shadow-md border-2 border-green-100 flex items-center justify-center text-green-500 hover:bg-green-50 hover:scale-110 transition-all"
        >
          <Check size={32} />
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-4">Swipe or tap</p>
    </div>
  );
};
