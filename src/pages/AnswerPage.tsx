
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { STORAGE_KEYS, QuizQuestion, fetchQuizQuestions } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Star, Award, PartyPopper, Frown } from 'lucide-react';
import { getRandomMessage } from '@/utils/funMessages';
import { useToast } from '@/hooks/use-toast';
import MotivationalCharacter from '@/components/MotivationalCharacter';

const AnswerPage: React.FC = () => {
  const { questionId, selectedOption } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [funMessage, setFunMessage] = useState('');
  const [funEmoji, setFunEmoji] = useState('');
  const [backgroundClass, setBackgroundClass] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Predefined background classes
  const correctBackgrounds = [
    'bg-correct-1',
    'bg-correct-2',
    'bg-correct-3',
    'bg-correct-4'
  ];
  
  const incorrectBackgrounds = [
    'bg-incorrect-1',
    'bg-incorrect-2',
    'bg-incorrect-3',
    'bg-incorrect-4'
  ];

  useEffect(() => {
    const loadQuestion = async () => {
      // Get all questions
      const questions = await fetchQuizQuestions();
      
      // Find the specific question
      const foundQuestion = questions.find(q => q.id === questionId);
      
      if (foundQuestion) {
        setQuestion(foundQuestion);
        const correct = foundQuestion.correctAnswer === selectedOption;
        setIsCorrect(correct);
        
        // Set fun message based on correctness
        const messageType = correct ? 'success' : 'failure';
        const randomMessage = getRandomMessage(messageType);
        setFunMessage(randomMessage.text);
        setFunEmoji(randomMessage.emoji || '');
        
        // Set random background based on correctness
        if (correct) {
          const randomBg = correctBackgrounds[Math.floor(Math.random() * correctBackgrounds.length)];
          setBackgroundClass(randomBg);
        } else {
          const randomBg = incorrectBackgrounds[Math.floor(Math.random() * incorrectBackgrounds.length)];
          setBackgroundClass(randomBg);
        }
        
        // Show toast with fun message
        setTimeout(() => {
          toast({
            title: correct ? "Great job! 🎉" : "Keep trying! 💪",
            description: randomMessage.text,
            variant: correct ? "default" : "destructive",
          });
        }, 500);
      }
      
      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    };
    
    loadQuestion();
  }, [questionId, selectedOption, toast]);

  const handleNextQuestion = () => {
    // Navigate to quiz route
    navigate('/quiz');
  };
  
  // Calculate the points earned based on the difficulty and correctness
  const getPointsEarned = (isCorrect: boolean, difficulty?: string): number => {
    if (isCorrect) {
      switch (difficulty) {
        case 'easy': return 2;
        case 'medium': return 3;
        case 'hard': return 4;
        default: return 2;
      }
    }
    return 0.5; // Wrong answer always gives 0.5 points
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
          <div 
            className={`quiz-card p-6 rounded-xl fun-card ${backgroundClass} ${isCorrect ? 'bounce-in' : 'shake'}`}
            style={{ 
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Add pattern overlay for texture */}
            <div className="absolute inset-0 pattern-dots opacity-30 mix-blend-overlay"></div>
            
            {/* Motivational character */}
            <div className="absolute top-4 right-4">
              <MotivationalCharacter 
                mood={isCorrect ? 'happy' : 'sad'} 
                message={funMessage}
                showMessage={true}
              />
            </div>
            
            <h3 className="text-2xl font-medium mb-6 relative z-10">{question.question}</h3>
            
            {/* Second Advertisement */}
            <AdvertisementBanner position="middle" size="small" />
            
            <div className="mb-8 mt-8 relative z-10">
              <div className={`p-6 rounded-lg backdrop-blur-sm ${
                isCorrect 
                  ? 'bg-green-500/20 border border-green-500 celebration' 
                  : 'bg-red-500/20 border border-red-500'
              }`}>
                <div className="flex flex-col items-center text-center">
                  {isCorrect ? (
                    <>
                      <PartyPopper className="w-12 h-12 text-green-500 mb-4" />
                      <div className="confetti-bg w-full h-full absolute top-0 left-0 opacity-30 z-0" />
                    </>
                  ) : (
                    <Frown className="w-12 h-12 text-red-500 mb-4" />
                  )}
                  <h4 className={`text-2xl font-bold mb-2 ${isCorrect ? 'glow-text' : ''}`}>
                    {isCorrect ? 'Awesome! Correct Answer! 🎉' : 'Not Quite Right 🤔'}
                  </h4>
                  <p className="text-lg mb-4">
                    {funMessage}
                  </p>
                  <p className="text-lg font-medium">
                    {isCorrect 
                      ? `You earned ${getPointsEarned(true, question.difficulty)} points! ${funEmoji}` 
                      : `You earned 0.5 points. The correct answer was: ${question.correctAnswer} ${funEmoji}`}
                  </p>
                  {isCorrect && (
                    <div className="flex mt-4">
                      {[...Array(getPointsEarned(true, question.difficulty))].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-yellow-400 mx-1" fill="#FACC15" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Third Advertisement */}
            <AdvertisementBanner position="middle" size="small" />
            
            {question.explanation && (
              <div className="mb-8 mt-4 p-4 bg-primary/5 backdrop-blur-md rounded-lg relative z-10">
                <h4 className="font-medium mb-2">Explanation:</h4>
                <p>{question.explanation}</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end relative z-10">
              <Button onClick={handleNextQuestion} className="fun-button">
                Next Question <Award className="ml-2 h-5 w-5" />
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
