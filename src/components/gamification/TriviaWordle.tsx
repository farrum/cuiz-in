import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trophy, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TriviaWordleProps {
  clue: string;
  targetWord: string;
  onComplete: (gemsEarned: number) => void;
}

export const TriviaWordle: React.FC<TriviaWordleProps> = ({
  clue,
  targetWord,
  onComplete
}) => {
  const WORD_LENGTH = targetWord.length;
  const MAX_GUESSES = 6;
  const { toast } = useToast();

  const [guesses, setGuesses] = useState<string[]>(Array(MAX_GUESSES).fill(''));
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;

      if (e.key === 'Enter') {
        submitGuess();
      } else if (e.key === 'Backspace') {
        setGuesses(prev => {
          const newGuesses = [...prev];
          newGuesses[currentGuessIndex] = newGuesses[currentGuessIndex].slice(0, -1);
          return newGuesses;
        });
      } else if (/^[A-Za-z]$/.test(e.key)) {
        setGuesses(prev => {
          const newGuesses = [...prev];
          if (newGuesses[currentGuessIndex].length < WORD_LENGTH) {
            newGuesses[currentGuessIndex] += e.key.toUpperCase();
          }
          return newGuesses;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuessIndex, guesses, isGameOver, WORD_LENGTH]);

  const submitGuess = () => {
    const currentGuess = guesses[currentGuessIndex];
    if (currentGuess.length !== WORD_LENGTH) {
      toast({ title: 'Not enough letters', variant: 'destructive', duration: 1000 });
      return;
    }

    if (currentGuess === targetWord.toUpperCase()) {
      setIsGameOver(true);
      setHasWon(true);
      const gemsEarned = (MAX_GUESSES - currentGuessIndex) * 10;
      setTimeout(() => onComplete(gemsEarned), 2000);
    } else if (currentGuessIndex === MAX_GUESSES - 1) {
      setIsGameOver(true);
      setTimeout(() => onComplete(0), 2000);
    } else {
      setCurrentGuessIndex(prev => prev + 1);
    }
  };

  const getLetterStatus = (letter: string, index: number, guess: string) => {
    const target = targetWord.toUpperCase();
    if (target[index] === letter) return 'correct';
    if (target.includes(letter)) {
      // Handle multiple occurrences
      const letterCountInTarget = target.split('').filter(l => l === letter).length;
      const letterCountInGuessSoFar = guess.slice(0, index + 1).split('').filter(l => l === letter).length;
      if (letterCountInGuessSoFar <= letterCountInTarget) return 'present';
    }
    return 'absent';
  };

  const renderGrid = () => {
    return (
      <div className="grid gap-2 mb-8" style={{ gridTemplateRows: `repeat(${MAX_GUESSES}, 1fr)` }}>
        {guesses.map((guess, rowIdx) => (
          <div key={rowIdx} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${WORD_LENGTH}, 1fr)` }}>
            {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => {
              const letter = guess[colIdx] || '';
              const isSubmitted = rowIdx < currentGuessIndex || (isGameOver && rowIdx === currentGuessIndex);
              const status = isSubmitted ? getLetterStatus(letter, colIdx, guess) : 'empty';
              
              let bgColor = 'bg-white';
              let textColor = 'text-slate-800';
              let borderColor = 'border-slate-200';

              if (isSubmitted) {
                textColor = 'text-white';
                borderColor = 'border-transparent';
                if (status === 'correct') bgColor = 'bg-green-500';
                else if (status === 'present') bgColor = 'bg-yellow-500';
                else bgColor = 'bg-slate-500';
              } else if (letter) {
                borderColor = 'border-slate-400';
              }

              return (
                <div 
                  key={colIdx}
                  className={cn(
                    "w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl font-black rounded-lg border-2 uppercase transition-all duration-500",
                    bgColor, textColor, borderColor,
                    isSubmitted && "animate-in zoom-in spin-in-12"
                  )}
                  style={{ animationDelay: `${colIdx * 100}ms` }}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  const handleVirtualKey = (key: string) => {
    if (isGameOver) return;
    
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      setGuesses(prev => {
        const newGuesses = [...prev];
        newGuesses[currentGuessIndex] = newGuesses[currentGuessIndex].slice(0, -1);
        return newGuesses;
      });
    } else {
      setGuesses(prev => {
        const newGuesses = [...prev];
        if (newGuesses[currentGuessIndex].length < WORD_LENGTH) {
          newGuesses[currentGuessIndex] += key;
        }
        return newGuesses;
      });
    }
  };

  if (isGameOver && hasWon) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-green-50 rounded-3xl p-8 text-center animate-in zoom-in shadow-xl">
        <Trophy className="w-24 h-24 text-green-500 mb-6" />
        <h2 className="text-4xl font-black text-green-700 mb-4">Brilliant!</h2>
        <p className="text-xl text-green-600 mb-8 font-bold">You guessed the word: {targetWord.toUpperCase()}</p>
        <p className="text-slate-500 mb-4">Gems being added to your account...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full bg-slate-50 rounded-3xl p-6 md:p-8 shadow-xl">
      <div className="flex items-center gap-3 w-full mb-8 bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800">
        <HelpCircle className="w-6 h-6 shrink-0" />
        <p className="font-semibold text-sm md:text-base leading-snug">{clue}</p>
      </div>

      {renderGrid()}

      {isGameOver && !hasWon && (
        <div className="mb-6 bg-red-100 text-red-700 px-6 py-3 rounded-xl font-bold">
          The word was: {targetWord.toUpperCase()}
        </div>
      )}

      {/* Virtual Keyboard */}
      <div className="flex flex-col gap-2 w-full mt-4">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 md:gap-2 w-full">
            {row.map(key => (
              <button
                key={key}
                onClick={() => handleVirtualKey(key)}
                className={cn(
                  "h-12 md:h-14 font-bold rounded flex items-center justify-center text-xs md:text-sm bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors",
                  key === 'ENTER' || key === 'BACKSPACE' ? "px-2 md:px-4" : "flex-1 max-w-[40px]"
                )}
              >
                {key === 'BACKSPACE' ? '⌫' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
