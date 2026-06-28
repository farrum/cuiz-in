import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { getRandomQuestion, getBatchQuestions, QuizQuestion } from '@/utils/quizData';
import { createSlug } from '@/utils/urlUtils';
import { getCategorySlug } from '@/utils/categoryMapping';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { useGameMode } from '@/hooks/quiz/useGameMode';
import EnhancedQuizCard from '@/components/quiz/EnhancedQuizCard';
import ImageQuizContent from '@/components/quiz/ImageQuizContent';
import { TrueFalseSwipe } from '@/components/gamification/TrueFalseSwipe';
import { FlashcardMatch } from '@/components/gamification/FlashcardMatch';
import { BossFight } from '@/components/gamification/BossFight';
import { ImageReveal } from '@/components/gamification/ImageReveal';
import QuizInterstitial from '@/components/quiz/QuizInterstitial';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoadingCard from '@/components/LoadingCard';
import CompactStatsBar from '@/components/quiz/CompactStatsBar';
import GuestGemsBanner from '@/components/quiz/GuestGemsBanner';
import { ScratchCard } from '@/components/gamification/ScratchCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useQuizGems } from '@/hooks/quiz';
import { TriviaWordle } from '@/components/gamification/TriviaWordle';
import { getLocalQuestionsBatch, getRandomLocalWordle } from '@/utils/localTriviaPool';
import { useToast } from '@/hooks/use-toast';
import { trackGuestPageView } from '@/utils/guestAnalytics';

// Show the inter-question ad after every answered question.
const INTERSTITIAL_EVERY = 1;

const QuizPlayPage: React.FC = () => {
  const { questionId } = useParams<{ questionId: string; questionSlug?: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [batchQuestions, setBatchQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showScratchCard, setShowScratchCard] = useState(false);
  const [showBossFight, setShowBossFight] = useState(false);
  const [showImageReveal, setShowImageReveal] = useState(false);
  const [scratchPrize, setScratchPrize] = useState<{ label: string; value: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // States for random inter-question mini-games
  const [showRandomTrueFalse, setShowRandomTrueFalse] = useState(false);
  const [randomTrueFalseQuestions, setRandomTrueFalseQuestions] = useState<QuizQuestion[]>([]);
  const [showRandomFlashcards, setShowRandomFlashcards] = useState(false);
  const [randomFlashcardQuestions, setRandomFlashcardQuestions] = useState<QuizQuestion[]>([]);
  const [showRandomWordle, setShowRandomWordle] = useState(false);
  const [randomWordle, setRandomWordle] = useState<{ clue: string; answer: string } | null>(null);
  const { toast } = useToast();

  const { currentMode } = useGameMode();

  const {
    streak,
    questionsAnswered,
    incrementQuestionsAnswered,
    incrementStreak,
    resetStreak,
  } = usePersistentQuizStats();

  // Daily/monthly/total gems fetched from DB (refreshes after each answer)
  const [, setNextBadgeThreshold] = useState(10);
  const { dailyGems, fetchGems } = useQuizGems(setNextBadgeThreshold);

  // Fetch session user on mount
  useEffect(() => {
    const getSessionUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getSessionUser();
  }, []);

  // Track anonymous page view per question
  useEffect(() => {
    trackGuestPageView();
  }, [questionId]);

  // Fetch current question by id
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!questionId) return;
      setIsLoading(true);
      setShowInterstitial(false);
      setShowScratchCard(false);
      setShowBossFight(false);
      setShowImageReveal(false);
      setShowRandomTrueFalse(false);
      setShowRandomFlashcards(false);
      setShowRandomWordle(false);
      try {
        if (currentMode === 'true-false' || currentMode === 'flashcards') {
          // Fetch a batch of random questions
          const batch = await getBatchQuestions(12);
          if (!cancelled) setBatchQuestions(batch);
        } else {
          // Normal single question fetch
          const { data, error } = await supabase
            .from('quiz_questions')
            .select('id, question, options, category, difficulty, explanation, gems:points, image_url, question_type, created_at')
            .eq('id', questionId)
            .maybeSingle();

          if (error || !data) {
            // Fall back to a random question
            const fallback = await getRandomQuestion();
            if (!cancelled) {
              navigate(`/quiz/play/${fallback.id}/${createSlug(fallback.question, 80)}`, { replace: true });
            }
            return;
          }

          const q: QuizQuestion = {
            id: data.id,
            question: data.question,
            options: Array.isArray(data.options) ? data.options : Object.values(data.options || {}),
            difficulty: (data.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
            category: data.category,
            gems: data.gems || 10,
            explanation: data.explanation || '',
            imageUrl: data.image_url || undefined,
            questionType: (data.question_type as 'text' | 'image') || 'text',
            createdAt: data.created_at,
          };
          if (!cancelled) setQuestion(q);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [questionId, navigate]);

  const goToNextQuestion = useCallback(async () => {
    try {
      const next = await getRandomQuestion();
      // Avoid landing on the same question
      const finalNext = next.id === questionId ? await getRandomQuestion() : next;
      navigate(`/quiz/play/${finalNext.id}/${createSlug(finalNext.question, 80)}`);
    } catch (e) {
      console.error('Failed to load next question', e);
    }
  }, [navigate, questionId]);

  const grantGemsForMiniGame = useCallback(async (amount: number) => {
    if (amount <= 0) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { data } = await (supabase as any)
          .from('profiles')
          .select('points')
          .eq('id', session.session.user.id)
          .maybeSingle();
        const currentBalance = (data as any)?.points || 0;
        await (supabase as any)
          .from('profiles')
          .update({ points: currentBalance + amount })
          .eq('id', session.session.user.id);
        fetchGems();
      }
    } catch (e) {
      console.error('Failed to grant gems for mini-game:', e);
    }
  }, [fetchGems]);

  const handleComplete = useCallback((isCorrect: boolean | number) => {
    incrementQuestionsAnswered();
    if (isCorrect) incrementStreak(); else resetStreak();

    // Increment daily trivia mission progress
    if (userId) {
      const today = new Date().toISOString().split('T')[0];
      const key = `daily_mission_trivia_${userId}_${today}`;
      const current = Number(localStorage.getItem(key) || '0');
      localStorage.setItem(key, String(current + 1));
      window.dispatchEvent(new CustomEvent('quizQuestionCompleted'));
    }

    // Refresh gems from DB so the stats bar reflects today's earnings
    fetchGems();

    const newCount = questionsAnswered + (typeof isCorrect === 'number' ? isCorrect : 1);

    // Check for Boss Fight (exactly 10 streak)
    if (isCorrect === true && (streak + 1) === 10) {
      setShowBossFight(true);
      return;
    }

    // Interstitial Check
    const isInterstitialTurn = newCount > 0 && newCount % INTERSTITIAL_EVERY === 0;

    // The inter-question ad takes priority so it reliably appears between
    // the answer reveal and the next question.
    if (isInterstitialTurn) {
      setShowInterstitial(true);
      return;
    }

    // Gamification Random Checks
    const rand = Math.random();

    if (rand < 0.20) {
      const gameChoice = Math.random();
      if (gameChoice < 0.20) {
        // 20% Scratch Card - prize is determined server-side on reveal
        setScratchPrize(null);
        setShowScratchCard(true);
      } else if (gameChoice < 0.40) {
        // 20% Image Reveal
        setShowImageReveal(true);
      } else if (gameChoice < 0.60) {
        // 20% Trivia Wordle
        const wordle = getRandomLocalWordle();
        setRandomWordle(wordle);
        setShowRandomWordle(true);
      } else if (gameChoice < 0.80) {
        // 20% True/False Swipe
        const questions = getLocalQuestionsBatch(3);
        setRandomTrueFalseQuestions(questions);
        setShowRandomTrueFalse(true);
      } else {
        // 20% Flashcard Match
        const questions = getLocalQuestionsBatch(4);
        setRandomFlashcardQuestions(questions);
        setShowRandomFlashcards(true);
      }
    } else {
      goToNextQuestion();
    }
  }, [userId, incrementQuestionsAnswered, incrementStreak, resetStreak, questionsAnswered, streak, goToNextQuestion, fetchGems, grantGemsForMiniGame]);


  const handleScratchComplete = async () => {
    try {
      const { data, error } = await (supabase as any).rpc('process_scratch_card', { p_context: 'quiz' });
      if (error) throw error;
      if (data && !data.error) {
        setScratchPrize({ label: data.label, value: data.value });
        fetchGems();
      }
    } catch (err) {
      console.error('Scratch card error:', err);
    }
  };

  const handleBossFightComplete = async (success: boolean) => {
    if (success) {
      // Double the daily gems
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { data } = await (supabase as any).from('profiles').select('points').eq('id', session.session.user.id).single();
        const currentBalance = (data as any)?.points || 0;
        await (supabase as any).from('profiles').update({ points: currentBalance + dailyGems }).eq('id', session.session.user.id);
        fetchGems();
      }
    } else {
      // Lose daily gems
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { data } = await (supabase as any).from('profiles').select('points').eq('id', session.session.user.id).single();
        const currentBalance = (data as any)?.points || 0;
        const newBalance = Math.max(0, currentBalance - dailyGems);
        await (supabase as any).from('profiles').update({ points: newBalance }).eq('id', session.session.user.id);
        fetchGems();
      }
      resetStreak();
    }
    setShowBossFight(false);
    goToNextQuestion();
  };

  const canonicalUrl = question
    ? `https://cuiz.in/quiz/question/${question.id}/${getCategorySlug(question.category)}/${createSlug(question.question, 80)}`
    : 'https://cuiz.in/quiz';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{question ? `${question.question} | CuizIN` : 'Play Quiz | CuizIN'}</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <Header />
      <main className="flex-1 container max-w-2xl pt-20 pb-8 px-3 md:px-4">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/quiz" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Quiz home
            </Link>
          </Button>
        </div>

        <CompactStatsBar
          questionsAnswered={questionsAnswered}
          streak={streak}
          dailyGems={dailyGems}
          className="mb-4"
        />

        {showBossFight && question ? (
          <BossFight
            question={question}
            currentSessionGems={dailyGems}
            onComplete={handleBossFightComplete}
            onDecline={() => {
              setShowBossFight(false);
              goToNextQuestion();
            }}
          />
        ) : showImageReveal && question ? (
          <ImageReveal
            question={question}
            onComplete={(isCorrect) => {
              if (isCorrect) incrementStreak();
              setShowImageReveal(false);
              goToNextQuestion();
            }}
            onSkip={() => {
              setShowImageReveal(false);
              goToNextQuestion();
            }}
          />
        ) : showRandomWordle && randomWordle ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-card border rounded-2xl p-6 md:p-8 space-y-6 animate-in zoom-in-95">
            <div className="text-center w-full">
              <h2 className="text-2xl font-bold text-primary mb-1 flex items-center justify-center gap-2">
                <Sparkles className="text-yellow-500" /> Trivia Wordle <Sparkles className="text-yellow-500" />
              </h2>
              <p className="text-muted-foreground text-sm">Guess the secret word from the clue in 6 attempts!</p>
            </div>
            <TriviaWordle
              clue={randomWordle.clue}
              targetWord={randomWordle.answer}
              onComplete={async (gemsEarned) => {
                if (gemsEarned > 0) {
                  await grantGemsForMiniGame(gemsEarned);
                  toast({
                    title: 'Wordle Solved!',
                    description: `You earned ${gemsEarned} Gems!`,
                    className: 'bg-green-50 border-green-200 text-green-800',
                  });
                }
                setShowRandomWordle(false);
                goToNextQuestion();
              }}
            />
          </div>
        ) : showRandomTrueFalse && randomTrueFalseQuestions.length > 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-card border rounded-2xl p-6 md:p-8 space-y-4 animate-in zoom-in-95">
            <div className="text-center w-full">
              <h2 className="text-2xl font-bold text-primary mb-1 flex items-center justify-center gap-2">
                <Sparkles className="text-yellow-500" /> True/False Swipe <Sparkles className="text-yellow-500" />
              </h2>
              <p className="text-muted-foreground text-sm mb-4">Swipe right for True, left for False!</p>
            </div>
            <TrueFalseSwipe
              questions={randomTrueFalseQuestions}
              onGameComplete={async (score, total) => {
                const gemsEarned = score * 5;
                if (gemsEarned > 0) {
                  await grantGemsForMiniGame(gemsEarned);
                  toast({
                    title: 'Swipe Complete!',
                    description: `You got ${score}/${total} correct and earned ${gemsEarned} Gems!`,
                    className: 'bg-green-50 border-green-200 text-green-800',
                  });
                }
                setShowRandomTrueFalse(false);
                goToNextQuestion();
              }}
            />
          </div>
        ) : showRandomFlashcards && randomFlashcardQuestions.length > 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-card border rounded-2xl p-6 md:p-8 space-y-4 animate-in zoom-in-95">
            <div className="text-center w-full">
              <h2 className="text-2xl font-bold text-primary mb-1 flex items-center justify-center gap-2">
                <Sparkles className="text-yellow-500" /> Memory Match <Sparkles className="text-yellow-500" />
              </h2>
              <p className="text-muted-foreground text-sm mb-4">Find all matching pairs under the time limit!</p>
            </div>
            <FlashcardMatch
              questions={randomFlashcardQuestions}
              onGameComplete={async (score) => {
                const matchesFound = score / 2;
                const gemsEarned = matchesFound * 5;
                if (gemsEarned > 0) {
                  await grantGemsForMiniGame(gemsEarned);
                  toast({
                    title: 'Match Complete!',
                    description: `You found ${matchesFound} matches and earned ${gemsEarned} Gems!`,
                    className: 'bg-green-50 border-green-200 text-green-800',
                  });
                }
                setShowRandomFlashcards(false);
                goToNextQuestion();
              }}
            />
          </div>
        ) : showScratchCard ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-card border rounded-2xl p-8 space-y-6 animate-in zoom-in-95">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                <Sparkles className="text-yellow-500" /> Surprise Bonus! <Sparkles className="text-yellow-500" />
              </h2>
              <p className="text-muted-foreground">You found a scratch card. Scratch to reveal your prize!</p>
            </div>

            <ScratchCard
              width={280}
              height={140}
              coverColor="#94a3b8"
              onComplete={handleScratchComplete}
            >
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="text-2xl font-black text-slate-800">
                  {scratchPrize ? scratchPrize.label : 'Revealing...'}
                </h3>
                <p className="text-sm font-bold text-green-600">
                  {scratchPrize && scratchPrize.value > 0 ? 'You Won!' : scratchPrize ? 'Try again tomorrow' : ''}
                </p>
              </div>
            </ScratchCard>

            <Button size="lg" className="w-full max-w-xs mt-8" onClick={() => {
              setShowScratchCard(false);
              setScratchPrize(null);
              goToNextQuestion();
            }}>
              Continue Quiz
            </Button>
          </div>
        ) : showInterstitial ? (
          <QuizInterstitial
            onContinue={goToNextQuestion}
          />
        ) : isLoading || (!question && batchQuestions.length === 0) ? (
          <LoadingCard />
        ) : currentMode === 'true-false' ? (
          <TrueFalseSwipe
            questions={batchQuestions}
            onGameComplete={(score) => handleComplete(score)}
          />
        ) : currentMode === 'flashcards' ? (
          <FlashcardMatch
            questions={batchQuestions}
            onGameComplete={(score) => handleComplete(score)}
          />
        ) : question?.questionType === 'image' ? (
          <ImageQuizContent
            question={question}
            onComplete={(isCorrect, selectedOption) => handleComplete(isCorrect)}
          />
        ) : (
          <div data-no-auto-ads="true">
            {question && (
              <EnhancedQuizCard
                key={question.id}
                question={question}
                onComplete={(isCorrect) => handleComplete(isCorrect)}
                streak={streak}
                questionsAnswered={questionsAnswered}
              />
            )}
          </div>
        )}

        <GuestGemsBanner className="mt-4" />
      </main>
      <Footer />
    </div>
  );
};

export default QuizPlayPage;