import React, { useState, useEffect } from 'react';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { minigames } from '@/components/gamification/minigamesData';
import { Button } from '@/components/ui/button';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';

// Game Component Imports
import { SlotMachine } from '@/components/gamification/SlotMachine';
import { PlinkoGame } from '@/components/gamification/PlinkoGame';
import { RockPaperScissors } from '@/components/gamification/RockPaperScissors';
import { TreasureChest } from '@/components/gamification/TreasureChest';
import { SpinTheWheel } from '@/components/gamification/SpinTheWheel';
import { ScratchCard } from '@/components/gamification/ScratchCard';
import { TrueFalseSwipe } from '@/components/gamification/TrueFalseSwipe';
import { ImageReveal } from '@/components/gamification/ImageReveal';
import { CoinFlip } from '@/components/gamification/CoinFlip';
import { DiceRoll } from '@/components/gamification/DiceRoll';
import { DailyRiddleVault } from '@/components/gamification/DailyRiddleVault';

// Question Fetching for TrueFalse and Image Trivia
import { fetchQuizQuestions } from '@/utils/quizDataService';
import { QuizQuestion } from '@/utils/types';

export const MiniGamePlayPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const activeGame = minigames.find(g => g.id === gameId);
  const { showVideoAd, adElement } = useMiniGameVideoAd();

  // States for True/False and Image trivia
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tfScore, setTfScore] = useState<{ score: number; total: number } | null>(null);
  const [imageComplete, setImageComplete] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // States for Scratch Card
  const [scratchPrize, setScratchPrize] = useState<{ label: string; value: number } | null>(null);
  const [scratchLoading, setScratchLoading] = useState(false);
  const [scratchError, setScratchError] = useState<string | null>(null);
  const [scratchRevealed, setScratchRevealed] = useState(false);

  // States for Riddle Vault
  const [riddleText, setRiddleText] = useState('What has keys but can\'t open locks?');
  const [riddleAnswer, setRiddleAnswer] = useState('piano');
  const [hasAttemptedRiddle, setHasAttemptedRiddle] = useState(false);
  const [riddleLoading, setRiddleLoading] = useState(false);

  // Load questions when true-false or image game is selected
  const loadQuestions = async () => {
    setLoadingQuestions(true);
    setTfScore(null);
    setCurrentImageIndex(0);
    setImageComplete(false);
    try {
      const q = await fetchQuizQuestions();
      const shuffled = [...q].sort(() => 0.5 - Math.random());
      setQuestions(shuffled);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (gameId === 'true-false' || gameId === 'image') {
      loadQuestions();
    } else if (gameId === 'scratch') {
      initScratchCard();
    } else if (gameId === 'riddlevault') {
      loadRiddle();
    }
  }, [gameId]);

  // Handle scratch card init
  const initScratchCard = async () => {
    setScratchLoading(true);
    setScratchError(null);
    setScratchPrize(null);
    setScratchRevealed(false);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        setScratchError("Please log in to play the Scratch Card game.");
        return;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.rpc('process_scratch_card' as any, { p_context: 'daily' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r: any = data;
      if (error || r?.error) {
        setScratchError(r?.error || error?.message || "You have already played today.");
      } else if (r) {
        setScratchPrize({ label: r.label, value: r.value || 0 });
      } else {
        setScratchError("Could not resolve scratch prize.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to contact database.";
      setScratchError(errorMsg);
    } finally {
      setScratchLoading(false);
    }
  };

  // Load Riddle from Database with local fallbacks
  const loadRiddle = async () => {
    setRiddleLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const riddleAttempted = localStorage.getItem(`riddle_${today}`);
      if (riddleAttempted === 'true') {
        setHasAttemptedRiddle(true);
      } else {
        setHasAttemptedRiddle(false);
      }

      const { data: settingData } = await supabase
        .from('gamification_settings')
        .select('config')
        .eq('setting_type', 'daily_challenges')
        .maybeSingle();

      const cfg = settingData?.config as { riddle_text?: string; riddle_answer?: string } | null;
      if (cfg?.riddle_text) {
        setRiddleText(cfg.riddle_text);
        setRiddleAnswer(cfg.riddle_answer || '');
      }
    } catch (err) {
      console.error('Failed to load riddle config:', err);
    } finally {
      setRiddleLoading(false);
    }
  };

  const handleRiddleSubmit = async (guess: string) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`riddle_${today}`, 'true');
    setHasAttemptedRiddle(true);

    const isCorrect = guess.toLowerCase().trim() === riddleAnswer.toLowerCase().trim();
    if (isCorrect) {
      // Award 500 Gems to user's profile
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('profiles')
          .select('points')
          .eq('id', session.session.user.id)
          .maybeSingle();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentBalance = (data as any)?.points || 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('profiles')
          .update({ points: currentBalance + 500 })
          .eq('id', session.session.user.id);
        
        // Dispatch gemsUpdated event
        window.dispatchEvent(new CustomEvent('gemsUpdated'));
      }
      return { success: true, message: 'You unlocked the vault and received 500 Gems!', gemsWon: 500 };
    }
    return { success: false, message: 'That guess was incorrect. The vault is sealed.' };
  };

  const handleScratchComplete = () => {
    showVideoAd(() => {
      setScratchRevealed(true);
      if (scratchPrize && scratchPrize.value > 0) {
        confetti({ particleCount: 100, spread: 70 });
      }
    });
  };

  // Filter image questions
  const imageQuestions = questions.filter(q => q.questionType === 'image' || q.imageUrl);

  // Render proper game body based on gameId
  const renderGameContent = () => {
    if (!activeGame) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-destructive mb-4">Game not found</h2>
          <Button onClick={() => navigate('/minigames')}>Back to Gallery</Button>
        </div>
      );
    }

    switch (gameId) {
      case 'slotmachine':
        return <SlotMachine />;
      case 'plinkogame':
        return <PlinkoGame />;
      case 'rockpaperscissors':
        return <RockPaperScissors />;
      case 'treasurechest':
        return <TreasureChest />;
      case 'wheel':
        return <SpinTheWheel />;
      case 'scratch':
        if (scratchLoading) {
          return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground font-bold">Checking daily card eligibility...</p>
            </div>
          );
        }
        if (scratchError) {
          return (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-card border border-destructive/20 rounded-2xl max-w-md mx-auto shadow-md">
              <span className="text-5xl mb-4">🔒</span>
              <h3 className="text-xl font-bold text-destructive mb-2">Unavailable Today</h3>
              <p className="text-muted-foreground mb-6">{scratchError}</p>
              <Button variant="outline" onClick={() => navigate('/minigames')}>Explore Other Games</Button>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center py-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-2">Scratch Card</h2>
            <p className="text-muted-foreground text-center text-sm mb-6">
              Use your mouse or finger to scratch the silver surface and reveal your daily prize!
            </p>
            <div className="relative border-4 border-slate-700 rounded-2xl overflow-hidden shadow-2xl bg-white p-1">
              <ScratchCard
                width={360}
                height={200}
                coverColor="#94a3b8"
                brushSize={28}
                revealThreshold={0.4}
                onComplete={handleScratchComplete}
              >
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <span className="text-5xl mb-2 animate-bounce">🎁</span>
                  <h4 className="text-2xl font-extrabold text-slate-800 mb-1">{scratchPrize?.label}</h4>
                  <p className="text-green-600 text-lg font-black">+{scratchPrize?.value} GEMS CLAIMED!</p>
                </div>
              </ScratchCard>
            </div>
            {scratchRevealed && (
              <Button className="mt-8 w-full" onClick={initScratchCard}>
                Play Again Tomorrow
              </Button>
            )}
          </div>
        );
      case 'true-false':
        if (loadingQuestions) {
          return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Shuffling fact cards...</p>
            </div>
          );
        }
        if (tfScore !== null) {
          return (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-card border rounded-2xl max-w-md mx-auto shadow-md">
              <span className="text-5xl mb-4">🏆</span>
              <h3 className="text-2xl font-black mb-2">Game Completed!</h3>
              <p className="text-lg text-muted-foreground mb-6">
                You answered <span className="text-green-500 font-extrabold">{tfScore.score}</span> out of <span className="font-bold text-slate-700">{tfScore.total}</span> questions correctly!
              </p>
              <div className="flex gap-4 w-full">
                <Button className="flex-1" onClick={loadQuestions}>Play Again</Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate('/minigames')}>Back to Gallery</Button>
              </div>
            </div>
          );
        }
        return (
          <TrueFalseSwipe
            questions={questions.slice(0, 10)}
            onGameComplete={(score, total) => setTfScore({ score, total })}
          />
        );
      case 'image': {
        if (loadingQuestions) {
          return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Gathering visual puzzles...</p>
            </div>
          );
        }
        
        // Handle when there are no image questions in the DB
        const currentImgQuestion = imageQuestions[currentImageIndex] || {
          id: 'fallback-image-q',
          question: 'What is shown in this vibrant graphic art abstract card?',
          options: ['Vibrant gradient spectrum', 'Black and white blocks', 'Checkered pattern', 'No image'],
          correctAnswer: 'Vibrant gradient spectrum',
          difficulty: 'easy',
          category: 'Art',
          gems: 10,
          explanation: 'It shows a rich spectrum of colors fading into one another.',
          imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
          questionType: 'image'
        };

        if (imageComplete) {
          return (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-card border rounded-2xl max-w-md mx-auto shadow-md">
              <span className="text-5xl mb-4">🎨</span>
              <h3 className="text-2xl font-black mb-2">Image Trivia Solved!</h3>
              <p className="text-muted-foreground mb-6">
                Awesome job! You cleared all available image trivia boards.
              </p>
              <div className="flex gap-4 w-full">
                <Button className="flex-1" onClick={loadQuestions}>Play Again</Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate('/minigames')}>Back to Gallery</Button>
              </div>
            </div>
          );
        }

        const handleImageComplete = (isCorrect: boolean) => {
          const nextIndex = currentImageIndex + 1;
          const availableQuestionsCount = Math.max(1, imageQuestions.length);
          if (nextIndex < availableQuestionsCount) {
            setCurrentImageIndex(nextIndex);
          } else {
            setImageComplete(true);
            confetti({ particleCount: 80, spread: 60 });
          }
        };

        return (
          <ImageReveal
            question={currentImgQuestion}
            onComplete={handleImageComplete}
            onSkip={() => handleImageComplete(false)}
          />
        );
      }
      case 'coinflip':
        return <CoinFlip />;
      case 'diceroll':
        return <DiceRoll />;
      case 'riddlevault':
        if (riddleLoading) {
          return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-muted-foreground">Preparing daily riddle...</p>
            </div>
          );
        }
        return (
          <DailyRiddleVault
            riddleText={riddleText}
            hasAttemptedToday={hasAttemptedRiddle}
            onSubmit={handleRiddleSubmit}
          />
        );
      default:
        return <div className="text-center">Loading game component...</div>;
    }
  };

  return (
    <PageLayout showNewsTicker={true}>
      <div className="min-h-screen bg-[#090d16] pb-12">
        {/* Navigation / Header bar */}
        <div className="bg-slate-950 border-b border-yellow-500/10 py-4 px-6 sticky top-16 z-30 shadow-md">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <Link to="/minigames" className="flex items-center gap-2 text-sm font-black text-yellow-500/70 hover:text-yellow-400 transition-colors uppercase tracking-wider">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Gallery</span>
            </Link>
 
            {/* Title / Badge */}
            {activeGame && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activeGame.emoji}</span>
                <div>
                  <h1 className="text-lg font-black leading-tight text-white uppercase tracking-wider">{activeGame.name}</h1>
                  <p className="text-xs text-slate-400">{activeGame.description}</p>
                </div>
              </div>
            )}
 
            {/* Quick Game Mode Tab Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900 border border-slate-800 p-1 rounded-xl">
              {minigames.map(g => (
                <button
                  key={g.id}
                  onClick={() => navigate(`/minigames/${g.id}`)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all uppercase tracking-wider",
                    g.id === gameId
                      ? "bg-yellow-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  <span className="mr-1">{g.emoji}</span>
                  {g.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
 
        {/* Main Game Screen */}
        <div className="max-w-4xl mx-auto px-4 mt-8 flex flex-col items-center justify-center">
          <div className="w-full bg-slate-900 border-4 border-double border-yellow-500/30 rounded-3xl p-6 md:p-10 shadow-xl shadow-yellow-500/5 min-h-[450px] flex items-center justify-center">
            {renderGameContent()}
          </div>
          
          {/* Ad slot directly underneath the game */}
          <div className="mt-8 w-full max-w-md flex flex-col items-center">
            <div className="text-[10px] text-yellow-500/50 uppercase tracking-widest font-black mb-2">Sponsored Advertisement</div>
            <div className="border-2 border-double border-yellow-500/25 p-4 rounded-2xl bg-slate-950/40 w-full flex justify-center items-center min-h-[280px]">
              <SimpleAdBanner position="middle" />
            </div>
          </div>
        </div>
      </div>
      {adElement}
    </PageLayout>
  );
};
