
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { Award } from 'lucide-react';
import { useQuizAnswer } from '@/hooks/useQuizAnswer';
import CountdownButton from '@/components/CountdownButton';
import ResultCard from '@/components/ResultCard';
import LoadingCard from '@/components/LoadingCard';
import QuestionNotFound from '@/components/QuestionNotFound';

const AnswerPage: React.FC = () => {
  const { questionId, selectedOption } = useParams();
  const {
    isLoading,
    question,
    isCorrect,
    funMessage,
    funEmoji,
    backgroundClass,
    handleNextQuestion
  } = useQuizAnswer(questionId, selectedOption);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        {/* First Advertisement */}
        <AdvertisementBanner position="top" />
        
        {isLoading ? (
          <LoadingCard />
        ) : question ? (
          <>
            <ResultCard 
              question={question}
              isCorrect={isCorrect}
              funMessage={funMessage}
              funEmoji={funEmoji}
              backgroundClass={backgroundClass}
            />
            
            {/* Third Advertisement */}
            <AdvertisementBanner position="middle" size="small" />
            
            <div className="mt-6 flex justify-end relative z-10">
              <CountdownButton 
                onCountdownComplete={handleNextQuestion}
                initialSeconds={5}
                className="fun-button"
                icon={<Award className="h-5 w-5" />}
              >
                Next Question
              </CountdownButton>
            </div>
          </>
        ) : (
          <QuestionNotFound />
        )}
        
        {/* Fourth Advertisement */}
        <AdvertisementBanner position="bottom" />
      </main>
    </div>
  );
};

export default AnswerPage;
