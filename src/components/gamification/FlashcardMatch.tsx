import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { Timer, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FlashcardMatchProps {
  questions: QuizQuestion[];
  onGameComplete: (score: number) => void;
  timeLimit?: number; // in seconds
}

interface CardType {
  id: string;
  type: 'question' | 'answer';
  text: string;
  pairId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const FlashcardMatch: React.FC<FlashcardMatchProps> = ({
  questions,
  onGameComplete,
  timeLimit = 90
}) => {
  const { toast } = useToast();
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Initialize Game Board
  useEffect(() => {
    if (questions.length === 0) return;

    // Take up to 6 questions to make a 12-card grid
    const gameQuestions = questions.slice(0, 6);
    
    let generatedCards: CardType[] = [];
    
    gameQuestions.forEach(q => {
      const correctOption = q.correctAnswer || q.options[0];
      if (!correctOption) return;

      generatedCards.push({
        id: `q-${q.id}`,
        type: 'question',
        text: q.question,
        pairId: q.id,
        isFlipped: false,
        isMatched: false
      });

      generatedCards.push({
        id: `a-${q.id}`,
        type: 'answer',
        text: correctOption,
        pairId: q.id,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle the cards
    generatedCards = generatedCards.sort(() => Math.random() - 0.5);
    setCards(generatedCards);
  }, [questions]);

  // Timer
  useEffect(() => {
    if (isGameOver || cards.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, cards]);

  // Match logic
  useEffect(() => {
    if (flippedIndices.length === 2) {
      setIsChecking(true);
      const [firstIndex, secondIndex] = flippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.pairId === secondCard.pairId && firstCard.type !== secondCard.type) {
        // It's a match!
        setTimeout(() => {
          setCards(prev => {
            const newCards = [...prev];
            newCards[firstIndex].isMatched = true;
            newCards[secondIndex].isMatched = true;
            return newCards;
          });
          setMatches(m => m + 1);
          setFlippedIndices([]);
          setIsChecking(false);
          
          toast({ title: 'Match Found!', className: 'bg-green-50 text-green-700', duration: 1000 });

          // Check Win Condition
          if (matches + 1 === cards.length / 2) {
            setIsGameOver(true);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => {
            const newCards = [...prev];
            newCards[firstIndex].isFlipped = false;
            newCards[secondIndex].isFlipped = false;
            return newCards;
          });
          setFlippedIndices([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [flippedIndices, cards, matches, toast]);

  const handleCardClick = (index: number) => {
    if (isChecking || isGameOver || cards[index].isMatched || cards[index].isFlipped) return;

    setCards(prev => {
      const newCards = [...prev];
      newCards[index].isFlipped = true;
      return newCards;
    });

    setFlippedIndices(prev => [...prev, index]);
  };

  if (cards.length === 0) {
    return <div className="p-8 text-center text-slate-500">Generating Flashcards...</div>;
  }

  if (isGameOver) {
    const isWin = matches === cards.length / 2;
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-slate-50 rounded-3xl p-8 text-center animate-in zoom-in">
        <Trophy className={cn("w-16 h-16 mb-4", isWin ? "text-yellow-500" : "text-slate-400")} />
        <h2 className="text-4xl font-black text-primary mb-4">{isWin ? "You Win!" : "Time's Up!"}</h2>
        <p className="text-xl text-slate-600 mb-8">You found <span className="font-bold text-blue-600">{matches}</span> matches.</p>
        <Button onClick={() => onGameComplete(matches * 2)}>Continue</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto w-full">
      {/* HUD */}
      <div className="flex justify-between w-full mb-6 px-4">
        <div className="flex items-center gap-2 font-bold text-slate-700 bg-white px-4 py-2 rounded-full shadow-sm">
          <Timer className={cn("w-5 h-5", timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-blue-500")} />
          <span className={timeLeft <= 10 ? "text-red-500" : ""}>00:{timeLeft.toString().padStart(2, '0')}</span>
        </div>
        <div className="font-bold text-slate-700 bg-white px-4 py-2 rounded-full shadow-sm">
          Matches: <span className="text-green-500">{matches}/{cards.length / 2}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full p-4 perspective-[1000px]">
        {cards.map((card, index) => (
          <div 
            key={card.id}
            className={cn(
              "relative h-32 md:h-40 cursor-pointer group",
              card.isMatched ? "opacity-0 pointer-events-none transition-opacity duration-500" : ""
            )}
            onClick={() => handleCardClick(index)}
          >
            <div className={cn(
              "w-full h-full transition-transform duration-500 preserve-3d relative rounded-xl shadow-md",
              card.isFlipped ? "rotate-y-180" : "hover:-translate-y-1"
            )}>
              {/* Front of card (Hidden state) */}
              <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center border-2 border-white/20">
                <span className="text-white/50 font-black text-4xl">?</span>
              </div>
              
              {/* Back of card (Revealed state) */}
              <div className={cn(
                "absolute w-full h-full backface-hidden rotate-y-180 rounded-xl p-3 flex items-center justify-center text-center border-2",
                card.type === 'question' ? "bg-slate-50 border-blue-200" : "bg-blue-50 border-indigo-200"
              )}>
                <p className="text-xs md:text-sm font-bold text-slate-700 overflow-hidden text-ellipsis line-clamp-4">
                  {card.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
