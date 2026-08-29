
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import { extractKeywords } from '@/services/keywordService';
import PageLayout from '@/components/layout/PageLayout';
import QuizCard from '@/components/QuizCard';
import ImageQuizContent from '@/components/quiz/ImageQuizContent';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Tag,
  Home,
  Brain,
  AlertCircle,
  BookOpen,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import LoadingCard from '@/components/LoadingCard';
import { trackGuestPageView } from '@/utils/guestAnalytics';
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';
import { QuizQuestion } from '@/utils/quizData';
import { getRandomQuestion } from '@/utils/quizData';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { triggerAdRefresh } from '@/utils/adService';

import { createSlug } from '@/utils/urlUtils';
import { getCategorySlug } from '@/utils/categoryMapping';
import { getQuestionSubcategorySlug, getSubcategory } from '@/utils/subcategoryConfig';
import { generateQuestionSocialMeta } from '@/utils/canonicalUrl';
import { getQuestionSources, getFactType, getProvenanceBadge } from '@/utils/provenanceUtils';
import ReportErrorModal from '@/components/quiz/ReportErrorModal';
import RelatedQuestions from '@/components/RelatedQuestions';
import RelatedArticles from '@/components/RelatedArticles';
import RegistrationIncentiveModal from '@/components/home/RegistrationIncentiveModal';
import { isUserLoggedIn } from '@/utils/guestPlayService';
import { Flame, Sparkles } from 'lucide-react';

const SESSION_STREAK_KEY = 'cuizin_web_session_streak';
const SESSION_ANSWERED_KEY = 'cuizin_web_session_answered';
const AUTO_ADVANCE_SECONDS = 5;

const QuizQuestionPage: React.FC = () => {
  const { questionId, questionSlug } = useParams();
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedQuestions, setRelatedQuestions] = useState<QuizQuestion[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [prevQuestion, setPrevQuestion] = useState<QuizQuestion | null>(null);
  const [nextQuestion, setNextQuestion] = useState<QuizQuestion | null>(null);
  const [answered, setAnswered] = useState<{ isCorrect: boolean; selected: string } | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_ADVANCE_SECONDS);
  const [streak, setStreak] = useState<number>(() => {
    const v = Number(sessionStorage.getItem(SESSION_STREAK_KEY) || '0');
    return Number.isFinite(v) ? v : 0;
  });
  const [sessionAnswered, setSessionAnswered] = useState<number>(() => {
    const v = Number(sessionStorage.getItem(SESSION_ANSWERED_KEY) || '0');
    return Number.isFinite(v) ? v : 0;
  });
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const isGuest = !isUserLoggedIn();
  const navigate = useNavigate();

  useEffect(() => {
    trackGuestPageView();
    // New question => rotate every banner on the page.
    triggerAdRefresh();
  }, [questionId]);


  useEffect(() => {
    const fetchQuestionData = async () => {
      setIsLoading(true);
      setAnswered(null);
      
      try {
        // Fetch current question
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('id', questionId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          const formattedQuestion: QuizQuestion = {
            id: data.id,
            question: data.question,
            options: Array.isArray(data.options) ? data.options : Object.values(data.options || {}),
            correctAnswer: data.correct_answer,
            difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
            category: data.category,
            gems: data.points || 10,
            explanation: data.explanation || '',
            createdAt: data.created_at
          };
          
          setQuestion(formattedQuestion);
          
          // Extract keywords for SEO
          const questionKeywords = extractKeywords(formattedQuestion.question);
          formattedQuestion.options.forEach(option => {
            questionKeywords.push(...extractKeywords(option));
          });
          questionKeywords.push(formattedQuestion.category.toLowerCase());
          questionKeywords.push(formattedQuestion.difficulty.toLowerCase());
          
          // Remove duplicates and limit to 15 keywords
          const uniqueKeywords = [...new Set(questionKeywords)].slice(0, 15);
          setKeywords(uniqueKeywords);
          
          // Fetch related questions (by category AND difficulty)
          const { data: relatedData } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('category', data.category)
            .eq('difficulty', data.difficulty)
            .neq('id', questionId)
            .limit(4);
            
          // If we don't have enough related questions by same category and difficulty,
          // fetch some more by just category
          let additionalData = [];
          if (!relatedData || relatedData.length < 4) {
            const { data: additionalRelated } = await supabase
              .from('quiz_questions')
              .select('*')
              .eq('category', data.category)
              .neq('difficulty', data.difficulty)
              .neq('id', questionId)
              .limit(4 - (relatedData?.length || 0));
              
            if (additionalRelated) {
              additionalData = additionalRelated;
            }
          }
          
          // Format related questions
          const allRelatedData = [...(relatedData || []), ...additionalData];
          if (allRelatedData.length > 0) {
            const formattedRelated = allRelatedData.map(q => ({
              id: q.id,
              question: q.question,
              options: Array.isArray(q.options) ? q.options : Object.values(q.options || {}),
              correctAnswer: q.correct_answer,
              difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
              category: q.category,
              gems: q.points || 10,
              explanation: q.explanation || ''
            }));
            
            setRelatedQuestions(formattedRelated);
          }
          
          // Fetch previous and next questions (for navigation)
          // First get by same category and difficulty
          const { data: prevData } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('category', data.category)
            .eq('difficulty', data.difficulty)
            .neq('id', questionId)
            .order('created_at', { ascending: false })
            .limit(1);
            
          const { data: nextData } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('category', data.category)
            .eq('difficulty', data.difficulty)
            .neq('id', questionId)
            .order('created_at', { ascending: true })
            .limit(1);
            
          if (prevData && prevData.length > 0) {
            setPrevQuestion({
              id: prevData[0].id,
              question: prevData[0].question,
              options: Array.isArray(prevData[0].options) ? prevData[0].options : Object.values(prevData[0].options || {}),
              correctAnswer: prevData[0].correct_answer,
              difficulty: (prevData[0].difficulty || 'medium') as 'easy' | 'medium' | 'hard',
              category: prevData[0].category,
              gems: prevData[0].points || 10,
              explanation: prevData[0].explanation || ''
            });
          }
          
          if (nextData && nextData.length > 0) {
            setNextQuestion({
              id: nextData[0].id,
              question: nextData[0].question,
              options: Array.isArray(nextData[0].options) ? nextData[0].options : Object.values(nextData[0].options || {}),
              correctAnswer: nextData[0].correct_answer,
              difficulty: (nextData[0].difficulty || 'medium') as 'easy' | 'medium' | 'hard',
              category: nextData[0].category,
              gems: nextData[0].points || 10,
              explanation: nextData[0].explanation || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching question:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuestionData();
  }, [questionId, questionSlug]);

  const handleQuizComplete = (isCorrect: boolean, selectedAnswer: string) => {
    // Reveal the answer inline; user can click "Next Question" or wait for auto-advance.
    setAnswered({ isCorrect, selected: selectedAnswer });
    setCountdown(AUTO_ADVANCE_SECONDS);

    // Track an app-like running session streak across in-place navigations.
    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    sessionStorage.setItem(SESSION_STREAK_KEY, String(newStreak));

    const newAnswered = sessionAnswered + 1;
    setSessionAnswered(newAnswered);
    sessionStorage.setItem(SESSION_ANSWERED_KEY, String(newAnswered));
  };

  const goToNextQuestion = React.useCallback(async () => {
    if (loadingNext) return;
    setLoadingNext(true);
    try {
      let next = await getRandomQuestion();
      if (next.id === questionId) {
        next = await getRandomQuestion();
      }
      navigate(`/quiz/question/${next.id}/${getCategorySlug(next.category)}/${createSlug(next.question, 80)}`);
    } catch (e) {
      console.error('Failed to load next question', e);
    } finally {
      setLoadingNext(false);
    }
  }, [loadingNext, navigate, questionId]);

  // Auto-advance after the user answers, with a live countdown.
  useEffect(() => {
    if (!answered) return;
    setCountdown(AUTO_ADVANCE_SECONDS);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          goToNextQuestion();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [answered, goToNextQuestion]);

  const generateQuestionSchema = () => {
    if (!question) return null;
    
    const questionUrl = `https://cuiz.in/quiz/question/${question.id}/${getCategorySlug(question.category)}/${createSlug(question.question, 80)}`;
    const dateStr = question.createdAt ? new Date(question.createdAt).toISOString() : new Date('2024-01-01').toISOString();
    
    // Quiz schema for educational content rich snippets
    return {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      'name': question.question,
      'about': {
        '@type': 'Thing',
        'name': question.category
      },
      'educationalLevel': question.difficulty,
      'url': questionUrl,
      'datePublished': dateStr,
      'author': {
        '@type': 'Organization',
        'name': 'CuizIN',
        'url': 'https://cuiz.in'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'CuizIN',
        'url': 'https://cuiz.in',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://cuiz.in/favicon.ico'
        }
      },
      'hasPart': [{
        '@type': 'Question',
        'name': question.question,
        'text': question.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': question.correctAnswer,
          'url': `${questionUrl}#answer`,
          'author': {
            '@type': 'Organization',
            'name': 'CuizIN',
            'url': 'https://cuiz.in'
          }
        },
        'suggestedAnswer': question.options.filter(opt => opt !== question.correctAnswer).map(option => ({
          '@type': 'Answer',
          'text': option
        }))
      }]
    };
  };

  // Generate FAQPage schema for FAQ-style rich results in Google Search
  const generateFAQPageSchema = () => {
    if (!question) return null;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [{
        '@type': 'Question',
        'name': question.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `The correct answer is: ${question.correctAnswer}. ${question.explanation || `This is a ${question.difficulty} level ${question.category} question.`}`
        }
      }]
    };
  };

  // Generate clean, authentic Question / Answer schema for AI and Search Engines
  const generateQuestionAnswerSchema = () => {
    if (!question) return null;
    const categorySlug = getCategorySlug(question.category);
    const canonicalSlug = createSlug(question.question, 80);
    const subSlug = getQuestionSubcategorySlug(question.category, question.question);
    const questionUrl = subSlug
      ? `https://cuiz.in/quiz/question/${question.id}/${categorySlug}/${subSlug}/${canonicalSlug}`
      : `https://cuiz.in/quiz/question/${question.id}/${categorySlug}/${canonicalSlug}`;
    const datePublishedStr = question.createdAt ? new Date(question.createdAt).toISOString() : '2024-01-01T00:00:00Z';
    const dateModifiedStr = new Date().toISOString().split('T')[0];
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Question',
      'name': question.question,
      'text': question.question,
      'url': questionUrl,
      'answerCount': 1,
      'datePublished': datePublishedStr,
      'dateModified': dateModifiedStr,
      'author': {
        '@type': 'Organization',
        'name': 'CuizIN Editorial Team',
        'url': 'https://cuiz.in/editorial-policy'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'CuizIN',
        'url': 'https://cuiz.in'
      },
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': question.correctAnswer,
        'url': `${questionUrl}#answer`,
        'datePublished': datePublishedStr,
        'dateModified': dateModifiedStr,
        'author': {
          '@type': 'Organization',
          'name': 'CuizIN Editorial Team',
          'url': 'https://cuiz.in/editorial-policy'
        }
      }
    };
  };

  // Generate social metadata using canonical URL utility
  const socialMeta = question ? generateQuestionSocialMeta({
    id: question.id,
    question: question.question,
    category: question.category,
    difficulty: question.difficulty,
    options: question.options
  }, keywords) : null;

  const pageTitle = socialMeta?.title || 'Quiz Question | CuizIN';
  const pageDescription = socialMeta?.description || 
    'Play our interactive quiz game and challenge yourself with interesting questions across various categories.';

  // Use consistent slug generation from urlUtils
  const categorySlug = question ? getCategorySlug(question.category) : '';
  
  // Create consistent slug for canonical URL (matches sitemap generation)
  const canonicalSlug = question ? createSlug(question.question, 80) : '';

  const subSlug = question ? getQuestionSubcategorySlug(question.category, question.question) : undefined;
  const subDef = question && subSlug ? getSubcategory(categorySlug, subSlug) : undefined;

  const factType = question ? getFactType(question.question, question.category) : 'timeless';
  const provenance = getProvenanceBadge(factType);
  const sources = question ? getQuestionSources(question.category, question.sources) : [];

  // JSON-LD breadcrumbs
  const breadcrumbs = question ? [
    createBreadcrumbs.home(),
    createBreadcrumbs.quiz(),
    createBreadcrumbs.custom(question.category, `/categories/${categorySlug}`),
    ...(subDef ? [createBreadcrumbs.custom(subDef.name, `/categories/${categorySlug}/${subSlug}`)] : []),
    createBreadcrumbs.custom('Question', subSlug 
      ? `/quiz/question/${questionId}/${categorySlug}/${subSlug}/${canonicalSlug}`
      : `/quiz/question/${questionId}/${categorySlug}/${canonicalSlug}`)
  ] : [];

  return (
    <PageLayout>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonicalUrl={socialMeta?.canonicalUrl}
        ogType={socialMeta?.ogType || 'website'}
        ogImage={socialMeta?.ogImage}
        schemaType="Quiz"
        schemaData={generateQuestionSchema()}
        keywords={socialMeta?.keywords || keywords}
      />
      {question && <BreadcrumbSchema items={breadcrumbs} />}
      {/* FAQPage schema for FAQ-style rich results */}
      {question && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFAQPageSchema())
          }}
        />
      )}
      {/* Schema.org Question + Answer structured data for AI & search indexing */}
      {question && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateQuestionAnswerSchema())
          }}
        />
      )}

      {/* Soft, dismissible registration nudge for guests after a few questions — no login wall */}
      {isGuest && <RegistrationIncentiveModal triggerAfterQuestions={3} />}
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/"><Home className="h-4 w-4 mr-1" /></Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/quiz">Quiz</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {question && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/categories/${categorySlug}`}>{question.category}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                {subDef && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to={`/categories/${categorySlug}/${subSlug}`}>{subDef.name}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{question ? 'Question' : 'Loading...'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Ad placement - Top of question page */}
        <SimpleAdBanner position="header" slotId="question-top" className="mb-8" />
        
        {/* Visible, SEO-optimized heading */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
              <Brain className="h-4 w-4" />
              {question ? `${question.category} Quiz` : 'Quiz Question'}
            </div>
            {question && (
              <span className={`inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-0.5 border ${
                provenance.isDynamic 
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              }`}>
                <ShieldCheck className="h-3 w-3" />
                {provenance.label}
              </span>
            )}
            {question && (
              <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 border capitalize">
                {question.difficulty}
              </span>
            )}
          </div>
          {/* App-like engagement hook */}
          {sessionAnswered > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1">
                  <Flame className="h-3.5 w-3.5" /> {streak} in a row
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
                <Sparkles className="h-3.5 w-3.5" /> {sessionAnswered} answered this session
              </span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            {question ? question.question : 'Loading question...'}
          </h1>
          {question && keywords.length > 0 && (
            <p className="text-muted-foreground mt-3 text-sm">
              <span className="font-medium text-foreground">Keywords:</span> {keywords.slice(0, 8).join(', ')}
            </p>
          )}
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {/* SEO-friendly loading state with static content */}
            <div className="bg-card rounded-lg p-6 border">
              <p className="text-muted-foreground text-center">
                Loading quiz question... Answer correctly to earn gems and compete on the leaderboard!
              </p>
              <LoadingCard />
            </div>
            
            {/* Static helpful content while loading */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h2 className="font-semibold mb-2">How to Play</h2>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Select the correct answer from the options</li>
                <li>• Earn 2-4 gems based on difficulty</li>
                <li>• Build streaks for bonus rewards</li>
              </ul>
            </div>
          </div>
        ) : question ? (
          <div className="space-y-6">
            {/* Hidden SEO content for search engines (fallback) */}
            <div className="hidden">
              <p>Category: {question.category}</p>
              <p>Difficulty: {question.difficulty}</p>
              <ul>
                {question.options.map((option, idx) => (
                  <li key={idx}>{option}</li>
                ))}
              </ul>
            </div>
            
            {question.questionType === 'image' ? (
              <ImageQuizContent
                question={question}
                onComplete={(isCorrect, selectedOption) => handleQuizComplete(isCorrect, selectedOption)}
              />
            ) : (
              <QuizCard 
                question={question} 
                onComplete={handleQuizComplete}
                skipAutoNavigation
              />
            )}

            {answered && (
              <div className={`rounded-xl border p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 ${
                answered.isCorrect ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100' : 'bg-destructive/10 border-destructive/20 text-destructive-foreground'
              }`}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className={`text-lg font-bold ${answered.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                    {answered.isCorrect ? '✅ Correct!' : '❌ Not quite'}
                  </h3>
                  <span className="text-xs text-muted-foreground">Next question in {countdown}s…</span>
                </div>
                {!answered.isCorrect && (
                  <p className="text-sm mb-2 text-stone-200">
                    Correct answer: <strong className="text-white">{question.correctAnswer}</strong>
                  </p>
                )}
                {question.explanation && (
                  <p className="text-sm text-muted-foreground mb-3">{question.explanation}</p>
                )}
                <Button
                  onClick={goToNextQuestion}
                  disabled={loadingNext}
                  className="w-full"
                  size="lg"
                >
                  {loadingNext ? 'Loading…' : 'Next Question →'}
                </Button>
              </div>
            )}
            
            {/* SEO Content Bulking Block for AdSense */}
            <div className="mt-8 bg-card rounded-lg p-6 border shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Topic Context & Learning
              </h2>
              
              {question.explanation && (
                <div className="mb-5">
                  <h3 className="font-semibold text-foreground mb-2">Did You Know?</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    {question.explanation}
                  </p>
                </div>
              )}
              
              <div className="text-sm md:text-base text-muted-foreground space-y-3">
                <p>
                  This <strong className="text-foreground capitalize">{question.difficulty}</strong> level educational question is designed to test your understanding of <strong className="text-foreground">{question.category}</strong>. 
                  Whether you are preparing for a general knowledge test, engaging in daily learning, or simply enjoying trivia, 
                  taking the time to practice these questions improves cognitive retention and helps build a stronger foundational knowledge base.
                </p>
                
                {keywords.length > 0 && (
                  <p>
                    <strong className="text-foreground">Key subjects covered in this topic:</strong> We have identified several important educational terms associated with this question. 
                    These concepts include <span className="font-medium text-foreground">{keywords.join(', ')}</span>. 
                    Mastering these topics will help you perform better in our comprehensive {question.category} trivia challenges and expand your overall expertise in the subject matter.
                  </p>
                )}
              </div>

              {/* Authoritative Citations Section */}
              {sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    Authoritative Reference Citations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url || '#'}
                        target={src.url ? '_blank' : undefined}
                        rel={src.url ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center gap-1 text-xs bg-muted/70 hover:bg-muted text-foreground px-2.5 py-1 rounded-md border transition-colors"
                      >
                        <span>{src.title}</span>
                        {src.url && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Provenance & Fact-Check Metadata */}
              <div className="pt-4 mt-4 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Fact-checked by <strong>CuizIN Editorial Team</strong> · <Link to="/editorial-policy" className="text-primary hover:underline">Editorial Policy</Link> · <Link to="/our-sources" className="text-primary hover:underline">Our Sources</Link></span>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-muted-foreground hover:text-foreground underline text-xs cursor-pointer bg-transparent border-0 p-0"
                  >
                    Report an error / Suggest source
                  </button>
                </div>
              </div>
            </div>
            
            {/* Question navigation */}
            <div className="flex justify-between mt-8">
              {(() => {
                if (!prevQuestion) return <div></div>;
                const prevCatSlug = getCategorySlug(prevQuestion.category);
                const prevSubSlug = getQuestionSubcategorySlug(prevQuestion.category, prevQuestion.question);
                const prevUrl = prevSubSlug
                  ? `/quiz/question/${prevQuestion.id}/${prevCatSlug}/${prevSubSlug}/${createSlug(prevQuestion.question, 50)}`
                  : `/quiz/question/${prevQuestion.id}/${prevCatSlug}/${createSlug(prevQuestion.question, 50)}`;
                return (
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    asChild
                  >
                    <Link to={prevUrl}>
                      <ChevronLeft className="h-4 w-4" /> Previous Question
                    </Link>
                  </Button>
                );
              })()}
              
              {(() => {
                if (!nextQuestion) return null;
                const nextCatSlug = getCategorySlug(nextQuestion.category);
                const nextSubSlug = getQuestionSubcategorySlug(nextQuestion.category, nextQuestion.question);
                const nextUrl = nextSubSlug
                  ? `/quiz/question/${nextQuestion.id}/${nextCatSlug}/${nextSubSlug}/${createSlug(nextQuestion.question, 50)}`
                  : `/quiz/question/${nextQuestion.id}/${nextCatSlug}/${createSlug(nextQuestion.question, 50)}`;
                return (
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                    asChild
                  >
                    <Link to={nextUrl}>
                      Next Question <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                );
              })()}
            </div>
            
            <SimpleAdBanner position="content" className="my-8" />
            
            {/* Keywords/Tags section */}
            {keywords.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Tag className="h-4 w-4" /> Related Topics:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.slice(0, 8).map((keyword, index) => (
                    <span key={index} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {relatedQuestions.length > 0 && question && (
              <RelatedQuestions 
                questions={relatedQuestions}
                currentCategory={question.category}
                title="Related Questions"
              />
            )}
            
            {/* Added for AdSense Text Bulking - Cross Linking */}
            {question && (
              <RelatedArticles currentCategory={question.category} limit={2} />
            )}
            
            {/* Ad placement - Bottom of question page */}
            <SimpleAdBanner position="footer" slotId="question-bottom" className="mt-8" />
          </div>
        ) : (
          <div className="p-8 text-center bg-card rounded-lg border">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold">Question Not Found</h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              The quiz question you are looking for doesn't exist or has been removed. 
              Try browsing our categories or play a random quiz!
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button asChild>
                <Link to="/quiz">Play Quiz</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/categories">Browse Categories</Link>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Interactive Fact Correction / Source Suggestion Modal */}
      {question && (
        <ReportErrorModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          questionId={question.id}
          questionText={question.question}
          currentAnswer={question.correctAnswer}
          category={question.category}
        />
      )}
    </PageLayout>
  );
};

export default QuizQuestionPage;
