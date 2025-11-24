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
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      
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
      const { error: answerError } = await supabase
        .from('quiz_answers')
        .insert({
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
        // Prepare for completion but don't navigate yet - we'll do that after the delay
        // The challenge will be marked as complete when the user clicks "Complete Challenge"
        setScore(newTotalPoints);
      }
      
      // Show correct/incorrect toast
      toast({
        title: isCorrect ? "Correct!" : "Incorrect",
        description: isCorrect 
          ? `You earned ${earnedPoints} points!` 
          : `The correct answer was: ${currentQuestion.correctAnswer}`,
        variant: isCorrect ? "default" : "warning",
      });
      
      // Only show confetti for correct answers
      if (isCorrect) {
        setTimeout(() => confetti(), 300);
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
