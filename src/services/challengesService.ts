
import { supabase } from '@/integrations/supabase/client';
import { DailyChallenge, ChallengeProgress, CreateChallengeInput } from '@/types/challenges';

export const challengesService = {
  // Get active challenges
  getActiveChallenges: async (): Promise<DailyChallenge[]> => {
    try {
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      
      // Type assertion since we know the shape matches our DailyChallenge interface
      return data as unknown as DailyChallenge[];
    } catch (error) {
      console.error('Error fetching active challenges:', error);
      return [];
    }
  },
  
  // Get all challenges (for admin)
  getAllChallenges: async (): Promise<DailyChallenge[]> => {
    try {
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data as unknown as DailyChallenge[];
    } catch (error) {
      console.error('Error fetching all challenges:', error);
      return [];
    }
  },
  
  // Create a new challenge
  createChallenge: async (challenge: CreateChallengeInput): Promise<{ success: boolean; error: any }> => {
    try {
      const { error } = await supabase
        .from('daily_challenges')
        .insert([challenge]);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error creating challenge:', error);
      return { success: false, error };
    }
  },
  
  // Update challenge active status
  toggleChallengeStatus: async (id: string, isActive: boolean): Promise<{ success: boolean; error: any }> => {
    try {
      const { error } = await supabase
        .from('daily_challenges')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error toggling challenge status:', error);
      return { success: false, error };
    }
  },
  
  // Delete a challenge
  deleteChallenge: async (id: string): Promise<{ success: boolean; error: any }> => {
    try {
      // First, delete related progress entries
      const { error: progressError } = await supabase
        .from('user_challenge_progress')
        .delete()
        .eq('challenge_id', id);
      
      if (progressError) throw progressError;
      
      // Then delete the challenge
      const { error } = await supabase
        .from('daily_challenges')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting challenge:', error);
      return { success: false, error };
    }
  }
};

export const challengeProgressService = {
  // Get user's challenge progress
  getUserChallengeProgress: async (userId: string, challengeIds: string[]): Promise<Record<string, ChallengeProgress>> => {
    try {
      if (!challengeIds.length) return {};
      
      const { data, error } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', userId)
        .in('challenge_id', challengeIds);
      
      if (error) throw error;
      
      // Create a map of challenge progress by challenge_id
      const progressMap: Record<string, ChallengeProgress> = {};
      (data as unknown as ChallengeProgress[])?.forEach(p => {
        progressMap[p.challenge_id] = p;
      });
      
      return progressMap;
    } catch (error) {
      console.error('Error fetching user challenge progress:', error);
      return {};
    }
  },
  
  // Start or continue a challenge
  startChallenge: async (userId: string, challengeId: string): Promise<{ success: boolean; error: any }> => {
    try {
      // Check if progress already exists
      const { data, error: checkError } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      // If progress already exists, just return success
      if (data) {
        return { success: true, error: null };
      }
      
      // Create a new progress entry
      const { error } = await supabase
        .from('user_challenge_progress')
        .insert([{
          user_id: userId,
          challenge_id: challengeId,
          completed: false,
          score: 0
        }]);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error starting challenge:', error);
      return { success: false, error };
    }
  },
  
  // Update challenge progress
  updateProgress: async (userId: string, challengeId: string, score: number, completed: boolean): Promise<{ success: boolean; error: any }> => {
    try {
      const updateData: any = { score };
      
      if (completed) {
        updateData.completed = true;
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('user_challenge_progress')
        .update(updateData)
        .eq('user_id', userId)
        .eq('challenge_id', challengeId);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      return { success: false, error };
    }
  }
};
