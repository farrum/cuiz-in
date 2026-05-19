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
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// AdSense slot id for the inter-question interstitial ad unit.
// Create a Display ad unit in AdSense dashboard and paste its slot id here.
const INTERSTITIAL_SLOT_ID = '';

// Show interstitial every N answered questions; first N are warm-up.
const INTERSTITIAL_EVERY = 2;

const QuizPlayPage: React.FC = () => {
  const { questionId } = useParams<{ questionId: string; questionSlug?: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInterstitial, setShowInterstitial] = useState(false);

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
      try {
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('id, question, options, category, difficulty, explanation, gems, image_url, question_type, created_at')
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
    // Show interstitial every Nth question, but not on the very first one.
    if (newCount > 0 && newCount % INTERSTITIAL_EVERY === 0) {
      setShowInterstitial(true);
    } else {
      goToNextQuestion();
    }
  }, [incrementQuestionsAnswered, incrementStreak, resetStreak, questionsAnswered, goToNextQuestion, fetchGems]);

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

        {showInterstitial ? (
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