
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion, STORAGE_KEYS } from '@/utils/quizData';
import { NavigateFunction } from 'react-router-dom';
import { confetti } from '@/utils/animations';
import { Challenge, ChallengeProgress, Answer, QuestionExplanation, SimpleMap } from './challengeTypes';
import { useAnswerManagement } from './useAnswerManagement';

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
  const [currentGems, setCurrentGems] = useState(0);
  
  // Use the answer management hook
  const { handleQuestionComplete: handleAnswer } = useAnswerManagement(
    challenge,
    questions,
    currentQuestionIndex,
    userId,
    challengeId,
    answers,
    currentGems,
    setCurrentGems,
    setAnswers,
    setCurrentQuestionIndex,
    setIsComplete,
    setScore,
    progress,
    toast
  );
  
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
          const { data: answerData, error: answerError } = await supabase
            .from('quiz_answers')
            .select('question_id, correct, selected_answer')
            .eq('user_id', userId)
            .in('question_id', challengeData.question_ids)
            .order('created_at', { ascending: true });
          
          if (answerError) throw answerError;
          
          if (!answerData || answerData.length === 0) {
            setAnswers([]);
            return;
          }
          
          // Get question data (without correct_answer — column is restricted).
          const { data: questionData, error: questionError } = await supabase
            .from('quiz_questions')
            .select('id, question, explanation')
            .in('id', challengeData.question_ids);
            
          if (questionError) throw questionError;

          // Fetch correct answers for questions the user has already attempted.
          const { data: answerReveal } = await supabase
            .rpc('get_attempted_correct_answers', { p_question_ids: challengeData.question_ids });
          const correctAnswerMap: Record<string, string> = {};
          for (const r of (answerReveal || []) as Array<{ question_id: string; correct_answer: string }>) {
            correctAnswerMap[r.question_id] = r.correct_answer;
          }
          
          // Create simple lookup objects
          const questionMap: {[key: string]: QuestionExplanation} = {};
          
          for (const q of questionData || []) {
            questionMap[q.id] = {
              question: q.question,
              explanation: q.explanation || '',
              correctAnswer: correctAnswerMap[q.id] || ''
            };
          }
          
          // Create a simple answer map
          const answerMap: {[key: string]: {
            question_id: string;
            correct: boolean;
            selected_answer: string;
          }} = {};
          
          for (const a of answerData || []) {
            answerMap[a.question_id] = {
              question_id: a.question_id,
              correct: a.correct,
              selected_answer: a.selected_answer
            };
          }
          
          // Build answers array in the correct order
          const completedAnswers: Answer[] = [];
          
          for (const qId of challengeData.question_ids) {
            const answer = answerMap[qId];
            const question = questionMap[qId];
            
            if (answer && question) {
              completedAnswers.push({
                questionId: qId,
                correct: answer.correct,
                selectedAnswer: answer.selected_answer,
                explanation: question.explanation,
                correctAnswer: question.correctAnswer
              });
            }
          }
          
          setAnswers(completedAnswers);
        }
      }
      
      // Fetch quiz questions
      const { data: questionData, error: questionError } = await supabase
        .from('quiz_questions')
        .select('*')
        .in('id', challengeData.question_ids);
        
      if (questionError) throw questionError;
      
      if (!questionData || questionData.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }
      
      // Format questions with consistent structure
      const orderedQuestions: QuizQuestion[] = [];
      for (const qId of challengeData.question_ids) {
        const question = questionData.find(q => q.id === qId);
        if (question) {
          // Format options to ensure consistent structure
          let options: string[] = [];
          if (Array.isArray(question.options)) {
            options = question.options.map(opt => String(opt));
          } else if (typeof question.options === 'object' && question.options !== null) {
            options = Object.values(question.options).map(opt => String(opt));
          }
          
          // Ensure difficulty is of the expected type
          let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
          if (question.difficulty === 'easy' || question.difficulty === 'medium' || question.difficulty === 'hard') {
            difficulty = question.difficulty;
          }
          
          orderedQuestions.push({
            id: question.id,
            question: question.question,
            options: options,
            correctAnswer: question.correct_answer,
            explanation: question.explanation || '',
            category: question.category,
            difficulty: difficulty,
            gems: question.gems || 10
          });
        }
      }
      
      setQuestions(orderedQuestions);
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
  
  // This is now a facade that delegates to the extracted handleAnswer function
  const handleQuestionComplete = async (isCorrect: boolean, selectedAnswer: string) => {
    await handleAnswer(isCorrect, selectedAnswer);
    
    // If this was the last question, we prepare for completion
    // but don't navigate yet - we'll do that when the user clicks a button
    if (currentQuestionIndex >= (challenge?.num_questions || 0) - 1) {
      await completeChallenge(currentGems);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const completeChallenge = async (finalScore: number) => {
    if (!challenge || !progress || !userId) return;
    
    try {
      const { data: userProfileData, error: profileError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      const currentUserGems = userProfileData.gems || 0;
      const newTotalGems = currentUserGems + finalScore;
      
      await supabase
        .from('profiles')
        .update({ gems: newTotalGems })
        .eq('id', userId);
        
      localStorage.setItem(STORAGE_KEYS.USER_GEMS, newTotalGems.toString());
      
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
      
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      const monthString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const { data: dailyGemsData, error: dailyGemsError } = await supabase
        .from('daily_points')
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateString)
        .maybeSingle();
        
      if (dailyGemsError) throw dailyGemsError;
      
      if (dailyGemsData) {
        await supabase
          .from('daily_points')
          .update({ gems: dailyGemsData.gems + finalScore })
          .eq('id', dailyGemsData.id);
      } else {
        await supabase
          .from('daily_points')
          .insert([{ 
            user_id: userId, 
            date: dateString, 
            gems: finalScore 
          }]);
      }
      
      const { data: monthlyGemsData, error: monthlyGemsError } = await supabase
        .from('monthly_points')
        .select('*')
        .eq('user_id', userId)
        .eq('month', monthString)
        .maybeSingle();
        
      if (monthlyGemsError) throw monthlyGemsError;
      
      if (monthlyGemsData) {
        await supabase
          .from('monthly_points')
          .update({ gems: monthlyGemsData.gems + finalScore })
          .eq('id', monthlyGemsData.id);
      } else {
        await supabase
          .from('monthly_points')
          .insert([{ 
            user_id: userId, 
            month: monthString, 
            gems: finalScore 
          }]);
      }
      
      toast({
        title: "Challenge Completed!",
        description: `You earned ${finalScore} gems!`,
      });
      
      if (answers.some(a => a.correct)) {
        confetti();
      }
      
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
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      setIsComplete(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
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
    currentGems,
    handleQuestionComplete,
    handleNextQuestion,
  };
};

export default useChallengeData;
