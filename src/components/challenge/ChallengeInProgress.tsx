import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Challenge } from '@/hooks/challenge/challengeTypes';
import { QuizQuestion } from '@/utils/quizData';
import QuizCard from '@/components/QuizCard';
import MotivationalCharacter from '@/components/MotivationalCharacter';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import QuizInterstitial from '@/components/quiz/QuizInterstitial';
import { triggerWebInterstitial } from '@/utils/webInterstitialAd';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CountdownButton from '@/components/CountdownButton';
import AdvisorLifelineBar from '@/components/quiz/AdvisorLifelineBar';
import { buildAudiencePoll, type AdvisorId, type LifelineKind } from '@/utils/advisorShards';

interface ChallengeInProgressProps {
  challenge: Challenge;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  currentGems: number;
  onExit: () => void;
  onComplete: (selectedOption: string) => void;
  onNextQuestion: () => void;
}

const ChallengeInProgress: React.FC<ChallengeInProgressProps> = ({
  challenge,
  questions,
  currentQuestionIndex,
  currentGems,
  onExit,
  onComplete,
  onNextQuestion
}) => {
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [errorState, setErrorState] = useState<{ hasError: boolean, message: string }>({
    hasError: false,
    message: ""
  });
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [audiencePoll, setAudiencePoll] = useState<Record<string, number> | null>(null);
  const [usedLifelines, setUsedLifelines] = useState<AdvisorId[]>([]);

  const handleExitClick = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = () => {
    setShowExitDialog(false);
    onExit();
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  const handleSelectOption = (option: string) => {
    if (answerSubmitted) return; // Don't allow changing after submission
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    try {
      if (!selectedOption) {
        setErrorState({
          hasError: true,
          message: "Please select an answer to continue"
        });
        return;
      }
      
      setErrorState({ hasError: false, message: "" });
      setAnswerSubmitted(true);
      onComplete(selectedOption);
    } catch (error) {
      console.error("Error completing question:", error);
      setErrorState({
        hasError: true,
        message: "Something went wrong. Please try again."
      });
    }
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const currentQuestion = questions[currentQuestionIndex];

  const handleLifeline = (kind: LifelineKind, advisorId: AdvisorId) => {
    if (!currentQuestion) return;
    setUsedLifelines((prev) => [...prev, advisorId]);

    if (kind === 'fifty_fifty') {
      const wrongs = currentQuestion.options.filter(
        (o) => o !== currentQuestion.correctAnswer && !eliminatedOptions.includes(o),
      );
      setEliminatedOptions((prev) => [...prev, ...wrongs.sort(() => 0.5 - Math.random()).slice(0, 2)]);
    } else if (kind === 'audience_poll') {
      setAudiencePoll(
        buildAudiencePoll(
          currentQuestion.options.filter((o) => !eliminatedOptions.includes(o)),
          currentQuestion.correctAnswer,
        ),
      );
    } else if (kind === 'skip') {
      advanceToNextQuestion();
    }
  };

  const advanceToNextQuestion = () => {
    // Reset for next question
    setSelectedOption("");
    setAnswerSubmitted(false);
    setEliminatedOptions([]);
    setAudiencePoll(null);
    setUsedLifelines([]);
    onNextQuestion();
  };

  const handleNextQuestion = () => {
    // Show a full-screen ad break after every 2 answered questions
    // (but never right before the challenge completes).
    const answeredCount = currentQuestionIndex + 1;
    if (answeredCount % 2 === 0 && !isLastQuestion) {
      triggerWebInterstitial();
      setShowInterstitial(true);
      return;
    }
    advanceToNextQuestion();
  };

  const handleInterstitialContinue = () => {
    setShowInterstitial(false);
    advanceToNextQuestion();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleExitClick}
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Challenge
          </Button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{challenge?.title}</h1>
          {challenge?.description && (
            <p className="text-muted-foreground mt-1">{challenge.description}</p>
          )}
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-1">
            <span>Question {currentQuestionIndex + 1} of {challenge?.num_questions || 0}</span>
            <span>Gems: {currentGems}</span>
          </div>
          <Progress 
            value={((currentQuestionIndex) / (challenge?.num_questions || 1)) * 100} 
            className="h-2"
          />
        </div>
        
        {errorState.hasError && (
          <Alert variant="warning" className="mb-4">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              {errorState.message}
            </AlertDescription>
          </Alert>
        )}
        
        <SimpleAdBanner position="content" className="mb-6" />
        
        {questions.length > currentQuestionIndex ? (
          <div className="relative mb-8">
            <div className="absolute -top-16 -right-10 z-10 transform scale-75">
              <MotivationalCharacter 
                mood={answerSubmitted ? (selectedOption === questions[currentQuestionIndex].correctAnswer ? "happy" : "sad") : "neutral"}
                showMessage={answerSubmitted}
                message={selectedOption === questions[currentQuestionIndex].correctAnswer ? 
                  "Great job!" : 
                  `The correct answer was: ${questions[currentQuestionIndex].correctAnswer}`}
              />
            </div>
            
            <div className="quiz-card bg-card rounded-lg shadow-sm p-6 mb-4">
              <h3 className="text-lg font-medium mb-4">{questions[currentQuestionIndex].question}</h3>
              
              <div className="space-y-3">
                {questions[currentQuestionIndex].options.filter((o) => !eliminatedOptions.includes(o)).map((option, idx) => {
                  const isCorrect = answerSubmitted && option === questions[currentQuestionIndex].correctAnswer;
                  const isSelected = selectedOption === option;
                  const isWrong = answerSubmitted && isSelected && !isCorrect;

                  let optionStyleClass = 'quiz-option-card-neutral';
                  if (isCorrect) {
                    optionStyleClass = 'quiz-option-card-correct font-bold ring-2 ring-emerald-500/50';
                  } else if (isWrong) {
                    optionStyleClass = 'quiz-option-card-wrong ring-2 ring-rose-500/50';
                  } else if (isSelected) {
                    optionStyleClass = 'quiz-option-card-selected animate-royal-pulse font-bold';
                  } else if (answerSubmitted) {
                    optionStyleClass = 'quiz-option-card-dimmed';
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelectOption(option)}
                      disabled={answerSubmitted}
                      style={{ animationDelay: `${idx * 60}ms` }}
                      className={cn(
                        "quiz-option-card animate-option-glide group text-left",
                        optionStyleClass
                      )}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2 text-left">
                        <div className={cn(
                          "flex items-center justify-center w-9 h-9 rounded-xl text-sm font-black shrink-0 transition-all border shadow-xs",
                          isCorrect
                            ? 'border-emerald-700 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm'
                            : isWrong
                              ? 'border-rose-700 bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-sm'
                              : isSelected
                                ? 'border-amber-600 bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 shadow-sm'
                                : 'border-amber-300/80 bg-gradient-to-b from-amber-100 to-amber-200/90 text-amber-950 group-hover:border-amber-400'
                        )}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="flex-1 min-w-0 text-left font-semibold text-[15px] sm:text-[16px] leading-snug tracking-normal">
                          {option}
                        </span>
                      </div>
                      {audiencePoll && !answerSubmitted && (
                        <span className="text-xs font-black text-amber-800 tabular-nums shrink-0 ml-2">
                          {audiencePoll[option] || 0}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!answerSubmitted && (
                <div className="mt-5 border-t border-border pt-4">
                  <AdvisorLifelineBar
                    used={usedLifelines}
                    onUse={handleLifeline}
                    unsupported={['extra_time']}
                  />
                </div>
              )}
              
              {answerSubmitted && (
                <div className="mt-4 p-4 bg-accent/50 rounded-md">
                  <p className="font-semibold">Explanation:</p>
                  <p>{questions[currentQuestionIndex].explanation || "No explanation available for this question."}</p>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                {!answerSubmitted ? (
                  <Button 
                    onClick={handleSubmit}
                    disabled={!selectedOption}
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <CountdownButton
                    onCountdownComplete={handleNextQuestion}
                    initialSeconds={5}
                    disabled={false}
                    className="mt-4"
                  >
                    {isLastQuestion ? "Complete Challenge" : "Next Question"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </CountdownButton>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="quiz-card text-center">
            <p>No questions available for this challenge.</p>
          </div>
        )}
        
        <SimpleAdBanner position="footer" className="mt-8" />
      </main>
      <Footer />

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Challenge?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved, but you won't earn gems for this question. 
              Are you sure you want to exit the challenge?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelExit}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>Exit Challenge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showInterstitial && (
        <div className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <QuizInterstitial onContinue={handleInterstitialContinue} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeInProgress;
