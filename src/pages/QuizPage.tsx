
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { QuizCard } from '@/components/QuizCard';
import Footer from '@/components/Footer';
import DailyChallenges from '@/components/DailyChallenges';
import { STORAGE_KEYS } from '@/utils/quizData';
import { challengesService } from '@/services/challengesService';
import { QuizQuestion } from '@/types/challenges';

// Sample question for when no active challenges are available
const sampleQuestion: QuizQuestion = {
  id: "sample-1",
  question: "What is the capital of France?",
  options: ["Paris", "London", "Berlin", "Madrid"],
  correctAnswer: "Paris",
  difficulty: "medium",
  category: "Geography",
  points: 10,
  explanation: "Paris is the capital and most populous city of France."
};

function QuizPage() {
  const [activeChallenges, setActiveChallenges] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);
  
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

  // Handle completion of a question
  const handleQuestionComplete = (isCorrect: boolean, points: number) => {
    if (isCorrect) {
      setCurrentScore(prev => prev + points);
    }
    // Here you would typically fetch the next question or update progress
    console.log(`Question answered ${isCorrect ? 'correctly' : 'incorrectly'}, points: ${points}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-6">
          <QuizCard 
            question={sampleQuestion} 
            onComplete={handleQuestionComplete} 
          />
          
          {/* Daily Challenges section */}
          <DailyChallenges />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default QuizPage;
