
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Challenge, ChallengeProgress, SimpleMap, QuestionExplanation } from './challengeTypes';
import { QuizQuestion } from '@/utils/quizData';

export const useFetchChallengeData = (
  challengeId: string | undefined,
  userId: string | null,
  toast: any
) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
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
      
      if (userId) {
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
        }
      }
      
      // Fetch quiz questions
      if (challengeData) {
        const { data: questionData, error: questionError } = await supabase
          .from('quiz_questions')
          .select('id, question, options, category, difficulty, explanation, gems:points, image_url, question_type')
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
            
            orderedQuestions.push({
              id: question.id,
              question: question.question,
              options: options,
              correctAnswer: undefined, // Validated server-side
              explanation: question.explanation || '',
              category: question.category,
              difficulty: question.difficulty as 'easy' | 'medium' | 'hard',
              gems: question.gems || 10
            });
          }
        }
        
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
  
  return {
    challenge,
    progress,
    questions,
    loading,
    fetchChallengeData
  };
};
