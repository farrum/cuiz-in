
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { QuizCard } from '@/components/QuizCard';
import Footer from '@/components/Footer';
import DailyChallenges from '@/components/DailyChallenges';
import { STORAGE_KEYS } from '@/utils/quizData';
import { challengesService } from '@/services/challengesService';
import { QuizQuestion } from '@/types/challenges';

function QuizPage() {
  const [activeChallenges, setActiveChallenges] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    id: '1',
    question: 'What is the capital of France?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    correctAnswer: 'Paris',
    difficulty: 'medium',
    category: 'Geography',
    points: 10,
    explanation: 'Paris is the capital and most populous city of France.'
  });
  
  // Check if there are any active challenges for the user
  useEffect(() => {
    const checkActiveChallenges = async () => {
      try {
        const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        
        if (!userId) return;
        
        const challenges = await challengesService.getActiveChallenges();
        setActiveChallenges(challenges?.length || 0);
      } catch (error) {
        console.error('Error checking active challenges:', error);
      }
    };
    
    checkActiveChallenges();
  }, []);

  const handleQuizComplete = (isCorrect: boolean, points: number) => {
    console.log('Quiz completed:', { isCorrect, points });
    // Here you would typically handle the quiz completion,
    // such as saving the results, updating user points, etc.
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <QuizCard 
              question={currentQuestion}
              onComplete={handleQuizComplete}
            />
          </div>
          
          <div className="space-y-6">
            {/* Show daily challenges component */}
            <DailyChallenges />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default QuizPage;
