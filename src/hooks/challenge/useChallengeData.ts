import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion, STORAGE_KEYS } from '@/utils/quizData';
import { NavigateFunction } from 'react-router-dom';
import { confetti } from '@/utils/animations';
import { Challenge, ChallengeProgress, Answer, QuestionExplanation, SimpleMap } from './challengeTypes';

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
      
      const { data: challengeData, error: challengeError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();
        
      if (challengeError) throw challengeError;
      setChallenge(challengeData);
      
      const { data: progressData, error: progressError } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (progressError) throw progressError;
      
      if (!progressData) {
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
        
        if (progressData.completed) {
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
          
          const { data: questionData, error: questionError } = await supabase
            .from('quiz_questions')
            .select('*')
            .in('id', challengeData.question_ids);
            
          if (questionError) throw questionError;
          
          const questionMap: {[key: string]: QuestionExplanation} = {};
          
          for (const q of questionData || []) {
            questionMap[q.id] = {
              question: q.question,
              explanation: q.explanation || '',
              correctAnswer: q.correct_answer
            };
          }
          
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
      
      const orderedQuestions: QuizQuestion[] = [];
      for (const qId of challengeData.question_ids) {
        const question = questionData.find(q => q.id === qId);
        if (question) {
          let options: string[] = [];
          if (Array.isArray(question.options)) {
            options = question.options.map(opt => String(opt));
          } else if (typeof question.options === 'object' && question.options !== null) {
            options = Object.values(question.options).map(opt => String(opt));
          }
          
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
            points: question.points || 10
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
  
  const handleQuestionComplete = async (isCorrect: boolean, selectedAnswer: string) => {
    if (!challenge || !questions[currentQuestionIndex] || !userId) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    let earnedPoints = 0;
    if (isCorrect) {
      switch (currentQuestion.difficulty) {
        case "easy": earnedPoints = 2; break;
        case "medium": earnedPoints = 3; break;
        case "hard": earnedPoints = 4; break;
        default: earnedPoints = 2;
      }
      earnedPoints = earnedPoints * (challenge.points_multiplier || 1);
    } else {
      earnedPoints = 0.5 * (challenge.points_multiplier || 1);
    }
    
    const newTotalPoints = currentPoints + earnedPoints;
    setCurrentPoints(newTotalPoints);
    
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      correct: isCorrect,
      selectedAnswer: selectedAnswer,
      explanation: currentQuestion.explanation || '',
      correctAnswer: currentQuestion.correctAnswer
    };
    
    setAnswers([...answers, newAnswer]);
    
    try {
      await supabase.from('quiz_answers').insert([{
        question_id: currentQuestion.id,
        user_id: userId,
        selected_answer: selectedAnswer,
        correct: isCorrect,
        points_earned: earnedPoints,
        challenge_id: challengeId
      }]);
      
      if (currentQuestionIndex >= challenge.num_questions - 1) {
        await completeChallenge(newTotalPoints);
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
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
        
      localStorage.setItem(STORAGE_KEYS.USER_POINTS, newTotalPoints.toString());
      
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
      
      const { data: dailyPointsData, error: dailyPointsError } = await supabase
        .from('daily_points')
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateString)
        .maybeSingle();
        
      if (dailyPointsError) throw dailyPointsError;
      
      if (dailyPointsData) {
        await supabase
          .from('daily_points')
          .update({ points: dailyPointsData.points + finalScore })
          .eq('id', dailyPointsData.id);
      } else {
        await supabase
          .from('daily_points')
          .insert([{ 
            user_id: userId, 
            date: dateString, 
            points: finalScore 
          }]);
      }
      
      const { data: monthlyPointsData, error: monthlyPointsError } = await supabase
        .from('monthly_points')
        .select('*')
        .eq('user_id', userId)
        .eq('month', monthString)
        .maybeSingle();
        
      if (monthlyPointsError) throw monthlyPointsError;
      
      if (monthlyPointsData) {
        await supabase
          .from('monthly_points')
          .update({ points: monthlyPointsData.points + finalScore })
          .eq('id', monthlyPointsData.id);
      } else {
        await supabase
          .from('monthly_points')
          .insert([{ 
            user_id: userId, 
            month: monthString, 
            points: finalScore 
          }]);
      }
      
      toast({
        title: "Challenge Completed!",
        description: `You earned ${finalScore} points!`,
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
    currentPoints,
    handleQuestionComplete,
    handleNextQuestion,
  };
};

export default useChallengeData;
