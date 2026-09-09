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
        setIsCorrect(!!data.is_correct);
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
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          {/* Fixed height to prevent CLS */}
          <div className="max-w-3xl mx-auto min-h-[400px] md:min-h-[350px]">
            <Card className="border-2 border-primary/20 shadow-2xl">
              <CardContent className="p-8">
                <div className="space-y-4" aria-hidden="true">
                  <div className="h-8 bg-muted rounded w-3/4 mx-auto animate-pulse" />
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto animate-pulse" />
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Brain className="w-4 h-4" />
            Try Before You Play
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Test Your <span className="text-primary">Knowledge</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Answer this question to see how our quiz works. No registration required!
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="scroll-paper rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-amber-700/30">
            {/* Ambient watermarks */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Category badge */}
            <div className="flex items-center justify-between mb-6">
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-950 border border-amber-600/30 px-3.5 py-1 rounded-full text-xs font-bold font-cinzel">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                {question?.category || 'General Knowledge'}
              </span>
              <span className="text-xs font-black text-amber-900/70 bg-white/70 px-2.5 py-1 rounded-full border border-amber-600/20">
                +{question?.gems || 10} 💎 Gems
              </span>
            </div>

            {/* Question */}
            <h3 className="text-xl md:text-2xl font-bold text-center mb-8 leading-relaxed font-cinzel text-amber-950">
              {question?.question}
            </h3>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {question?.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === question.correctAnswer;
                
                let optionClasses = "relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left font-semibold btn-3d";
                
                if (!isAnswered) {
                  optionClasses += " border-amber-700/25 bg-white/80 hover:bg-white hover:border-amber-600 hover:shadow-md text-amber-950";
                } else if (isCorrectAnswer) {
                  optionClasses += " border-emerald-600 bg-emerald-500/15 text-emerald-950 ring-2 ring-emerald-500/50 font-bold";
                } else if (isSelected && !isCorrectAnswer) {
                  optionClasses += " border-rose-600 bg-rose-500/15 text-rose-950 ring-2 ring-rose-500/50";
                } else {
                  optionClasses += " border-amber-800/10 opacity-40 bg-stone-100/50 text-stone-500";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isAnswered}
                    className={optionClasses}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 text-amber-900 border border-amber-600/30 flex items-center justify-center text-xs font-black">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm font-medium">{option}</span>
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
                "p-4 rounded-2xl text-center mb-6 animate-fade-in",
                isCorrect ? "bg-emerald-500/15 border border-emerald-600/30 text-emerald-950" : "bg-amber-500/15 border border-amber-600/30 text-amber-950"
              )}>
                {isCorrect ? (
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm">
                      Thy answer is true! Awarded +{question?.gems || 10} Royal Gems!
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-sm text-rose-900 mb-1">
                      Alas, incorrect! The true path was: {question?.correctAnswer}
                    </p>
                    {question?.explanation && (
                      <p className="text-xs text-amber-900/80 font-medium">{question.explanation}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            {isAnswered && (
              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
                <Button
                  onClick={handlePlayMore}
                  size="lg"
                  className="flex-1 btn-3d font-black uppercase text-xs tracking-wider text-stone-950 border-0 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, hsl(42 90% 50%) 0%, hsl(34 92% 44%) 100%)',
                    boxShadow: '0 3px 0 hsl(34 92% 26%), 0 6px 18px rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Continue Imperial Quest
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={handleTryAnother}
                  variant="outline"
                  size="lg"
                  className="btn-3d border-2 border-amber-800/40 bg-white/70 text-amber-950 font-black text-xs uppercase tracking-wider hover:bg-white"
                >
                  Next Trial
                </Button>
              </div>
            )}

            {!isAnswered && (
              <p className="text-center text-xs text-amber-900/60 font-semibold mt-4">
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
