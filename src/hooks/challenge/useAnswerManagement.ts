
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Challenge, ChallengeProgress, Answer, QuizQuestion } from './challengeTypes';

export const useAnswerManagement = (
  challenge: Challenge | null,
  questions: QuizQuestion[],
  currentQuestionIndex: number,
  userId: string | null,
  challengeId: string | undefined,
  answers: Answer[],
  currentPoints: number,
  setCurrentPoints: (points: number) => void,
  setAnswers: (answers: Answer[]) => void,
  setCurrentQuestionIndex: (index: number) => void,
  setIsComplete: (isComplete: boolean) => void,
  setScore: (score: number) => void,
  progress: ChallengeProgress | null,
  toast: any
) => {
  const handleQuestionComplete = async (selectedOption: string) => {
    if (!challenge || !userId || !challengeId || questions.length === 0) return;
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const isCorrect = selectedOption === currentQuestion.correctAnswer;
      
      // Calculate points for this answer
      const pointsForQuestion = currentQuestion.points || 10;
      const pointsMultiplier = challenge.points_multiplier || 1;
      const earnedPoints = isCorrect ? pointsForQuestion * pointsMultiplier : 0;
      
      // Update running total
      const newTotalPoints = currentPoints + earnedPoints;
      setCurrentPoints(newTotalPoints);
      
      // Record the answer
      const newAnswer: Answer = {
        questionId: currentQuestion.id,
        correct: isCorrect,
        selectedAnswer: selectedOption,
        explanation: currentQuestion.explanation,
        correctAnswer: currentQuestion.correctAnswer
      };
      
      // Update answers in state
      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);
      
      // Store answer in database
      await supabase.from('quiz_answers').insert({
        user_id: userId,
        question_id: currentQuestion.id,
        selected_answer: selectedOption,
        correct: isCorrect,
        points_earned: earnedPoints
      });
      
      // Check if this was the last question
      const isLastQuestion = currentQuestionIndex === questions.length - 1;
      
      if (isLastQuestion) {
        // Complete the challenge
        await supabase
          .from('user_challenge_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            score: newTotalPoints
          })
          .eq('challenge_id', challengeId)
          .eq('user_id', userId);
        
        // Update user's profile points
        const { data: userData } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', userId)
          .single();
          
        if (userData) {
          await supabase
            .from('profiles')
            .update({
              points: (userData.points || 0) + newTotalPoints
            })
            .eq('id', userId);
        }
        
        // Update local state
        setIsComplete(true);
        setScore(newTotalPoints);
      } else {
        // Move to next question
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      }
    } catch (error) {
      console.error('Error handling question completion:', error);
      toast({
        title: "Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return { handleQuestionComplete };
};
