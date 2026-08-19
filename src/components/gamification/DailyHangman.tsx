import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { QuizQuestion } from '@/utils/types';
import { updateTotalGems, updateTotalStars } from '@/utils/rewardService';
import { getUserBalances, updateUserBalances } from '@/utils/shopData';
import { LOCAL_TRIVIA_QUESTIONS } from '@/utils/localTriviaPool';
import { STORAGE_KEYS } from '@/utils/quizData';
import { MysteryBoxOpener } from './MysteryBoxOpener';
import { Sparkles, Coins, Star, HelpCircle, AlertCircle, Landmark, Swords, Shield, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioManager } from '@/utils/audioManager';
import { cn } from '@/lib/utils';

// Curated medieval & general knowledge questions with guaranteed answers for Word Duel
const HANGMAN_WORD_BANK: QuizQuestion[] = [
  ...LOCAL_TRIVIA_QUESTIONS,
  {
    id: 'h1',
    question: 'What weapon did medieval knights traditionally wield in jousting tournaments?',
    options: ['Lance', 'Sword', 'Crossbow', 'Mace'],
    correctAnswer: 'Lance',
    category: 'Medieval Lore',
    difficulty: 'easy',
    explanation: 'A lance is a long spear used by mounted knights.'
  },
  {
    id: 'h2',
    question: 'Which legendary king ruled Camelot with the Knights of the Round Table?',
    options: ['Arthur', 'Richard', 'Charlemagne', 'Alfred'],
    correctAnswer: 'Arthur',
    category: 'Mythology',
    difficulty: 'easy',
    explanation: 'King Arthur is the mythical sovereign of Camelot.'
  },
  {
    id: 'h3',
    question: 'What is the heavily fortified central stronghold inside a medieval castle called?',
    options: ['Keep', 'Moat', 'Drawbridge', 'Turret'],
    correctAnswer: 'Keep',
    category: 'Architecture',
    difficulty: 'medium',
    explanation: 'The keep was the strongest defended tower in a castle.'
  },
  {
    id: 'h4',
    question: 'What mythological creature breathes fire and guards royal treasure?',
    options: ['Dragon', 'Griffin', 'Phoenix', 'Hydra'],
    correctAnswer: 'Dragon',
    category: 'Mythology',
    difficulty: 'easy',
    explanation: 'Dragons are legendary reptilian beasts associated with hoard treasures.'
  },
  {
    id: 'h5',
    question: 'Which element has the atomic number 1 and is the most abundant in the universe?',
    options: ['Hydrogen', 'Helium', 'Oxygen', 'Carbon'],
    correctAnswer: 'Hydrogen',
    category: 'Science',
    difficulty: 'medium',
    explanation: 'Hydrogen makes up about 75% of all baryonic mass in the universe.'
  },
  {
    id: 'h6',
    question: 'Which ancient Greek philosopher was sentenced to drink hemlock?',
    options: ['Socrates', 'Plato', 'Aristotle', 'Pythagoras'],
    correctAnswer: 'Socrates',
    category: 'Philosophy',
    difficulty: 'medium',
    explanation: 'Socrates was condemned by Athens in 399 BC.'
  },
  {
    id: 'h7',
    question: 'What ancient wonder was located in Alexandria, Egypt?',
    options: ['Lighthouse', 'Colossus', 'Pyramid', 'Gardens'],
    correctAnswer: 'Lighthouse',
    category: 'History',
    difficulty: 'medium',
    explanation: 'The Pharos of Alexandria was one of the Seven Wonders.'
  },
  {
    id: 'h8',
    question: 'What is the largest desert in the world?',
    options: ['Antarctica', 'Sahara', 'Gobi', 'Kalahari'],
    correctAnswer: 'Antarctica',
    category: 'Geography',
    difficulty: 'hard',
    explanation: 'Antarctica is classified as a polar desert and is the largest by area.'
  },
  {
    id: 'h9',
    question: 'Which metal is known to be liquid at room temperature?',
    options: ['Mercury', 'Gallium', 'Bromine', 'Cesium'],
    correctAnswer: 'Mercury',
    category: 'Science',
    difficulty: 'easy',
    explanation: 'Mercury remains liquid at standard temperature and pressure.'
  },
  {
    id: 'h10',
    question: 'What mathematical concept representing nothingness was formalized in ancient India by Aryabhata and Brahmagupta?',
    options: ['Zero', 'Infinity', 'Pi', 'Logarithm'],
    correctAnswer: 'Zero',
    category: 'Mathematics',
    difficulty: 'easy',
    explanation: 'Zero as a numerical digit revolutionized universal mathematics.'
  }
];

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
  const [targetWord, setTargetWord] = useState<string>(''); // Cleaned word (A-Z)
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [revealWord, setRevealWord] = useState<string>(''); // Target answer

  // Chest opener modal
  const [openerOpen, setOpenerOpen] = useState(false);
  const [boxTier, setBoxTier] = useState<'bronze' | 'gold' | null>(null);

  const { toast } = useToast();
  const haptics = useHaptics();

  // Resolve effective user ID
  const effectiveUserId =
    userId ||
    (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) || localStorage.getItem('cuizin_user_id') : null);

  useEffect(() => {
    fetchBalancesAndCouncil();
  }, [effectiveUserId, gameState]);

  const fetchBalancesAndCouncil = async () => {
    // 1. Sync from local balances first
    const { gems, stars } = getUserBalances();
    setUserGems(gems);
    setUserStars(stars);

    if (!effectiveUserId) return;
    try {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('gems:points, stars')
        .eq('id', effectiveUserId)
        .maybeSingle();
      if (profile) {
        if (profile.gems !== undefined && profile.gems !== null) setUserGems(Number(profile.gems));
        if (profile.stars !== undefined && profile.stars !== null) setUserStars(Number(profile.stars));
      }

      // Check if Socrates character is unlocked
      const { data: char } = await (supabase as any)
        .from('user_characters')
        .select('level')
        .eq('user_id', effectiveUserId)
        .eq('character_id', 'socrates')
        .maybeSingle();
      setHasSocrates(char && char.level > 0 ? true : false);
    } catch (e) {
      console.warn('[DailyHangman] sync failed, using local balances', e);
    }
  };

  const startNewGame = async () => {
    const { gems } = getUserBalances();
    const currentGems = Math.max(userGems, gems);

    if (currentGems < bidAmount) {
      haptics('error');
      toast({
        title: "Treasury Empty!",
        description: `You need at least ${bidAmount} Gems to place this duel bid.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setGuessedLetters(new Set());
    setWrongGuesses([]);
    setSocratesUsed(false);

    try {
      // 1. Deduct gems from local & remote balances safely
      updateUserBalances(-bidAmount, 0);
      setUserGems((prev) => Math.max(0, prev - bidAmount));
      window.dispatchEvent(new CustomEvent('gemsUpdated'));

      if (effectiveUserId) {
        updateTotalGems(-bidAmount, effectiveUserId).catch((err) =>
          console.warn('[DailyHangman] remote gem deduct skipped', err)
        );
      }
      haptics('medium');

      // 2. Select a guaranteed question with answer from curated bank
      const validQuestions = HANGMAN_WORD_BANK.filter(
        (q) => q.correctAnswer && q.correctAnswer.trim().length > 0
      );
      const q = validQuestions[Math.floor(Math.random() * validQuestions.length)] || HANGMAN_WORD_BANK[0];
      setQuestion(q);

      const rawAnswer = (q.correctAnswer || 'VICTORY').toUpperCase();
      const cleanAnswer = rawAnswer.replace(/[^A-Z]/g, '');
      setTargetWord(cleanAnswer || 'VICTORY');
      setRevealWord(rawAnswer);

      // Auto-guess any non-letter symbols (spaces, punctuation)
      const autoGuessed = new Set<string>();
      for (let i = 0; i < rawAnswer.length; i++) {
        const char = rawAnswer[i];
        if (char < 'A' || char > 'Z') {
          autoGuessed.add(char);
        }
      }
      setGuessedLetters(autoGuessed);
      setGameState('playing');
      onRefreshBalances();
      audioManager.playSFX('correct');
    } catch (err) {
      console.error('[DailyHangman] error starting game:', err);
      // Fallback: restore bid and alert
      updateUserBalances(bidAmount, 0);
      toast({
        title: "Error starting duel",
        description: "Could not initialize question deck. Please try again.",
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
      audioManager.playSFX('wrong');

      if (newWrong.length >= 6) {
        // Lose Game
        haptics('error');
        setGameState('lost');
        audioManager.playSFX('royal_sadness');
      }
    } else {
      audioManager.playSFX('correct');
      // Check win condition (all letters in targetWord have been guessed)
      const won = targetWord.split('').every((char) => newGuessed.has(char));
      if (won) {
        handleWin();
      }
    }
  };

  const handleWin = async () => {
    setGameState('won');
    haptics('success');
    audioManager.playSFX('victory_laughter');
    confetti({ particleCount: 140, spread: 85, origin: { y: 0.4 } });

    const rewardGems = bidAmount * 2;
    const rewardStars = 30;

    // Grant local balances
    updateUserBalances(rewardGems, rewardStars);
    setUserGems((prev) => prev + rewardGems);
    setUserStars((prev) => prev + rewardStars);
    window.dispatchEvent(new CustomEvent('gemsUpdated'));
    window.dispatchEvent(new CustomEvent('starsUpdated'));

    if (effectiveUserId) {
      try {
        await (supabase as any).rpc('claim_hangman_victory', {
          user_uuid: effectiveUserId,
          bid_amount: bidAmount
        });
      } catch (err) {
        console.warn('[DailyHangman] claim RPC error fallback', err);
      }
    }

    const tier = bidAmount >= 50 ? 'gold' : 'bronze';
    setBoxTier(tier);
    setOpenerOpen(true);
    onRefreshBalances();
    toast({
      title: "🛡️ PRISONER SAVED!",
      description: `Victory in the Word Duel! Earned +${rewardGems} Gems & +${rewardStars} Stars!`,
    });
  };

  // Socrates Lifeline: Disables 4 incorrect letters from keyboard
  const handleUseSocrates = async () => {
    if (socratesUsed || userStars < 15) return;

    haptics('medium');
    try {
      updateUserBalances(0, -15);
      setUserStars((prev) => Math.max(0, prev - 15));
      window.dispatchEvent(new CustomEvent('starsUpdated'));
      if (effectiveUserId) {
        updateTotalStars(-15, effectiveUserId).catch(() => {});
      }
      setSocratesUsed(true);

      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
      const unselectedWrongs = alphabet.filter(
        (letter) => !targetWord.includes(letter) && !guessedLetters.has(letter)
      );

      const toEliminate = unselectedWrongs.sort(() => 0.5 - Math.random()).slice(0, 4);
      const newGuesses = new Set(guessedLetters);
      toEliminate.forEach((letter) => newGuesses.add(letter));
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
      <svg viewBox="0 0 100 100" className="w-40 h-40 stroke-amber-400 fill-none stroke-[3] stroke-linecap-round filter drop-shadow-md">
        {/* Gallows Pole Base */}
        <path d="M 10,90 L 90,90" />
        
        {/* Step 1: Vertical Post */}
        {errorCount >= 1 && <path d="M 30,90 L 30,10" className="animate-in fade-in duration-300" />}
        
        {/* Step 2: Crossbeam & Rope hook */}
        {errorCount >= 2 && <path d="M 30,10 L 70,10 L 70,25" className="animate-in fade-in duration-300" />}
        
        {/* Step 3: Prisoner Head */}
        {errorCount >= 3 && <circle cx="70" cy="32" r="7" className="animate-in zoom-in duration-300 stroke-amber-200" />}
        
        {/* Step 4: Prisoner Torso */}
        {errorCount >= 4 && <path d="M 70,39 L 70,60" className="animate-in fade-in duration-300 stroke-amber-200" />}
        
        {/* Step 5: Prisoner Arms */}
        {errorCount >= 5 && <path d="M 70,45 L 55,50 M 70,45 L 85,50" className="animate-in fade-in duration-300 stroke-amber-200" />}
        
        {/* Step 6: Prisoner Legs (Defeat) */}
        {errorCount >= 6 && <path d="M 70,60 L 60,78 M 70,60 L 80,78" className="stroke-rose-500 animate-in fade-in duration-300" />}
      </svg>
    );
  };

  return (
    <div
      className="w-full rounded-3xl p-6 shadow-xl max-w-xl mx-auto flex flex-col items-center relative overflow-hidden border border-amber-500/30"
      style={{
        background: 'linear-gradient(160deg, hsl(220 50% 12%) 0%, hsl(220 55% 8%) 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,215,0,0.2)',
      }}
    >
      {/* Background glow flare */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl"
      />

      {/* Header Info */}
      <div className="text-center mb-6 relative z-10">
        <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
          <Swords className="text-amber-400 w-5 h-5 drop-shadow-sm" />
          Word Guessing Duel
        </h3>
        <p className="text-xs text-slate-300 font-medium mt-1 max-w-[320px] leading-relaxed">
          Unravel the mystery word before the executioner strikes. Win double your bid &amp; mystery vaults!
        </p>
      </div>

      {gameState === 'idle' && (
        <div className="flex flex-col gap-6 w-full items-center relative z-10">
          {/* Bidding selection card */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-amber-500/20 w-full text-center shadow-inner">
            <span className="text-[10px] uppercase font-black text-amber-400/80 tracking-widest block mb-3">
              SELECT YOUR DUEL GEMS BID
            </span>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => { haptics('light'); setBidAmount(amt); }}
                  className={cn(
                    "py-3 rounded-xl text-xs font-black transition-all border",
                    bidAmount === amt
                      ? "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-slate-950 shadow-lg scale-105"
                      : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40"
                  )}
                >
                  💎 {amt}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-slate-300 px-1 border-t border-slate-800 pt-3">
              <span>Potential Return:</span>
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                💎 {bidAmount * 2} Gems + {bidAmount >= 50 ? '🏆 Gold Box' : '📦 Bronze Box'}
              </span>
            </div>
          </div>

          <Button
            onClick={startNewGame}
            disabled={loading}
            className="w-full font-black h-13 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 rounded-2xl text-xs uppercase tracking-widest transition-all border-0 shadow-lg shadow-amber-500/20"
          >
            {loading ? 'Preparing Battle Scroll…' : '⚔️ Embark on Word Duel'}
          </Button>
        </div>
      )}

      {/* GAMEPLAY ACTIVE MODULE */}
      {gameState === 'playing' && question && (
        <div className="w-full flex flex-col items-center gap-5 relative z-10">
          {/* Gallows canvas */}
          <div className="bg-slate-950/90 p-4 rounded-2xl border border-amber-500/20 flex items-center justify-center relative overflow-hidden shadow-inner w-full max-w-sm">
            {renderGallows()}
            <span className={cn(
              "absolute bottom-3 right-4 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
              6 - wrongGuesses.length <= 2 
                ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse" 
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            )}>
              {6 - wrongGuesses.length} strikes left
            </span>
          </div>

          {/* Question Text block */}
          <div className="text-center w-full px-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full mb-2 inline-block">
              {question.category || 'Trivia Clue'}
            </span>
            <p className="text-white font-extrabold text-sm leading-relaxed max-w-md mx-auto drop-shadow-sm">
              "{question.question}"
            </p>
          </div>

          {/* Blank Letter Blocks */}
          <div className="flex flex-wrap justify-center gap-1.5 py-2 max-w-md">
            {revealWord.split('').map((char, index) => {
              const isLetter = char >= 'A' && char <= 'Z';
              const revealed = !isLetter || guessedLetters.has(char);

              return (
                <div
                  key={index}
                  className={cn(
                    "w-8 h-10 border-b-2 flex items-center justify-center text-lg font-black tracking-normal transition-all rounded-t-md",
                    isLetter
                      ? revealed
                        ? "border-amber-400 text-amber-300 bg-amber-400/10 shadow-sm"
                        : "border-slate-700 bg-slate-900/60 text-transparent"
                      : "border-transparent text-slate-500 w-4" // Space or symbol
                  )}
                >
                  {revealed ? char : '?'}
                </div>
              );
            })}
          </div>

          {/* Socrates Lifeline Integration */}
          <div className="flex gap-2 w-full justify-center">
            <Button
              disabled={socratesUsed || userStars < 15}
              onClick={handleUseSocrates}
              className={cn(
                "h-9 text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 border px-3 rounded-xl transition-all",
                socratesUsed
                  ? "bg-slate-950 border-slate-900 text-slate-600 opacity-50"
                  : "bg-slate-950 border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:bg-slate-900"
              )}
            >
              🏛️ Socrates Hint (-15 ★)
            </Button>
          </div>

          {/* Keyboard guessed array mapping */}
          <div className="grid grid-cols-7 gap-1.5 max-w-md justify-center w-full">
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map((letter) => {
              const hasGuessed = guessedLetters.has(letter);
              const isCorrect = targetWord.includes(letter);

              return (
                <button
                  key={letter}
                  disabled={hasGuessed}
                  onClick={() => handleGuess(letter)}
                  className={cn(
                    "w-full h-9 rounded-xl font-black text-xs transition-all flex items-center justify-center border",
                    hasGuessed
                      ? isCorrect
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm opacity-70"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-500 opacity-30 cursor-not-allowed"
                      : "bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-850 hover:border-amber-500/40 active:scale-95"
                  )}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Retreat button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-200 text-[10px] uppercase font-black mt-1"
          >
            🏳️ Abandon Duel
          </Button>
        </div>
      )}

      {/* GAME OVER (WON OR LOST) SCREEN */}
      {gameState === 'won' && (
        <div className="w-full text-center flex flex-col items-center gap-4 py-8 animate-in zoom-in duration-300 relative z-10">
          <span className="text-6xl animate-bounce">🏆</span>
          <h4 className="text-2xl font-black text-amber-400 uppercase tracking-wider">Duel Conquered!</h4>
          <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
            You deciphered the word and defeated the executioner! Your treasury has been credited with double gems.
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={handleReset}
              className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest border-0 shadow-lg"
            >
              Play Another Duel
            </Button>
          </div>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="w-full text-center flex flex-col items-center gap-5 py-6 animate-in fade-in duration-500 relative min-h-[280px] justify-center z-10">
          <span className="text-6xl animate-pulse">💀</span>
          <h4 className="text-2xl font-black text-rose-400 uppercase tracking-wider">Gallows Fallen</h4>
          <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
            The word eluded you. Your bid of <span className="font-extrabold text-rose-400">💎 {bidAmount} Gems</span> was lost!
          </p>
          <p className="text-xs text-amber-300 uppercase font-black bg-slate-950 border border-amber-500/30 px-4 py-1.5 rounded-xl">
            Answer was: {revealWord}
          </p>
          <Button
            onClick={handleReset}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider border border-slate-700 mt-2"
          >
            Try Again
          </Button>
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
        userId={effectiveUserId}
        onSuccess={onRefreshBalances}
      />
    </div>
  );
};
