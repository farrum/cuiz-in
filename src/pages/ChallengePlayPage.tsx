
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import useChallengeData from '@/hooks/challenge/useChallengeData';
import ChallengeInProgress from '@/components/challenge/ChallengeInProgress';
import ChallengeComplete from '@/components/challenge/ChallengeComplete';
import ChallengeNotFound from '@/components/challenge/ChallengeNotFound';

const ChallengePlayPage = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  
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
  } = useChallengeData(challengeId, userId, navigate, toast);
  
  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
  }, [userId, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
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
  
  // Challenge completion summary
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
  
  // Challenge in progress - show the current question
  return (
    <ChallengeInProgress
      challenge={challenge}
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      currentPoints={currentPoints}
      onExit={() => navigate('/quiz')}
      onComplete={(selectedOption) => {
        const currentQuestion = questions[currentQuestionIndex];
        handleQuestionComplete(selectedOption === currentQuestion.correctAnswer, selectedOption);
      }}
    />
  );
};

export default ChallengePlayPage;
