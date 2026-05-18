import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import useChallengeData from '@/hooks/challenge/useChallengeData';
import { supabase } from '@/integrations/supabase/client';
import ChallengeInProgress from '@/components/challenge/ChallengeInProgress';
import ChallengeComplete from '@/components/challenge/ChallengeComplete';
import ChallengeNotFound from '@/components/challenge/ChallengeNotFound';

const ChallengePlayPage = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  const [error, setError] = useState<{hasError: boolean, message: string}>({
    hasError: false,
    message: ""
  });
  
  const { 
    challenge,
    progress,
    questions,
    answers,
    loading,
    isComplete,
    score,
    currentQuestionIndex,
    currentPoints,
    handleQuestionComplete,
    handleNextQuestion,
  } = useChallengeData(challengeId, userId, navigate, toast);
  
  useEffect(() => {
    if (!userId) {
      navigate('/login', { state: { redirectTo: `/challenge/${challengeId}` } });
      return;
    }

    if (!challengeId) {
      setError({
        hasError: true,
        message: "Challenge ID is missing. Please try again."
      });
    }
  }, [userId, navigate, challengeId]);

  useEffect(() => {
    if (challenge && !loading) {
      const endDate = new Date(challenge.end_date);
      const isExpired = endDate < new Date();
      
      if (isExpired && !isComplete) {
        toast({
          title: "Challenge Expired",
          description: "This challenge has ended and can no longer be played.",
          variant: "warning"
        });
        navigate('/quiz');
      }
    }
  }, [challenge, loading, isComplete, toast, navigate]);
  
  const handleQuestionCompleteWithErrorHandling = async (selectedOption: string) => {
    try {
      if (!selectedOption) {
        toast({
          title: "Error",
          description: "Please select an answer to continue.",
          variant: "destructive"
        });
        return;
      }
      
      const currentQuestion = questions[currentQuestionIndex];
      // Server-side validation (correct_answer is no longer exposed to the client).
      let isCorrect = false;
      try {
        const { data, error } = await supabase.functions.invoke('validate-quiz-answer', {
          body: { question_id: currentQuestion.id, selected_answer: selectedOption }
        });
        if (!error && data) {
          isCorrect = !!data.is_correct;
          currentQuestion.correctAnswer = data.correct_answer || currentQuestion.correctAnswer;
          currentQuestion.explanation = data.explanation || currentQuestion.explanation;
        }
      } catch (err) {
        console.error('[ChallengePlayPage] validate error', err);
      }
      
      handleQuestionComplete(isCorrect, selectedOption);
    } catch (error) {
      console.error("Error handling question completion:", error);
      toast({
        title: "Error",
        description: "Something went wrong while saving your answer. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (error.hasError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/quiz')}
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quiz
            </Button>
          </div>
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/quiz')}
              size="sm"
              disabled
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quiz
            </Button>
          </div>
          <Skeleton className="h-10 w-72 mb-4" />
          <Skeleton className="h-6 w-full max-w-md mb-8" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!challenge) {
    return <ChallengeNotFound onExit={() => navigate('/quiz')} />;
  }
  
  if (isComplete) {
    return (
      <ChallengeComplete 
        challenge={challenge}
        answers={answers}
        questions={questions}
        score={score}
        onExit={() => navigate('/quiz')}
      />
    );
  }
  
  const endDate = new Date(challenge.end_date);
  const isExpired = endDate < new Date();
  
  if (isExpired && !isComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/quiz')}
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quiz
            </Button>
          </div>
          <Alert variant="warning" className="mb-6">
            <AlertTitle>Challenge Expired</AlertTitle>
            <AlertDescription>
              This challenge has ended on {endDate.toLocaleDateString()} and can no longer be played.
              Please check the active challenges for new opportunities.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/quiz')}
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quiz
            </Button>
          </div>
          <Alert variant="warning" className="mb-6">
            <AlertTitle>No Questions Available</AlertTitle>
            <AlertDescription>
              This challenge doesn't have any questions. Please try another challenge.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <ChallengeInProgress
      challenge={challenge}
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      currentPoints={currentPoints}
      onExit={() => navigate('/quiz')}
      onComplete={(selectedOption) => handleQuestionCompleteWithErrorHandling(selectedOption)}
      onNextQuestion={handleNextQuestion}
    />
  );
};

export default ChallengePlayPage;
