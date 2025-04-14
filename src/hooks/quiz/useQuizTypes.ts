
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/utils/types';

// Define the quiz modes available in the system
export type QuizMode = 'standard' | 'time-attack' | 'challenge' | 'multiplayer';

// Types for social features
export interface QuizChallenge {
  id: string;
  challengerId: string;
  challengerName: string;
  recipientId: string;
  recipientName: string;
  questionIds: string[];
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  createdAt: string;
  score?: {
    challenger: number;
    recipient: number;
  };
}

export const useQuizTypes = () => {
  const [availableQuestionTypes, setAvailableQuestionTypes] = useState<string[]>([
    'text', 'image', 'multiple-choice', 'true-false', 'drag-and-drop'
  ]);
  
  const [currentMode, setCurrentMode] = useState<QuizMode>('standard');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  
  // For time attack mode
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (timerActive && timeRemaining !== null && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    } else if (timeRemaining === 0) {
      setTimerActive(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timerActive, timeRemaining]);
  
  // Start a time attack mode quiz
  const startTimeAttack = (seconds: number = 60) => {
    setCurrentMode('time-attack');
    setTimeRemaining(seconds);
    setTimerActive(true);
  };
  
  // Send a challenge to another user
  const sendChallenge = async (recipientId: string, questionIds: string[]) => {
    const userId = localStorage.getItem('quiz_app_user_id');
    const userProfile = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    
    const recipientProfile = await supabase
      .from('profiles')
      .select('username')
      .eq('id', recipientId)
      .single();
      
    if (userProfile.error || recipientProfile.error) {
      return { success: false, error: 'Could not find user profiles' };
    }
    
    const { data, error } = await supabase
      .from('user_challenges')
      .insert({
        challenger_id: userId,
        challenger_name: userProfile.data.username,
        recipient_id: recipientId,
        recipient_name: recipientProfile.data.username,
        question_ids: questionIds,
        status: 'pending'
      });
      
    return { success: !error, data, error };
  };
  
  // Get challenges for current user
  const getChallenges = async (): Promise<QuizChallenge[]> => {
    const userId = localStorage.getItem('quiz_app_user_id');
    
    const { data, error } = await supabase
      .from('user_challenges')
      .select('*')
      .or(`challenger_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });
      
    if (error || !data) {
      return [];
    }
    
    return data.map(challenge => ({
      id: challenge.id,
      challengerId: challenge.challenger_id,
      challengerName: challenge.challenger_name,
      recipientId: challenge.recipient_id,
      recipientName: challenge.recipient_name,
      questionIds: challenge.question_ids,
      status: challenge.status,
      createdAt: challenge.created_at,
      score: challenge.score
    }));
  };
  
  return {
    availableQuestionTypes,
    currentMode,
    setCurrentMode,
    timeRemaining,
    startTimeAttack,
    timerActive,
    setTimerActive,
    sendChallenge,
    getChallenges
  };
};
