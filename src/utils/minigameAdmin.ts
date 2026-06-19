import { supabase } from '@/integrations/supabase/client';

export interface MinigameStatus {
  active: boolean;
  plays: number;
}

export const checkMinigameStatus = async (gameId: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('gamification_settings')
      .select('config')
      .eq('setting_type', 'minigames_status')
      .maybeSingle();
      
    if (data && data.config) {
      const config = data.config as Record<string, MinigameStatus>;
      if (config[gameId] !== undefined) {
        return config[gameId].active;
      }
    }
  } catch (e) {
    console.error('Error checking minigame status:', e);
  }
  return true; // default to active if not configured
};

export const incrementMinigamePlays = async (gameId: string) => {
  try {
    const { data } = await supabase
      .from('gamification_settings')
      .select('config')
      .eq('setting_type', 'minigames_status')
      .maybeSingle();
      
    let currentConfig: Record<string, MinigameStatus> = {};
    if (data && data.config) {
      currentConfig = data.config as Record<string, MinigameStatus>;
    }
    
    const currentStats = currentConfig[gameId] || { active: true, plays: 0 };
    currentConfig[gameId] = {
      ...currentStats,
      plays: currentStats.plays + 1
    };
    
    await supabase
      .from('gamification_settings')
      .upsert({
        setting_type: 'minigames_status',
        config: currentConfig
      }, { onConflict: 'setting_type' });
  } catch (e) {
    console.error('Error incrementing play count:', e);
  }
};

export const setMinigameSuspended = async (gameId: string, suspended: boolean) => {
  try {
    const { data } = await supabase
      .from('gamification_settings')
      .select('config')
      .eq('setting_type', 'minigames_status')
      .maybeSingle();

    let currentConfig: Record<string, MinigameStatus> = {};
    if (data && data.config) {
      currentConfig = data.config as Record<string, MinigameStatus>;
    }

    const currentStats = currentConfig[gameId] || { active: true, plays: 0 };
    currentConfig[gameId] = {
      ...currentStats,
      active: !suspended,
    };

    await supabase
      .from('gamification_settings')
      .upsert({
        setting_type: 'minigames_status',
        config: currentConfig,
      }, { onConflict: 'setting_type' });
  } catch (e) {
    console.error('Error setting minigame suspension:', e);
  }
};
