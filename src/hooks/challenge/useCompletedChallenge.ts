
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Answer, SimpleMap, QuestionExplanation } from './challengeTypes';

export const useCompletedChallenge = (
  challengeId: string | undefined, 
  userId: string | null,
  isComplete: boolean
) => {
  const [completedAnswers, setCompletedAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isComplete && challengeId && userId) {
      fetchCompletedChallengeData();
    }
  }, [isComplete, challengeId, userId]);
  
  const fetchCompletedChallengeData = async () => {
    if (!challengeId || !userId) return;
    
    try {
      setLoading(true);
      
      // Fetch challenge data to get question IDs
      const { data: challengeData, error: challengeError } = await supabase
        .from('daily_challenges')
        .select('question_ids')
        .eq('id', challengeId)
        .single();
        
      if (challengeError) throw challengeError;
      
      // Get all answers for this challenge
      const { data: answerData, error: answerError } = await supabase
        .from('quiz_answers')
        .select('question_id, correct, selected_answer')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: true });
      
      if (answerError) throw answerError;
      
      if (!answerData || answerData.length === 0) {
        setCompletedAnswers([]);
        setLoading(false);
        return;
      }
      
      // Get question data to include explanations and correct answers
      const { data: questionData, error: questionError } = await supabase
        .from('quiz_questions')
        .select('*')
        .in('id', challengeData.question_ids);
        
      if (questionError) throw questionError;
      
      // Create simple lookup objects
      const questionMap: SimpleMap<QuestionExplanation> = {};
      
      for (const q of questionData || []) {
        questionMap[q.id] = {
          question: q.question,
          explanation: q.explanation || '',
          correctAnswer: q.correct_answer
        };
      }
      
      // Create a simple answer map
      const answerMap: SimpleMap<{
        question_id: string;
        correct: boolean;
        selected_answer: string;
      }> = {};
      
      for (const a of answerData) {
        answerMap[a.question_id] = {
          question_id: a.question_id,
          correct: a.correct,
          selected_answer: a.selected_answer
        };
      }
      
      // Build answers array in the correct order
      const answers: Answer[] = [];
      
      for (const qId of challengeData.question_ids) {
        const answer = answerMap[qId];
        const question = questionMap[qId];
        
        if (answer && question) {
          answers.push({
            questionId: qId,
            correct: answer.correct,
            selectedAnswer: answer.selected_answer,
            explanation: question.explanation,
            correctAnswer: question.correctAnswer
          });
        }
      }
      
      setCompletedAnswers(answers);
    } catch (error) {
      console.error('Error fetching completed challenge data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    completedAnswers,
    loading
  };
};
