import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface Flashcard {
  id: string;
  type: 'term' | 'definition';
  content: string;
  pairId: string;
}

interface FlashcardMatchProps {
  cards: Flashcard[];
  onComplete: (timeInSeconds: number) => void;
}

export const FlashcardMatch: React.FC<FlashcardMatchProps> = ({
  cards,
  onComplete
}) => {
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    // Shuffle cards on mount
    setShuffledCards([...cards].sort(() => Math.random() - 0.5));
    setStartTime(Date.now());
  }, [cards]);

  const handleCardClick = (index: number) => {
    if (selectedCards.length === 2) return; // Prevent clicking more than 2
    if (selectedCards.includes(index)) return; // Prevent clicking same card
    if (matchedPairs.includes(shuffledCards[index].pairId)) return; // Prevent clicking matched card

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const card1 = shuffledCards[newSelected[0]];
      const card2 = shuffledCards[newSelected[1]];

      if (card1.pairId === card2.pairId && card1.type !== card2.type) {
        // Match!
        setTimeout(() => {
          setMatchedPairs([...matchedPairs, card1.pairId]);
          setSelectedCards([]);
          
          // Check if game is over
          if (matchedPairs.length + 1 === cards.length / 2) {
            const timeTaken = Math.floor((Date.now() - (startTime || Date.now())) / 1000);
            onComplete(timeTaken);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Match the Pairs</h2>
        <span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded-full">
          {matchedPairs.length} / {cards.length / 2}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {shuffledCards.map((card, index) => {
          const isSelected = selectedCards.includes(index);
          const isMatched = matchedPairs.includes(card.pairId);

          return (
            <div
              key={`${card.id}-${index}`}
              onClick={() => handleCardClick(index)}
              className={cn(
                "h-32 rounded-xl p-4 flex items-center justify-center text-center cursor-pointer transition-all duration-300 select-none shadow-sm border-2",
                !isSelected && !isMatched ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md" : "",
                isSelected ? "bg-blue-50 border-blue-400 scale-105 shadow-md" : "",
                isMatched ? "bg-green-50 border-green-200 opacity-50 scale-95 pointer-events-none" : ""
              )}
            >
              <span className={cn(
                "font-medium",
                card.type === 'term' ? "text-slate-800 text-lg" : "text-slate-600 text-sm"
              )}>
                {card.content}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
