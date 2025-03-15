
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { STORAGE_KEYS, QuizQuestion, calculatePoints, fetchQuizQuestions } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

const AnswerPage: React.FC = () => {
  const { questionId, selectedOption } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadQuestion = async () => {
      // Get all questions
      const questions = await fetchQuizQuestions();
      
      // Find the specific question
      const foundQuestion = questions.find(q => q.id === questionId);
      
      if (foundQuestion) {
        setQuestion(foundQuestion);
        setIsCorrect(foundQuestion.correctAnswer === selectedOption);
      }
      
      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    };
    
    loadQuestion();
  }, [questionId, selectedOption]);

  const handleNextQuestion = () => {
    navigate('/quiz');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        {/* First Advertisement */}
        <AdvertisementBanner position="top" />
        
        {isLoading ? (
          <div className="quiz-card animate-pulse flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading result...</p>
            </div>
          </div>
        ) : question ? (
          <div className="quiz-card p-6 rounded-xl glass">
            <h3 className="text-2xl font-medium mb-8">{question.question}</h3>
            
            {/* Second Advertisement */}
            <AdvertisementBanner position="middle" size="small" />
            
            <div className="mb-8 mt-8">
              <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
                <div className="flex items-center">
                  {isCorrect ? (
                    <CheckCircle className="w-8 h-8 text-green-500 mr-4" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500 mr-4" />
                  )}
                  <div>
                    <h4 className="text-xl font-medium">
                      {isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}
                    </h4>
                    <p className="text-muted-foreground">
                      {isCorrect 
                        ? `You earned 2 points!` 
                        : `You earned 0.5 points. The correct answer was: ${question.correctAnswer}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Third Advertisement */}
            <AdvertisementBanner position="middle" size="small" />
            
            {question.explanation && (
              <div className="mb-8 mt-4 p-4 bg-primary/5 rounded-lg">
                <h4 className="font-medium mb-2">Explanation:</h4>
                <p>{question.explanation}</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button onClick={handleNextQuestion} className="btn-shine">
                Next Question
              </Button>
            </div>
          </div>
        ) : (
          <div className="quiz-card text-center">
            <p>Question not found. Please try again.</p>
            <Button onClick={() => navigate('/quiz')} className="mt-4">
              Back to Quiz
            </Button>
          </div>
        )}
        
        {/* Fourth Advertisement */}
        <AdvertisementBanner position="bottom" />
      </main>
    </div>
  );
};

export default AnswerPage;
