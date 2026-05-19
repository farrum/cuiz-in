import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { getRandomQuestion, QuizQuestion } from '@/utils/quizData';
import { createSlug } from '@/utils/urlUtils';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { useQuizGems } from '@/hooks/quiz/useQuizGems';
import EnhancedQuizCard from '@/components/quiz/EnhancedQuizCard';
import QuizInterstitial from '@/components/quiz/QuizInterstitial';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoadingCard from '@/components/LoadingCard';
import CompactStatsBar from '@/components/quiz/CompactStatsBar';
import GuestGemsBanner from '@/components/quiz/GuestGemsBanner';
import { ScratchCard } from '@/components/gamification/ScratchCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';

// AdSense slot id for the inter-question interstitial ad unit.
// Create a Display ad unit in AdSense dashboard and paste its slot id here.
const INTERSTITIAL_SLOT_ID = '3705941132';

// Show interstitial every N answered questions; first N are warm-up.
const INTERSTITIAL_EVERY = 2;

const QuizPlayPage: React.FC = () => {
  const { questionId } = useParams<{ questionId: string; questionSlug?: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showScratchCard, setShowScratchCard] = useState(false);
  const [scratchPrize, setScratchPrize] = useState(0);

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

  // Fetch current question by id
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!questionId) return;
      setIsLoading(true);
      setShowInterstitial(false);
      setShowScratchCard(false);
      try {
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

  const handleComplete = useCallback((isCorrect: boolean) => {
    incrementQuestionsAnswered();
    if (isCorrect) incrementStreak(); else resetStreak();

    // Refresh gems from DB so the stats bar reflects today's earnings
    fetchGems();

    const newCount = questionsAnswered + 1;
    
    // 10% chance for a Scratch Card, but ensure we don't show it on the exact same question as an Interstitial
    const isInterstitialTurn = newCount > 0 && newCount % INTERSTITIAL_EVERY === 0;
    
    if (Math.random() < 0.10 && !isInterstitialTurn) {
      setScratchPrize(Math.floor(Math.random() * 50) + 10); // Random prize 10-60 Gems
      setShowScratchCard(true);
    } else if (isInterstitialTurn) {
      setShowInterstitial(true);
    } else {
      goToNextQuestion();
    }
  }, [incrementQuestionsAnswered, incrementStreak, resetStreak, questionsAnswered, goToNextQuestion, fetchGems]);

  const handleScratchComplete = async () => {
    // Backend should ideally handle this via RPC similar to process_wheel_spin
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      // Direct update for now, ideally wire to an RPC for strict tracking
      const { data } = await supabase.from('profiles').select('gems_balance').eq('id', session.session.user.id).single();
      const currentBalance = data?.gems_balance || 0;
      await supabase.from('profiles').update({ gems_balance: currentBalance + scratchPrize }).eq('id', session.session.user.id);
      fetchGems();
    }
  };

  const canonicalUrl = question
    ? `https://cuiz.in/quiz/question/${question.id}/${createSlug(question.question, 80)}`
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

        {showScratchCard ? (
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
                <h3 className="text-3xl font-black text-slate-800">{scratchPrize} GEMS</h3>
                <p className="text-sm font-bold text-green-600">You Won!</p>
              </div>
            </ScratchCard>

            <Button size="lg" className="w-full max-w-xs mt-8" onClick={() => {
              setShowScratchCard(false);
              goToNextQuestion();
            }}>
              Continue Quiz
            </Button>
          </div>
        ) : showInterstitial ? (
          <QuizInterstitial
            slotId={INTERSTITIAL_SLOT_ID}
            onContinue={goToNextQuestion}
          />
        ) : isLoading || !question ? (
          <LoadingCard />
        ) : (
          <div data-no-auto-ads="true">
            <EnhancedQuizCard
              key={question.id}
              question={question}
              onComplete={handleComplete}
              streak={streak}
              questionsAnswered={questionsAnswered}
            />
          </div>
        )}

        <GuestGemsBanner className="mt-4" />
      </main>
      <Footer />
    </div>
  );
};

export default QuizPlayPage;