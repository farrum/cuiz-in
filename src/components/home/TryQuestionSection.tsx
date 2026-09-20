import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Brain, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getRandomQuestion, QuizQuestion } from '@/utils/quizData';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const TryQuestionSection: React.FC = () => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestion();
  }, []);

  const loadQuestion = async () => {
    setIsLoading(true);
    try {
      const q = await getRandomQuestion();
      setQuestion(q);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIsCorrect(false);
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = async (answer: string) => {
    if (isAnswered || !question) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-quiz-answer', {
        body: { question_id: question.id, selected_answer: answer },
      });
      if (!error && data) {
        const correct = !!data.is_correct;
        setIsCorrect(correct);
        if (correct) {
          try {
            import('canvas-confetti').then(m => m.default({ particleCount: 50, spread: 60, origin: { y: 0.6 } }));
          } catch {}
        }
        // Hydrate the question so the UI can display correct answer / explanation
        setQuestion((prev) => prev ? {
          ...prev,
          correctAnswer: data.correct_answer || prev.correctAnswer,
          explanation: data.explanation || prev.explanation,
        } : prev);
      } else {
        setIsCorrect(false);
      }
    } catch (err) {
      console.error('Error validating answer:', err);
      setIsCorrect(false);
    }
  };

  const handlePlayMore = () => {
    navigate('/quiz');
  };

  const handleTryAnother = () => {
    loadQuestion();
  };

  if (isLoading) {
    return (
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto min-h-[380px]">
            <div className="scroll-paper rounded-3xl p-8 border border-amber-600/30 shadow-xl space-y-5 animate-pulse">
              <div className="h-6 bg-amber-500/15 rounded-full w-1/3 mx-auto" />
              <div className="h-8 bg-amber-500/20 rounded-xl w-3/4 mx-auto" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-amber-500/10 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 relative overflow-hidden" aria-labelledby="try-question-heading">
      <div className="container mx-auto px-4 relative z-10">
        {/* Imperial Trial Header */}
        <div className="flex items-center gap-3 mb-8 max-w-3xl mx-auto">
          <span className="h-px flex-1 section-divider-shimmer rounded-full" />
          <div className="text-center px-4">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-amber-900/70 block font-cinzel">
              ⚔️ Imperial Trial Arena
            </span>
            <h2 id="try-question-heading" className="text-xl md:text-2xl font-black text-amber-950 font-cinzel">
              Test Thy Wit &amp; Claim Royal Bounty
            </h2>
            <p className="text-xs text-amber-800/70 font-semibold mt-0.5">
              Solve this ancient query before thee enter the Grand Citadel
            </p>
          </div>
          <span className="h-px flex-1 section-divider-shimmer rounded-full" />
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="scroll-paper rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border-2 border-amber-600/40">
            {/* Corner Gold Highlights */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Category & Gem Bounty Badges */}
            <div className="flex items-center justify-between mb-6">
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/25 to-yellow-500/15 text-amber-950 border border-amber-600/40 px-4 py-1.5 rounded-full text-xs font-black tracking-wide font-cinzel shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                {question?.category || 'General Knowledge'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-black text-amber-950 bg-amber-500/15 px-3 py-1.5 rounded-full border border-amber-600/30 shadow-sm">
                <span>+{question?.gems || 10}</span>
                <span>💎 Gems</span>
              </span>
            </div>

            {/* Question */}
            <h3 className="text-lg md:text-xl font-black text-center mb-8 leading-relaxed font-cinzel text-amber-950">
              {question?.question}
            </h3>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {question?.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === question.correctAnswer;

                const baseClasses = "relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left font-semibold shadow-sm";

                const stateClasses = !isAnswered
                  ? "bg-white/95 border-amber-800/25 text-amber-950 hover:bg-amber-50 hover:border-amber-500 hover:shadow-md hover:scale-[1.01]"
                  : isCorrectAnswer
                  ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/60 font-bold shadow-md shadow-emerald-500/10"
                  : isSelected && !isCorrectAnswer
                  ? "bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400/60 shadow-md shadow-rose-500/10"
                  : "bg-stone-100/80 border-stone-200 text-stone-400 opacity-60";

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isAnswered}
                    className={cn(baseClasses, stateClasses)}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-black shadow-sm",
                        !isAnswered
                          ? "bg-gradient-to-b from-amber-100 to-amber-200 text-amber-950 border-amber-400/80"
                          : isCorrectAnswer
                          ? "bg-emerald-200 text-emerald-950 border-emerald-500"
                          : isSelected && !isCorrectAnswer
                          ? "bg-rose-200 text-rose-950 border-rose-500"
                          : "bg-stone-200 text-stone-500 border-stone-300"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm font-bold leading-snug">{option}</span>
                    </span>
                    {isAnswered && isCorrectAnswer && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
                    )}
                    {isAnswered && isSelected && !isCorrectAnswer && (
                      <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Result message */}
            {isAnswered && (
              <div className={cn(
                "p-4 rounded-2xl text-center mb-6 animate-fade-in shadow-sm",
                isCorrect 
                  ? "bg-emerald-500/15 border border-emerald-600/30 text-emerald-950" 
                  : "bg-amber-500/15 border border-amber-600/30 text-amber-950"
              )}>
                {isCorrect ? (
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-emerald-600 animate-bounce" />
                    <span className="font-black text-sm">
                      Thy answer is true! Awarded +{question?.gems || 10} Royal Gems!
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="font-black text-sm text-rose-900 mb-1">
                      Alas, incorrect! The true path was: {question?.correctAnswer}
                    </p>
                    {question?.explanation && (
                      <p className="text-xs text-amber-900/80 font-semibold">{question.explanation}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            {isAnswered && (
              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
                <button
                  type="button"
                  onClick={handlePlayMore}
                  className="flex-1 btn-royal-gold py-3.5 px-6 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center cursor-pointer shadow-lg"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Continue Imperial Quest
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
                <button
                  type="button"
                  onClick={handleTryAnother}
                  className="btn-3d py-3.5 px-6 rounded-xl border-2 border-amber-700/40 bg-white/80 text-amber-950 font-black text-xs uppercase tracking-wider hover:bg-white cursor-pointer shadow-sm"
                >
                  Next Trial
                </button>
              </div>
            )}

            {!isAnswered && (
              <p className="text-center text-xs text-amber-900/70 font-bold mt-4">
                Choose an answer above to test thy wit!
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TryQuestionSection;
