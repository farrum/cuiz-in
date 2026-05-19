import React, { useState } from 'react';
import { QuizQuestion } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { Skull, Flame, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BossFightProps {
  question: QuizQuestion;
  currentSessionGems: number; // Gems earned in the current quiz session (not lifetime)
  onComplete: (success: boolean) => void;
  onDecline: () => void;
}

export const BossFight: React.FC<BossFightProps> = ({
  question,
  currentSessionGems,
  onComplete,
  onDecline
}) => {
  const [phase, setPhase] = useState<'intro' | 'combat' | 'result'>('intro');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleOptionSelect = (optionText: string, correctStatus: boolean) => {
    setSelectedOption(optionText);
    setIsCorrect(correctStatus);
    setPhase('result');
    
    if (correctStatus) {
      toast({ title: 'Boss Defeated!', description: 'Your gems have been doubled!', className: 'bg-green-50' });
    } else {
      toast({ title: 'You Died!', description: 'You lost all gems earned this session.', variant: 'destructive' });
    }

    setTimeout(() => {
      onComplete(correctStatus);
    }, 3000);
  };

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-900 border-4 border-red-900 rounded-3xl p-8 text-center animate-in zoom-in-95 shadow-2xl relative overflow-hidden">
        {/* Animated Background Flames */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-red-600 to-transparent animate-pulse" />
        </div>

        <Skull className="w-24 h-24 text-red-500 mb-6 animate-bounce" />
        <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-widest">Boss Fight!</h2>
        <p className="text-xl text-red-400 mb-8 font-bold">10-Streak Reached</p>
        
        <div className="bg-black/50 p-6 rounded-2xl border border-red-800/50 mb-8 max-w-md w-full">
          <p className="text-slate-300 mb-4 text-lg">
            A challenger appears! Answer one <span className="text-red-400 font-bold">INSANE</span> difficulty question.
          </p>
          <div className="flex justify-between items-center text-left bg-slate-800/80 p-4 rounded-xl">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Win Condition</p>
              <p className="text-green-400 font-bold text-xl">Double your {currentSessionGems} Gems</p>
            </div>
            <div className="text-center">
              <span className="text-2xl">⚔️</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Lose Condition</p>
              <p className="text-red-500 font-bold text-xl">Lose everything</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full max-w-md">
          <Button 
            variant="outline" 
            size="lg" 
            className="flex-1 bg-transparent border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={onDecline}
          >
            Flee (Keep Gems)
          </Button>
          <Button 
            size="lg" 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={() => setPhase('combat')}
          >
            <Flame className="w-5 h-5 mr-2" /> Accept Duel
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'combat') {
    return (
      <div className="flex flex-col min-h-[400px] bg-slate-900 border-4 border-red-900 rounded-3xl p-6 md:p-8 animate-in slide-in-from-right relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
          <div className="text-center">
            <h3 className="text-red-500 font-black tracking-widest uppercase text-sm">Boss Question</h3>
            <p className="text-slate-400 text-xs">Double or Nothing</p>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center leading-relaxed">
          {question.question}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
          {question.options.map((option, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="h-auto p-4 text-left justify-start bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-500 whitespace-normal text-lg"
              onClick={() => handleOptionSelect(typeof option === 'string' ? option : (option as any).text, typeof option === 'string' ? option === question.correctAnswer : (option as any).isCorrect)}
            >
              {typeof option === 'string' ? option : (option as any).text}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[400px] border-4 rounded-3xl p-8 text-center animate-in zoom-in shadow-2xl",
      isCorrect ? "bg-green-900 border-green-500" : "bg-red-950 border-red-900"
    )}>
      {isCorrect ? (
        <CheckCircle className="w-24 h-24 text-green-400 mb-6" />
      ) : (
        <XCircle className="w-24 h-24 text-red-600 mb-6" />
      )}
      
      <h2 className={cn(
        "text-4xl font-black mb-4",
        isCorrect ? "text-green-300" : "text-red-500"
      )}>
        {isCorrect ? "VICTORY!" : "DEFEATED"}
      </h2>
      
      <p className="text-xl text-slate-300 mb-8 font-bold">
        {isCorrect 
          ? `You doubled your session earnings to ${currentSessionGems * 2} Gems!` 
          : `You lost the ${currentSessionGems} Gems earned this session.`}
      </p>

      <p className="text-slate-400 animate-pulse">Returning to normal quiz...</p>
    </div>
  );
};
