import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Sparkles, Brain, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getRandomQuestion, QuizQuestion } from '@/utils/quizData';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

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

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const correct = answer === question?.correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
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
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 border-primary/20 shadow-2xl">
              <CardContent className="p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-14 bg-muted rounded-xl" />
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
          <Card className="border-2 border-primary/20 shadow-2xl bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 md:p-8">
              {/* Category badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  {question?.category || 'General'}
                </span>
                <span className="text-sm text-muted-foreground">
                  +{question?.points || 10} points
                </span>
              </div>

              {/* Question */}
              <h3 className="text-xl md:text-2xl font-semibold text-center mb-8 leading-relaxed">
                {question?.question}
              </h3>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {question?.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option === question.correctAnswer;
                  
                  let optionClasses = "relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer text-left font-medium";
                  
                  if (!isAnswered) {
                    optionClasses += " border-border hover:border-primary hover:bg-primary/5 hover:scale-[1.02]";
                  } else if (isCorrectAnswer) {
                    optionClasses += " border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                  } else if (isSelected && !isCorrectAnswer) {
                    optionClasses += " border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
                  } else {
                    optionClasses += " border-border opacity-50";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={isAnswered}
                      className={optionClasses}
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{option}</span>
                      </span>
                      {isAnswered && isCorrectAnswer && (
                        <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                      )}
                      {isAnswered && isSelected && !isCorrectAnswer && (
                        <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Result message */}
              {isAnswered && (
                <div className={cn(
                  "p-4 rounded-xl text-center mb-6 animate-fade-in",
                  isCorrect ? "bg-green-500/10 border border-green-500/30" : "bg-amber-500/10 border border-amber-500/30"
                )}>
                  {isCorrect ? (
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        Correct! You earned {question?.points || 10} points!
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                        Not quite! The correct answer was: {question?.correctAnswer}
                      </p>
                      {question?.explanation && (
                        <p className="text-sm text-muted-foreground">{question.explanation}</p>
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
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Continue Playing
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    onClick={handleTryAnother}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    Try Another Question
                  </Button>
                </div>
              )}

              {!isAnswered && (
                <p className="text-center text-sm text-muted-foreground">
                  Click an option to see if you're right!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TryQuestionSection;
