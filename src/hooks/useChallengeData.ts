
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion, STORAGE_KEYS } from '@/utils/quizData';
import { NavigateFunction } from 'react-router-dom';
import { confetti } from '@/utils/animations';

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  num_questions: number;
  points_multiplier: number;
  question_ids: string[];
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  completed: boolean;
  score: number;
}

export interface Answer {
  questionId: string;
  correct: boolean;
  selectedAnswer: string;
  explanation: string;
  correctAnswer: string;
}

// Using a simple interface without nested types to avoid recursion
interface QuestionExplanation {
  question: string;
  explanation: string;
  correctAnswer: string;
}

// Plain object type using string keys to map question IDs to explanations
type QuestionMap = Record<string, QuestionExplanation>;

// Interface for storing question answer data
interface AnswerDetails {
  question_id: string;
  correct: boolean;
  selected_answer: string;
}

// Plain object type to map question IDs to answer details
type AnswerMap = Record<string, AnswerDetails>;

const useChallengeData = (
  challengeId: string | undefined,
  userId: string | null,
  navigate: NavigateFunction,
  toast: any
) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(0);
  
  useEffect(() => {
    if (!challengeId || !userId) return;
    
    fetchChallengeData();
  }, [challengeId, userId]);
  
  const fetchChallengeData = async () => {
    if (!challengeId) return;
    
    try {
      setLoading(true);
      
      // Fetch challenge data
      const { data: challengeData, error: challengeError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();
        
      if (challengeError) throw challengeError;
      setChallenge(challengeData);
      
      // Fetch progress data
      const { data: progressData, error: progressError } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (progressError) throw progressError;
      
      if (!progressData) {
        // Create new progress record if it doesn't exist
        const { data: newProgress, error: newProgressError } = await supabase
          .from('user_challenge_progress')
          .insert([{
            challenge_id: challengeId,
            user_id: userId,
            started_at: new Date().toISOString(),
            completed: false,
            score: 0
          }])
          .select()
          .single();
          
        if (newProgressError) throw newProgressError;
        setProgress(newProgress);
      } else {
        setProgress(progressData);
        setIsComplete(progressData.completed);
        setScore(progressData.score);
        
        // If already completed, load all answers for result page
        if (progressData.completed) {
          // Get all answers for this challenge
          const { data: answerData } = await supabase
            .from('quiz_answers')
            .select('question_id, correct, selected_answer')
            .eq('user_id', userId)
            .eq('challenge_id', challengeId)
            .order('created_at', { ascending: true });
          
          // Get question data to include explanations and correct answers
          const { data: questionData } = await supabase
            .from('quiz_questions')
            .select('*')
            .in('id', challengeData.question_ids);
            
          // Map questions for easy lookup
          const questionMap: QuestionMap = {};
          if (questionData) {
            questionData.forEach(q => {
              questionMap[q.id] = {
                question: q.question,
                explanation: q.explanation || '',
                correctAnswer: q.correct_answer
              };
            });
          }
          
          // Create answers array using the correct order from challenge.question_ids
          const completedAnswers: Answer[] = [];
          
          if (answerData && answerData.length > 0) {
            // Create a map of question_id to answer for quick lookup
            const answerMap: AnswerMap = {};
            answerData.forEach(a => {
              answerMap[a.question_id] = {
                question_id: a.question_id,
                correct: a.correct,
                selected_answer: a.selected_answer
              };
            });
            
            // Build answers array in the correct order
            challengeData.question_ids.forEach(qId => {
              const answer = answerMap[qId];
              if (answer) {
                completedAnswers.push({
                  questionId: qId,
                  correct: answer.correct,
                  selectedAnswer: answer.selected_answer,
                  explanation: questionMap[qId]?.explanation || '',
                  correctAnswer: questionMap[qId]?.correctAnswer || ''
                });
              }
            });
          }
          
          setAnswers(completedAnswers);
        }
      }
      
      // Fetch questions data in the correct order
      if (challengeData.question_ids && challengeData.question_ids.length > 0) {
        const { data: questionData, error: questionError } = await supabase
          .from('quiz_questions')
          .select('*')
          .in('id', challengeData.question_ids);
          
        if (questionError) throw questionError;
        
        // Convert DB question format to QuizQuestion format with proper type conversion
        const formattedQuestions: Record<string, QuizQuestion> = {};
        
        questionData.forEach(q => {
          formattedQuestions[q.id] = {
            id: q.id,
            question: q.question,
            options: Array.isArray(q.options) 
              ? q.options.map(opt => String(opt)) 
              : typeof q.options === 'object' && q.options !== null
                ? Object.values(q.options).map(opt => String(opt))
                : [],
            correctAnswer: q.correct_answer,
            explanation: q.explanation || '',
            category: q.category,
            difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
            points: q.points || 10
          };
        });
        
        // Ensure questions are in the same order as question_ids
        const orderedQuestions = challengeData.question_ids
          .map(id => formattedQuestions[id])
          .filter(Boolean) as QuizQuestion[];
        
        setQuestions(orderedQuestions);
      }
    } catch (error) {
      console.error('Error fetching challenge data:', error);
      toast({
        title: "Error loading challenge",
        description: "Please try again or return to the quiz page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuestionComplete = async (isCorrect: boolean, selectedAnswer: string) => {
    if (!challenge || !questions[currentQuestionIndex]) return;
    
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
        challenge_id: challengeId // Add reference to challenge
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
      const userProfileData = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
        
      if (userProfileData.error) throw userProfileData.error;
      
      const currentUserPoints = userProfileData.data.points || 0;
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
      
      // Update progress state
      setProgress({
        ...progress,
        completed: true,
        completed_at: new Date().toISOString(),
        score: finalScore
      });
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        title: "Error saving results",
        description: "Your progress might not be fully saved",
        variant: "destructive"
      });
    }
  };
  
  return {
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
  };
};

export default useChallengeData;
