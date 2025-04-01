
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Challenge, ChallengeProgress, Answer, QuizQuestion } from './challengeTypes';
import { confetti } from '@/utils/animations';

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
  const handleQuestionComplete = async (isCorrect: boolean, selectedOption: string) => {
    if (!challenge || !userId || !challengeId || questions.length === 0) {
      console.error("Missing required data for question completion:", {
        hasChallenge: !!challenge,
        hasUserId: !!userId,
        hasChallengeId: !!challengeId,
        questionsCount: questions.length
      });
      toast({
        title: "Error",
        description: "Unable to process your answer. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate current question index
    if (currentQuestionIndex >= questions.length) {
      console.error("Invalid question index:", currentQuestionIndex, "questions length:", questions.length);
      toast({
        title: "Error",
        description: "Invalid question. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      
      // Ensure we have valid question data
      if (!currentQuestion || !currentQuestion.id) {
        console.error("Invalid question data:", currentQuestion);
        toast({
          title: "Error",
          description: "Invalid question data. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
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
      const { error: answerError } = await supabase.from('quiz_answers').insert({
        user_id: userId,
        question_id: currentQuestion.id,
        selected_answer: selectedOption,
        correct: isCorrect,
        points_earned: earnedPoints
      });
      
      if (answerError) {
        console.error("Error saving answer to database:", answerError);
        toast({
          title: "Warning",
          description: "Your answer was processed but not saved to your profile. Your progress might be affected.",
          variant: "warning"
        });
      }
      
      // Check if this was the last question
      const isLastQuestion = currentQuestionIndex === questions.length - 1;
      
      if (isLastQuestion) {
        // Complete the challenge
        const { error: progressError } = await supabase
          .from('user_challenge_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            score: newTotalPoints
          })
          .eq('challenge_id', challengeId)
          .eq('user_id', userId);
          
        if (progressError) {
          console.error("Error updating challenge progress:", progressError);
          toast({
            title: "Warning",
            description: "Your challenge was completed but we couldn't save your final score. Please contact support.",
            variant: "warning"
          });
        }
        
        // Update user's profile points
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', userId)
          .single();
          
        if (userError) {
          console.error("Error fetching user profile:", userError);
          toast({
            title: "Warning",
            description: "We couldn't update your profile points. Please check your profile later.",
            variant: "warning"
          });
        } else if (userData) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              points: (userData.points || 0) + newTotalPoints
            })
            .eq('id', userId);
            
          if (updateError) {
            console.error("Error updating user points:", updateError);
            toast({
              title: "Warning",
              description: "We couldn't update your profile points. Please check your profile later.",
              variant: "warning"
            });
          } else {
            // Update local storage with new points
            const currentStoredPoints = localStorage.getItem(STORAGE_KEYS.USER_POINTS);
            const newTotalUserPoints = (parseInt(currentStoredPoints || '0', 10) + newTotalPoints).toString();
            localStorage.setItem(STORAGE_KEYS.USER_POINTS, newTotalUserPoints);
          }
        }
        
        // Update local state
        setIsComplete(true);
        setScore(newTotalPoints);
        
        // Show completion toast
        toast({
          title: "Challenge Completed!",
          description: `You earned ${newTotalPoints} points!`,
        });
        
        // Only trigger confetti if there are correct answers
        if (updatedAnswers.some(a => a.correct)) {
          confetti();
        }
      } else {
        // Move to next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
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
