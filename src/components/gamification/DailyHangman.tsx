import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { fetchQuizQuestions } from '@/utils/quizDataService';
import { QuizQuestion } from '@/utils/types';
import { updateTotalGems, updateTotalStars } from '@/utils/rewardService';
import { MysteryBoxOpener } from './MysteryBoxOpener';
import { Sparkles, Coins, Star, HelpCircle, AlertCircle, Landmark } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface DailyHangmanProps {
  userId: string | null;
  onRefreshBalances: () => void;
}

export const DailyHangman: React.FC<DailyHangmanProps> = ({
  userId,
  onRefreshBalances
}) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [loading, setLoading] = useState(false);
  const [bidAmount, setBidAmount] = useState<number>(25);
  const [userGems, setUserGems] = useState(0);
  const [userStars, setUserStars] = useState(0);
  const [hasSocrates, setHasSocrates] = useState(false);
  const [socratesUsed, setSocratesUsed] = useState(false);

  // Trivia states
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [targetWord, setTargetWord] = useState<string>(''); // Cleaned word
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [revealWord, setRevealWord] = useState<string>(''); // Target answer including spaces

  // Chest opener modal
  const [openerOpen, setOpenerOpen] = useState(false);
  const [boxTier, setBoxTier] = useState<'bronze' | 'gold' | null>(null);

  const { toast } = useToast();
  const haptics = useHaptics();

  useEffect(() => {
    fetchBalancesAndCouncil();
  }, [userId, gameState]);

  const fetchBalancesAndCouncil = async () => {
    if (!userId) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('gems:points, stars')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        setUserGems(profile.gems || 0);
        setUserStars(profile.stars || 0);
      }

      // Check if Socrates is unlocked
      const { data: char } = await supabase
        .from('user_characters')
        .select('level')
        .eq('user_id', userId)
        .eq('character_id', 'socrates')
        .maybeSingle();
      setHasSocrates(char && char.level > 0 ? true : false);
    } catch (e) {
      console.error(e);
    }
  };

  const startNewGame = async () => {
    if (!userId) return;
    if (userGems < bidAmount) {
      toast({
        title: "Treasury Empty!",
        description: `You need at least ${bidAmount} Gems to place this bid.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setGuessedLetters(new Set());
    setWrongGuesses([]);
    setSocratesUsed(false);

    try {
      // Deduct gems bid at start to secure states
      await updateTotalGems(-bidAmount, userId);
      haptics('medium');

      // Fetch random question
      const questions = await fetchQuizQuestions();
      const q = questions[Math.floor(Math.random() * questions.length)];
      setQuestion(q);

      // Clean target word (A-Z only)
      const cleanAnswer = q.correctAnswer.toUpperCase().replace(/[^A-Z]/g, '');
      setTargetWord(cleanAnswer);
      setRevealWord(q.correctAnswer.toUpperCase());

      // Auto-guess symbols (anything not in A-Z)
      const autoGuessed = new Set<string>();
      for (let i = 0; i < q.correctAnswer.length; i++) {
        const char = q.correctAnswer[i].toUpperCase();
        if (char < 'A' || char > 'Z') {
          autoGuessed.add(char);
        }
      }
      setGuessedLetters(autoGuessed);
      setGameState('playing');
      onRefreshBalances();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error starting game",
        description: "Treasury failed to verify question deck.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuess = (letter: string) => {
    if (gameState !== 'playing' || guessedLetters.has(letter)) return;

    haptics('light');
    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    const isCorrect = targetWord.includes(letter);
    if (!isCorrect) {
      const newWrong = [...wrongGuesses, letter];
      setWrongGuesses(newWrong);
      haptics('warning');

      if (newWrong.length >= 6) {
        // Lose Game
        haptics('error');
        setGameState('lost');
      }
    } else {
      // Check win condition
      const won = targetWord.split('').every(char => newGuessed.has(char));
      if (won) {
        handleWin();
      }
    }
  };

  const handleWin = async () => {
    setGameState('won');
    haptics('success');
    confetti({ particleCount: 120, spread: 80 });

    try {
      // Call secure claim RPC (Double Gems + 30 Stars)
      const { data } = await (supabase as any).rpc('claim_hangman_victory', {
        user_uuid: userId,
        bid_amount: bidAmount
      });

      const tier = bidAmount >= 50 ? 'gold' : 'bronze';
      setBoxTier(tier);
      setOpenerOpen(true);
      onRefreshBalances();
      toast({
        title: "🛡️ PRISONER SAVED!",
        description: `You successfully saved the counselor! Earned +${bidAmount * 2} Gems & +30 Stars!`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Socrates Lifeline: Disables 4 incorrect letters from keyboard
  const handleUseSocrates = async () => {
    if (socratesUsed || !hasSocrates || userStars < 15) return;

    haptics('medium');
    try {
      await updateTotalStars(-15, userId);
      setUserStars(prev => prev - 15);
      setSocratesUsed(true);

      // Find wrong letters that haven't been guessed yet
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
      const unselectedWrongs = alphabet.filter(
        letter => !targetWord.includes(letter) && !guessedLetters.has(letter)
      );

      // Pick 4 wrong letters to eliminate
      const toEliminate = unselectedWrongs.sort(() => 0.5 - Math.random()).slice(0, 4);
      
      const newGuesses = new Set(guessedLetters);
      toEliminate.forEach(letter => newGuesses.add(letter));
      setGuessedLetters(newGuesses);

      toast({
        title: "Socrates' Wisdom",
        description: "Eliminated 4 incorrect letters from the keyboard scroll!",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setGameState('idle');
    setQuestion(null);
    setTargetWord('');
    setGuessedLetters(new Set());
    setWrongGuesses([]);
  };

  // Gallows SVG rendering
  const renderGallows = () => {
    const errorCount = wrongGuesses.length;
    return (
      <svg viewBox="0 0 100 100" className="w-44 h-44 stroke-amber-500 fill-none stroke-[3] stroke-linecap-round">
        {/* Gallows Pole Base */}
        <path d="M 10,90 L 90,90" />
        
        {/* Step 1: Vertical Post */}
        {errorCount >= 1 && <path d="M 30,90 L 30,10" className="animate-in fade-in duration-300" />}
        
        {/* Step 2: Crossbeam & Rope hook */}
        {errorCount >= 2 && <path d="M 30,10 L 70,10 L 70,25" className="animate-in fade-in duration-300" />}
        
        {/* Step 3: Prisoner Head */}
        {errorCount >= 3 && <circle cx="70" cy="32" r="7" className="animate-in zoom-in duration-300" />}
        
        {/* Step 4: Prisoner Torso */}
        {errorCount >= 4 && <path d="M 70,39 L 70,60" className="animate-in fade-in duration-300" />}
        
        {/* Step 5: Prisoner Arms */}
        {errorCount >= 5 && <path d="M 70,45 L 55,50 M 70,45 L 85,50" className="animate-in fade-in duration-300" />}
        
        {/* Step 6: Prisoner Legs (Defeat) */}
        {errorCount >= 6 && <path d="M 70,60 L 60,78 M 70,60 L 80,78" className="stroke-red-500 animate-in fade-in duration-300" />}
      </svg>
    );
  };

  return (
    <div className="w-full bg-slate-900 border-2 border-yellow-500/20 rounded-3xl p-6 shadow-md max-w-xl mx-auto flex flex-col items-center">
      
      {/* Header Info */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
          <Landmark className="text-yellow-500 w-5 h-5 fill-yellow-500/10" />
          Executioner's Gallows
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
          Embark on the daily Hangman challenge. Save the counsel to win double your bid & chests!
        </p>
      </div>

      {gameState === 'idle' && (
        <div className="flex flex-col gap-6 w-full items-center">
          {/* Bidding selection card */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 w-full text-center">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest block mb-2">
              SELECT YOUR GEMS BID
            </span>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[10, 25, 50, 100].map(amt => (
                <button
                  key={amt}
                  onClick={() => setBidAmount(amt)}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-black transition-all border",
                    bidAmount === amt
                      ? "bg-yellow-500 border-yellow-400 text-slate-950 shadow-md shadow-yellow-500/10 scale-105"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  )}
                >
                  💎 {amt}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-slate-400 px-1 border-t border-slate-900 pt-2.5">
              <span>Potential Return:</span>
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                💎 {bidAmount * 2} Gems + {bidAmount >= 50 ? '🏆 Gold Box' : '📦 Bronze Box'}
              </span>
            </div>
          </div>

          <Button
            onClick={startNewGame}
            disabled={loading}
            className="w-full font-black h-12 bg-yellow-500 hover:bg-yellow-600 text-slate-950 rounded-xl text-xs uppercase tracking-widest transition-all border-0 shadow-md"
          >
            {loading ? 'Consulting Treasury...' : 'Embark Challenge'}
          </Button>
        </div>
      )}

      {/* GAMEPLAY ACTIVE MODULE */}
      {gameState === 'playing' && question && (
        <div className="w-full flex flex-col items-center gap-6">
          {/* Gallows canvas */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-center relative overflow-hidden">
            {renderGallows()}
            <span className="absolute bottom-2 right-3 text-[10px] font-black uppercase text-red-500 tracking-wider">
              {6 - wrongGuesses.length} guesses left
            </span>
          </div>

          {/* Question Text block */}
          <div className="text-center w-full px-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-yellow-500 bg-yellow-500/10 border border-yellow-500/30 px-3 py-0.5 rounded-full mb-2 inline-block">
              {question.category}
            </span>
            <p className="text-white font-bold font-serif text-sm leading-relaxed max-w-md mx-auto">
              "{question.question}"
            </p>
          </div>

          {/* Blank Letter Blocks with Text Filtering */}
          <div className="flex flex-wrap justify-center gap-1.5 py-4 max-w-md">
            {revealWord.split('').map((char, index) => {
              const isLetter = char >= 'A' && char <= 'Z';
              const revealed = !isLetter || guessedLetters.has(char);

              return (
                <div
                  key={index}
                  className={cn(
                    "w-7 h-9 border-b-2 flex items-center justify-center text-lg font-black tracking-normal transition-all",
                    isLetter 
                      ? revealed 
                        ? "border-yellow-500 text-yellow-400 animate-pulse" 
                        : "border-slate-700 text-transparent"
                      : "border-transparent text-slate-500" // Auto revealed space / symbol
                  )}
                >
                  {revealed ? char : '?'}
                </div>
              );
            })}
          </div>

          {/* Socrates Lifeline Integration */}
          {hasSocrates && (
            <Button
              disabled={socratesUsed || userStars < 15}
              onClick={handleUseSocrates}
              className={cn(
                "h-10 text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 border px-4 rounded-xl transition-all mb-1",
                socratesUsed 
                  ? "bg-slate-950 border-slate-900 text-slate-600" 
                  : "bg-slate-950 border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40 hover:bg-slate-900"
              )}
            >
              🏛️ Socrates 50/50 (-15 ★)
            </Button>
          )}

          {/* Keyboard guessed array mapping */}
          <div className="grid grid-cols-7 gap-1.5 max-w-md justify-center">
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(letter => {
              const hasGuessed = guessedLetters.has(letter);
              const isCorrect = targetWord.includes(letter);

              return (
                <button
                  key={letter}
                  disabled={hasGuessed}
                  onClick={() => handleGuess(letter)}
                  className={cn(
                    "w-9 h-9 rounded-lg font-black text-xs transition-all flex items-center justify-center border",
                    hasGuessed
                      ? isCorrect
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 opacity-60"
                        : "bg-red-500/10 border-red-500/20 text-red-500 opacity-40 cursor-not-allowed"
                      : "bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-850 hover:border-slate-700"
                  )}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Retreat button */}
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-500 hover:text-slate-300 text-[10px] uppercase font-black">
            🏳️ Abandon Quest
          </Button>
        </div>
      )}

      {/* GAME OVER (WON OR LOST) SCREEN */}
      {gameState === 'won' && (
        <div className="w-full text-center flex flex-col items-center gap-4 py-8 animate-in zoom-in duration-300">
          <span className="text-6xl animate-bounce">🏆</span>
          <h4 className="text-xl font-black text-white uppercase tracking-wider">Invasion Successful!</h4>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            You deciphered the runes and saved the counselor! Your gold cache has been credited.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleReset} className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black px-6 py-2 rounded-xl text-xs uppercase tracking-widest border-0">
              Quest Map
            </Button>
          </div>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="w-full text-center flex flex-col items-center gap-6 py-6 animate-in fade-in duration-500 relative min-h-[300px] justify-center">
          
          {/* BLACK HOLE VORTEX ANIMATION */}
          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-80 h-80 opacity-40 animate-[spin_10s_linear_infinite] text-purple-900 fill-current">
              <defs>
                <radialGradient id="vortex-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#020617" />
                  <stop offset="40%" stopColor="#3b0764" />
                  <stop offset="70%" stopColor="#581c87" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#vortex-grad)" />
              {/* Swirling arms */}
              <path d="M 50,50 Q 70,40 85,25 Q 90,45 80,65 Q 60,75 50,50 Z" className="opacity-60" />
              <path d="M 50,50 Q 30,60 15,75 Q 10,55 20,35 Q 40,25 50,50 Z" className="opacity-60" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3">
            <span className="text-6xl animate-pulse">💀</span>
            <h4 className="text-xl font-black text-red-500 uppercase tracking-wider">Counselor Executed</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              The gallows floor fell. Your bid of <span className="font-extrabold text-red-400">💎 {bidAmount} Gems</span> was pulled into the black hole!
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-black border border-slate-800 px-3 py-1 rounded-md">
              Answer: {revealWord}
            </p>
            <Button onClick={handleReset} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider border border-slate-700 mt-4">
              Return to Map
            </Button>
          </div>
        </div>
      )}

      {/* LOOT CHEST OPENER LINK */}
      <MysteryBoxOpener
        isOpen={openerOpen}
        onClose={() => {
          setOpenerOpen(false);
          setBoxTier(null);
          fetchBalancesAndCouncil();
        }}
        boxTier={boxTier}
        userId={userId}
        onSuccess={onRefreshBalances}
      />
    </div>
  );
};
