
import { supabase } from '@/integrations/supabase/client';
import { Challenge, ChallengeProgress, Answer } from './challengeTypes';
import { QuizQuestion, STORAGE_KEYS } from '@/utils/quizData';
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
  const handleQuestionComplete = async (isCorrect: boolean, selectedAnswer: string) => {
    if (!challenge || !questions[currentQuestionIndex] || !userId) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    // Calculate earned points
    let earnedPoints = 0;
    if (isCorrect) {
      // Calculate points based on difficulty
      switch (currentQuestion.difficulty) {
        case "easy": earnedPoints = 2; break;
        case "medium": earnedPoints = 3; break;
        case "hard": earnedPoints = 4; break;
        default: earnedPoints = 2;
      }
      // Apply multiplier
      earnedPoints = earnedPoints * (challenge.points_multiplier || 1);
    } else {
      // Wrong answer gives 0.5 points with multiplier
      earnedPoints = 0.5 * (challenge.points_multiplier || 1);
    }
    
    const newTotalPoints = currentPoints + earnedPoints;
    setCurrentPoints(newTotalPoints);
    
    // Add to answers array
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      correct: isCorrect,
      selectedAnswer: selectedAnswer,
      explanation: currentQuestion.explanation || '',
      correctAnswer: currentQuestion.correctAnswer
    };
    
    setAnswers([...answers, newAnswer]);
    
    try {
      // Record the answer
      await supabase.from('quiz_answers').insert([{
        question_id: currentQuestion.id,
        user_id: userId,
        selected_answer: selectedAnswer,
        correct: isCorrect,
        points_earned: earnedPoints,
        challenge_id: challengeId
      }]);
      
      // Check if this was the last question
      if (currentQuestionIndex >= challenge.num_questions - 1) {
        // Challenge complete!
        await completeChallenge(newTotalPoints);
      } else {
        // Move to next question
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      }
    } catch (error) {
      console.error('Error recording answer:', error);
      toast({
        title: "Error saving answer",
        description: "Your progress might not be fully saved",
        variant: "destructive"
      });
    }
  };
  
  const completeChallenge = async (finalScore: number) => {
    if (!challenge || !progress || !userId) return;
    
    try {
      // Update user profile points
      const { data: userProfileData, error: profileError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      const currentUserPoints = userProfileData.points || 0;
      const newTotalPoints = currentUserPoints + finalScore;
      
      await supabase
        .from('profiles')
        .update({ points: newTotalPoints })
        .eq('id', userId);
        
      // Store updated points in localStorage
      localStorage.setItem(STORAGE_KEYS.USER_POINTS, newTotalPoints.toString());
      
      // Update challenge progress
      await supabase
        .from('user_challenge_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          score: finalScore
        })
        .eq('id', progress.id);
        
      setIsComplete(true);
      setScore(finalScore);
      
      // Show completion toast and trigger confetti
      toast({
        title: "Challenge Completed!",
        description: `You earned ${finalScore} points!`,
      });
      
      // Only trigger confetti if there are correct answers
      if (answers.some(a => a.correct)) {
        confetti();
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        title: "Error saving results",
        description: "Your progress might not be fully saved",
        variant: "destructive"
      });
    }
  };
  
  return { handleQuestionComplete };
};
