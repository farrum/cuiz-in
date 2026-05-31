import React, { useState } from 'react';
import { QuizQuestion } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { ScratchCard } from '@/components/gamification/ScratchCard';
import { Eye, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageRevealProps {
  question: QuizQuestion;
  onComplete: (isCorrect: boolean) => void;
  onSkip: () => void;
}

export const ImageReveal: React.FC<ImageRevealProps> = ({
  question,
  onComplete,
  onSkip
}) => {
  const [hasScratched, setHasScratched] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOptionSelect = (optionText: string, correctStatus: boolean) => {
    setSelectedOption(optionText);
    
    if (correctStatus) {
      toast({ title: 'Brilliant!', description: 'You correctly identified the image!', className: 'bg-green-50' });
    } else {
      toast({ title: 'Not quite!', description: 'That was the wrong answer.', variant: 'destructive' });
    }

    setTimeout(() => {
      onComplete(correctStatus);
    }, 2000);
  };

  const imageToReveal = question.imageUrl || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80"; // Fallback beautiful gradient if no image exists for the question

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full bg-card border-2 border-primary/20 rounded-3xl p-6 md:p-8 animate-in zoom-in-95 shadow-xl">
      <div className="flex items-center justify-between w-full mb-6">
        <div className="flex items-center gap-2 text-primary">
          <ImageIcon className="w-6 h-6" />
          <h2 className="font-bold uppercase tracking-wider text-sm md:text-base">Scratch & Guess</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-slate-400">
          Skip Event
        </Button>
      </div>

      <p className="text-xl md:text-2xl font-bold text-center mb-8 text-slate-800">
        {question.question}
      </p>

      {/* Interactive Scratch Area */}
      <div className="relative mb-10 w-full max-w-[400px] aspect-video flex justify-center items-center">
        {!hasScratched && (
          <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full z-20 animate-bounce shadow-md flex items-center gap-1">
            <Eye className="w-3 h-3" /> Scratch to Reveal
          </div>
        )}
        <ScratchCard
          width={400}
          height={225}
          coverColor="#475569" // Slate 600
          brushSize={30}
          revealThreshold={0.4}
          onComplete={() => setHasScratched(true)}
        >
          <img 
            src={imageToReveal} 
            alt="Scratch to reveal the hidden reward image" 
            className="w-full h-full object-cover rounded-xl"
            crossOrigin="anonymous"
          />
        </ScratchCard>
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        {question.options.map((option, idx) => {
          const optionText = typeof option === 'string' ? option : (option as any).text;
          const isCorrectOption = typeof option === 'string' ? option === question.correctAnswer : (option as any).isCorrect;
          
          let buttonClass = "h-auto p-4 text-left justify-start whitespace-normal text-md";
          
          if (selectedOption !== null) {
            if (isCorrectOption) {
              buttonClass = cn(buttonClass, "bg-green-500 hover:bg-green-600 text-white border-green-600");
            } else if (selectedOption === optionText) {
              buttonClass = cn(buttonClass, "bg-red-500 hover:bg-red-600 text-white border-red-600");
            } else {
              buttonClass = cn(buttonClass, "opacity-50");
            }
          }

          return (
            <Button
              key={idx}
              variant="outline"
              className={buttonClass}
              disabled={selectedOption !== null}
              onClick={() => handleOptionSelect(optionText, isCorrectOption)}
            >
              {optionText}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
