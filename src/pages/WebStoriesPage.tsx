import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { createSlug } from '@/utils/urlUtils';
import { ChevronLeft, ChevronRight, X, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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

const WebStoriesPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const [stories, setStories] = useState<StoryQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || showAnswer) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Auto advance to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowAnswer(false);
            setSelectedAnswer(null);
            return 0;
          }
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, showAnswer, currentIndex, stories.length]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    setShowAnswer(false);
    setSelectedAnswer(null);
  }, [currentIndex]);

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      try {
        // If storyId provided, start from that question
        let query = supabase
          .from('quiz_questions')
          .select('id, question, options, category, difficulty, explanation')
          .limit(10);

        if (storyId) {
          // Get the specific question and 9 more from same category
          const { data: mainQuestion } = await supabase
            .from('quiz_questions')
            .select('id, question, options, category, difficulty, explanation')
            .eq('id', storyId)
            .single();

          if (mainQuestion) {
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
            setIsLoading(false);
            return;
          }
        }

        // Default: get random questions
        const { data } = await query.order('created_at', { ascending: false });
        
        if (data) {
          setStories(data.map(q => ({
            id: q.id,
            question: q.question,
            options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
            category: q.category,
            difficulty: q.difficulty,
            explanation: q.explanation
          })));
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, [storyId]);

  const currentStory = stories[currentIndex];
  const colors = currentStory 
    ? categoryColors[currentStory.category] || categoryColors.default 
    : categoryColors.default;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
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
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading stories...</div>
      </div>
    );
  }

  if (!currentStory) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">No stories available</p>
          <Button onClick={() => navigate('/quiz')}>Play Quiz Instead</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Quiz Stories | ${currentStory.category} | CuizIN`}
        description={`Interactive quiz stories about ${currentStory.category}. Swipe through questions and test your knowledge!`}
        canonicalUrl={`https://cuiz.in/stories${storyId ? `/${storyId}` : ''}`}
        schemaType="WebPage"
        schemaData={storySchema}
      />

      <div className="fixed inset-0 bg-black">
        {/* Story Container */}
        <div className={`h-full w-full max-w-md mx-auto bg-gradient-to-b ${colors.bg} flex flex-col`}>
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
                <p className="text-white/70 text-xs">{currentStory.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center px-6 py-4">
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

            {/* Question */}
            <h2 className="text-white text-2xl font-bold mb-8 leading-tight">
              {currentStory.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
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
                    className={`w-full p-4 rounded-xl text-left font-medium transition-all ${optionClass}`}
                  >
                    <span className="mr-3">{String.fromCharCode(65 + idx)}.</span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showAnswer && currentStory.explanation && (
              <div className="mt-6 p-4 bg-white/10 rounded-xl">
                <p className="text-white/90 text-sm">{currentStory.explanation}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center px-4 py-6">
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

          {/* CTA */}
          {showAnswer && (
            <div className="px-6 pb-6">
              <Button
                className="w-full"
                size="lg"
                onClick={handleNext}
              >
                {currentIndex < stories.length - 1 ? 'Next Question' : 'Play Full Quiz'}
              </Button>
            </div>
          )}

          {/* Touch Navigation Areas */}
          <div 
            className="absolute left-0 top-20 bottom-20 w-1/4 cursor-pointer"
            onClick={handlePrevious}
          />
          <div 
            className="absolute right-0 top-20 bottom-20 w-1/4 cursor-pointer"
            onClick={handleNext}
          />
        </div>
      </div>
    </>
  );
};

export default WebStoriesPage;
