import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/urlUtils';
import { ChevronLeft, ChevronRight, X, Play, Pause, BookOpen, Brain, RefreshCw, Trophy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ProxiedVastVideoAd from '@/components/ads/ProxiedVastVideoAd';
import { isNativeAds, showLevelPlayVideoAd } from '@/mobile/ads/levelplay';
import { cn } from '@/lib/utils';

const STORY_AD_TAG = 'https://vast.yomeno.xyz/vast?spot_id=1494657';
const AD_EVERY = 2;

interface StoryQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: string;
  category: string;
  difficulty: string | null;
  explanation: string | null;
}

// Category colors for story backgrounds
const categoryColors: Record<string, { bg: string; accent: string }> = {
  'History': { bg: 'from-amber-600 to-orange-800', accent: 'bg-amber-500' },
  'Science': { bg: 'from-blue-600 to-cyan-800', accent: 'bg-blue-500' },
  'Geography': { bg: 'from-green-600 to-emerald-800', accent: 'bg-green-500' },
  'Entertainment': { bg: 'from-purple-600 to-pink-800', accent: 'bg-purple-500' },
  'Sports': { bg: 'from-red-600 to-rose-800', accent: 'bg-red-500' },
  'General Knowledge': { bg: 'from-indigo-600 to-violet-800', accent: 'bg-indigo-500' },
  'default': { bg: 'from-gray-700 to-slate-900', accent: 'bg-gray-500' }
};

// Matching emojis for categories
const categoryEmojis: Record<string, string> = {
  'History': '📜',
  'Science': '🔬',
  'Geography': '🌍',
  'Entertainment': '🎭',
  'Sports': '⚽',
  'General Knowledge': '🧠',
  'default': '🎲'
};

const WebStoriesPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  
  // Quiz and category states
  const [stories, setStories] = useState<StoryQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  // Loading and playback states
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [adRemaining, setAdRemaining] = useState(10);
  const [adPendingClose, setAdPendingClose] = useState(false);

  // Enforce a minimum 10-second wait before the video ad can be skipped.
  useEffect(() => {
    if (!showAd) return;
    setAdRemaining(10);
    setAdPendingClose(false);
    const t = setInterval(() => {
      setAdRemaining((r) => {
        if (r <= 1) { clearInterval(t); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [showAd]);

  // If the video finished/was unavailable before the 10s gate, auto-close once it elapses.
  useEffect(() => {
    if (showAd && adPendingClose && adRemaining <= 0) closeAd();
  }, [showAd, adPendingClose, adRemaining]);

  // Auto-advance timer: 12 seconds per question (100 steps × 120ms).
  useEffect(() => {
    if (isPaused || showAnswer || showAd || !selectedCategory) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (next >= 100) {
          // Auto advance to next story
          if (currentIndex < stories.length - 1) {
            goToNext();
            return 0;
          }
          return 100;
        }
        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isPaused, showAnswer, showAd, currentIndex, stories.length, selectedCategory]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    setShowAnswer(false);
    setSelectedAnswer(null);
  }, [currentIndex]);

  // Initial category list & storyID setup
  useEffect(() => {
    const fetchInitialSetup = async () => {
      setIsLoading(true);
      try {
        // Query distinct categories dynamically based on actual database questions
        const { data: catData, error: catError } = await supabase
          .from('quiz_questions')
          .select('category');
        
        if (!catError && catData) {
          const unique = Array.from(new Set(catData.map(q => q.category).filter(Boolean))).sort();
          setAvailableCategories(unique);
        }

        // If storyId is present in URL, directly launch that specific story question
        if (storyId) {
          const { data: mainQuestion } = await supabase
            .from('quiz_questions')
            .select('id, question, options, category, difficulty, explanation')
            .eq('id', storyId)
            .single();

          if (mainQuestion) {
            setSelectedCategory(mainQuestion.category);
            
            const { data: relatedQuestions } = await supabase
              .from('quiz_questions')
              .select('id, question, options, category, difficulty, explanation')
              .eq('category', mainQuestion.category)
              .neq('id', storyId)
              .limit(9);

            const allQuestions = [mainQuestion, ...(relatedQuestions || [])];
            setStories(allQuestions.map(q => ({
              id: q.id,
              question: q.question,
              options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
              category: q.category,
              difficulty: q.difficulty,
              explanation: q.explanation
            })));
          }
        }
      } catch (error) {
        console.error('Error in stories initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialSetup();
  }, [storyId]);

  // Fetch a fresh set of random questions from the chosen category
  const fetchQuestionsForCategory = async (cat: string) => {
    setIsLoading(true);
    setCorrectCount(0);
    try {
      let query = supabase
        .from('quiz_questions')
        .select('id, question, options, category, difficulty, explanation');
      
      if (cat !== 'random') {
        query = query.eq('category', cat);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Shuffle the pool and select up to 10 questions
        const shuffled = [...data].sort(() => 0.5 - Math.random()).slice(0, 10);
        setStories(shuffled.map(q => ({
          id: q.id,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
          category: q.category,
          difficulty: q.difficulty,
          explanation: q.explanation
        })));
        setCurrentIndex(0);
        setProgress(0);
        setShowAnswer(false);
        setSelectedAnswer(null);
      } else {
        setStories([]);
      }
    } catch (err) {
      console.error('Error fetching questions for category:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    fetchQuestionsForCategory(cat);
  };

  const currentStory = stories[currentIndex];
  const colors = currentStory 
    ? categoryColors[currentStory.category] || categoryColors.default 
    : categoryColors.default;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Advance index and insert video ads slide after every 2 questions
  const goToNext = () => {
    if (currentIndex >= stories.length - 1) return;
    const nextIndex = currentIndex + 1;
    if ((currentIndex + 1) % AD_EVERY === 0) {
      // Native builds play a Unity LevelPlay video; the web VAST overlay is
      // only used when no native ad is available.
      if (isNativeAds()) {
        setIsPaused(true);
        showLevelPlayVideoAd('interstitial').then((shown) => {
          if (shown) {
            setIsPaused(false);
            setCurrentIndex(nextIndex);
          } else {
            setPendingIndex(nextIndex);
            setShowAd(true);
          }
        });
        return;
      }
      setPendingIndex(nextIndex);
      setShowAd(true);
      setIsPaused(true);
      return;
    }
    setCurrentIndex(nextIndex);
  };

  const closeAd = () => {
    setShowAd(false);
    setIsPaused(false);
    if (pendingIndex !== null) {
      setCurrentIndex(pendingIndex);
      setPendingIndex(null);
    }
  };

  const handleNext = () => {
    goToNext();
  };

  const handleAnswerSelect = async (answer: string) => {
    setSelectedAnswer(answer);
    setShowAnswer(true);
    setIsPaused(true);

    if (!currentStory) return;
    try {
      const { data, error } = await supabase.functions.invoke('validate-quiz-answer', {
        body: { question_id: currentStory.id, selected_answer: answer }
      });
      if (!error && data?.correct_answer) {
        const isCorrect = answer === data.correct_answer;
        if (isCorrect) {
          setCorrectCount(prev => prev + 1);
        }
        setStories(prev => prev.map((s, idx) =>
          idx === currentIndex ? { ...s, correctAnswer: data.correct_answer, explanation: data.explanation || s.explanation } : s
        ));
      }
    } catch (err) {
      console.error('[WebStories] validate error', err);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  // Web Story Schema
  const storySchema = currentStory ? {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': `Quiz Story: ${currentStory.question.substring(0, 50)}...`,
    'description': `Interactive quiz story about ${currentStory.category}. Swipe through questions and test your knowledge!`,
    'url': `https://cuiz.in/stories${storyId ? `/${storyId}` : ''}`,
    'image': 'https://cuiz.in/og-image.png',
    'author': {
      '@type': 'Organization',
      'name': 'CuizIN'
    }
  } : null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <div className="text-white text-sm font-semibold tracking-wider">Loading stories...</div>
      </div>
    );
  }

  const isLastQuestionFinished = currentIndex === stories.length - 1 && showAnswer;

  return (
    <>
      <SEO
        title={currentStory ? `Quiz Stories | ${currentStory.category} | CuizIN` : 'Interactive Stories | CuizIN'}
        description={currentStory ? `Interactive quiz stories about ${currentStory.category}. Swipe through questions and test your knowledge!` : 'Interact with trivia story clips.'}
        canonicalUrl={`https://cuiz.in/stories${storyId ? `/${storyId}` : ''}`}
        schemaType="WebPage"
        schemaData={storySchema}
      />

      <div className="fixed inset-0 bg-black">
        {/* Story Container */}
        <div className={`h-full w-full max-w-md mx-auto bg-gradient-to-b ${colors.bg} flex flex-col`}>
          
          {/* 1. CATEGORY PICKER VIEW */}
          {!selectedCategory ? (
            <div className="flex-1 flex flex-col px-6 py-8 justify-between text-white bg-slate-950">
              <div className="text-center mt-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-md shadow-violet-500/20">
                  <BookOpen className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="text-white text-2xl font-black tracking-wide">CuizIN Stories</h2>
                <p className="text-slate-300 text-xs mt-1.5 max-w-xs mx-auto">
                  Choose a category to start your story quiz. Answer 10 questions and earn gems.
                </p>
              </div>

              {/* Category Options List */}
              <div className="flex-1 my-8 overflow-y-auto max-h-[50vh] pr-1 space-y-2.5 scrollbar-thin">
                {/* Random Mix */}
                <button
                  onClick={() => handleSelectCategory('random')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 hover:from-violet-600/40 hover:to-indigo-600/40 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎲</span>
                    <div className="text-left">
                      <p className="font-bold text-sm">Random Mix</p>
                      <p className="text-[10px] text-slate-300">Shuffle questions from all topics</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Dynamic database categories */}
                {availableCategories.map((cat) => {
                  const emoji = categoryEmojis[cat] || categoryEmojis.default;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleSelectCategory(cat)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{emoji}</span>
                        <div className="text-left">
                          <p className="font-bold text-sm">{cat}</p>
                          <p className="text-[10px] text-slate-300">Play {cat} story questions</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  );
                })}
              </div>

              <div className="pb-4">
                <Button 
                  onClick={handleClose}
                  variant="outline" 
                  className="w-full border-white/20 text-white hover:bg-white/10 font-bold py-2.5 rounded-xl transition-all"
                >
                  Exit Stories
                </Button>
              </div>
            </div>
          ) : (
            
            // 2. ACTIVE STORIES VIEW
            <>
              {/* Progress Bars */}
              <div className="flex gap-1 p-2 pt-4">
                {stories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-100"
                      style={{ 
                        width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${colors.accent} flex items-center justify-center text-white text-sm font-bold`}>
                    Q
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">CuizIN</p>
                    <p className="text-white/70 text-xs">{currentStory?.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isLastQuestionFinished && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsPaused(!isPaused)}
                    >
                      {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setSelectedCategory(null)}
                    title="Change Category"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Content Panel */}
              <div className="flex-1 flex flex-col justify-center px-6 py-4">
                
                {/* 2A. SET COMPLETED SUMMARY PANEL */}
                {isLastQuestionFinished ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 animate-in fade-in duration-300">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl shadow-lg border border-white/20 animate-bounce">
                      🏆
                    </div>
                    <div>
                      <h2 className="text-white text-2xl font-black tracking-wide">Story Completed!</h2>
                      <p className="text-white/70 text-xs mt-1">Excellent job playing through the questions.</p>
                    </div>

                    <div className="bg-white/10 rounded-2xl p-5 w-full border border-white/10 shadow-inner">
                      <p className="text-white/60 text-[10px] uppercase font-bold tracking-wider">Your Score</p>
                      <p className="text-white text-4xl font-extrabold mt-1">{correctCount} / {stories.length}</p>
                      <p className="text-white/50 text-[10px] mt-1.5 font-medium">
                        Accuracy: {Math.round((correctCount / stories.length) * 100)}%
                      </p>
                    </div>

                    <div className="space-y-2.5 w-full pt-4">
                      <Button
                        onClick={() => fetchQuestionsForCategory(selectedCategory)}
                        className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Start Fresh Set</span>
                      </Button>
                      <Button
                        onClick={() => setSelectedCategory(null)}
                        variant="outline"
                        className="w-full border-white/20 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl transition-all"
                      >
                        Choose Another Category
                      </Button>
                      <Button
                        onClick={() => navigate('/quiz')}
                        variant="ghost"
                        className="w-full text-white/60 hover:text-white font-bold py-2.5 rounded-xl transition-all"
                      >
                        Play Full Quiz Mode
                      </Button>
                    </div>
                  </div>
                ) : (
                  
                  // 2B. ACTIVE QUESTION & OPTIONS PANEL
                  currentStory && (
                    <>
                      {/* Difficulty Badge */}
                      {currentStory.difficulty && (
                        <div className="mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            currentStory.difficulty === 'easy' ? 'bg-green-500' :
                            currentStory.difficulty === 'hard' ? 'bg-red-500' : 'bg-yellow-500'
                          } text-white`}>
                            {currentStory.difficulty.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Question Text */}
                      <h2 className="text-white text-2xl font-bold mb-8 leading-tight">
                        {currentStory.question}
                      </h2>

                      {/* Option Buttons */}
                      <div className="space-y-3 flex-1 flex flex-col justify-start">
                        {currentStory.options.map((option, idx) => {
                          const isCorrect = option === currentStory.correctAnswer;
                          const isSelected = option === selectedAnswer;
                          
                          let optionClass = 'bg-white/20 hover:bg-white/30 text-white';
                          if (showAnswer) {
                            if (isCorrect) {
                              optionClass = 'bg-green-500 text-white';
                            } else if (isSelected && !isCorrect) {
                              optionClass = 'bg-red-500 text-white';
                            } else {
                              optionClass = 'bg-white/10 text-white/60';
                            }
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => !showAnswer && handleAnswerSelect(option)}
                              disabled={showAnswer}
                              className={`w-full p-3 rounded-xl text-left font-medium transition-all ${optionClass}`}
                            >
                              <span className="mr-3">{String.fromCharCode(65 + idx)}.</span>
                              {option}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {showAnswer && currentStory.explanation && (
                        <div className="mt-6 p-4 bg-white/10 rounded-xl animate-in slide-in-from-bottom-2 duration-200">
                          <p className="text-white/90 text-sm">{currentStory.explanation}</p>
                        </div>
                      )}
                    </>
                  )
                )}
              </div>

              {/* Navigation Indicators */}
              {!isLastQuestionFinished && (
                <div className="flex justify-between items-center px-4 py-3">
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  
                  <div className="text-white text-sm">
                    {currentIndex + 1} / {stories.length}
                  </div>
                  
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={handleNext}
                    disabled={currentIndex === stories.length - 1}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              )}

              {/* Next Question CTA (When not on the final summary slide) */}
              {showAnswer && !isLastQuestionFinished && (
                <div className="px-6 pb-4">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={handleNext}
                  >
                    Next Question
                  </Button>
                </div>
              )}

              {/* Left/Right Swipe/Touch Triggers */}
              {!isLastQuestionFinished && (
                <>
                  <div 
                    className="absolute left-0 top-20 bottom-20 w-1/4 cursor-pointer"
                    onClick={handlePrevious}
                  />
                  <div 
                    className="absolute right-0 top-20 bottom-20 w-1/4 cursor-pointer"
                    onClick={handleNext}
                  />
                </>
              )}

              {/* Sponsored Interstitial Video Ad Overlay */}
              {showAd && (
                <div className="absolute inset-0 z-[60] bg-black flex flex-col">
                  <div className="flex items-center justify-between px-4 py-4">
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 text-white/80 px-3 py-1 rounded-full">
                      Sponsored Ad
                    </span>
                    {adRemaining > 0 ? (
                      <span className="text-xs font-semibold bg-white/10 text-white/50 px-4 py-2 rounded-full">
                        Skip in {adRemaining}s
                      </span>
                    ) : (
                      <button
                        onClick={closeAd}
                        className="text-xs font-semibold bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-full transition-all"
                      >
                        Skip Ad
                      </button>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-center px-4">
                    <ProxiedVastVideoAd
                      tagUrl={STORY_AD_TAG}
                      onUnavailable={() => { if (adRemaining <= 0) closeAd(); else setAdPendingClose(true); }}
                      onComplete={() => { if (adRemaining <= 0) closeAd(); else setAdPendingClose(true); }}
                      className="w-full max-h-[70vh] object-contain rounded-2xl"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default WebStoriesPage;
