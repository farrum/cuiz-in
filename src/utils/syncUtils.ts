
import { STORAGE_KEYS } from '../types/quiz';
import { SyncStats } from '../types/withdrawal';

// Track sync statistics
export const syncStats: Record<string, SyncStats> = {
  allData: { status: 'idle' },
  quizQuestions: { status: 'idle' },
  adSlots: { status: 'idle' },
  withdrawals: { status: 'idle' }
};

export const syncAllDataToSupabase = async () => {
  try {
    syncStats.allData = { 
      status: 'syncing', 
      startTime: new Date(),
      syncedItems: 0
    };

    const { syncAllDataToSupabase } = await import('@/integrations/supabase/client');
    const result = await syncAllDataToSupabase();
    
    // Since the result might be void, we need to safely handle this
    let syncedItems = 0;
    if (result && typeof result === 'object' && 'totalSynced' in result) {
      syncedItems = result.totalSynced ?? 0;
    }
    
    syncStats.allData = { 
      ...syncStats.allData,
      status: 'completed', 
      endTime: new Date(),
      syncedItems: syncedItems,
      lastSyncTime: new Date()
    };
    
    return result;
  } catch (error) {
    console.error('Error syncing all data:', error);
    syncStats.allData = { 
      ...syncStats.allData,
      status: 'failed', 
      endTime: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const syncQuizQuestionsToSupabase = async () => {
  try {
    syncStats.quizQuestions = { 
      status: 'syncing', 
      startTime: new Date()
    };

    const { syncQuizQuestionsToSupabase } = await import('@/integrations/supabase/client');
    const result = await syncQuizQuestionsToSupabase();
    
    syncStats.quizQuestions = { 
      ...syncStats.quizQuestions,
      status: 'completed', 
      endTime: new Date(),
      syncedItems: result?.addedToSupabase || 0,
      lastSyncTime: new Date()
    };
    
    return result;
  } catch (error) {
    console.error('Error syncing quiz questions:', error);
    syncStats.quizQuestions = { 
      ...syncStats.quizQuestions,
      status: 'failed', 
      endTime: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    throw error;
  }
};

export const syncAdSlotsToLocal = async () => {
  try {
    syncStats.adSlots = { 
      status: 'syncing', 
      startTime: new Date()
    };

    const { syncAdSlotsToLocal } = await import('@/integrations/supabase/client');
    const result = await syncAdSlotsToLocal();
    
    syncStats.adSlots = { 
      ...syncStats.adSlots,
      status: 'completed', 
      endTime: new Date(),
      lastSyncTime: new Date()
    };
    
    return result;
  } catch (error) {
    console.error('Error syncing ad slots:', error);
    syncStats.adSlots = { 
      ...syncStats.adSlots,
      status: 'failed', 
      endTime: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get sync status and timing information
export const getSyncStatus = (syncType: keyof typeof syncStats): SyncStats => {
  return syncStats[syncType] || { status: 'idle' };
};

// Calculate sync duration in milliseconds
export const calculateSyncDuration = (syncType: keyof typeof syncStats): number | null => {
  const stats = syncStats[syncType];
  if (stats?.startTime && stats?.endTime) {
    return stats.endTime.getTime() - stats.startTime.getTime();
  }
  return null;
};

// Format duration for display
export const formatDuration = (milliseconds: number | null): string => {
  if (milliseconds === null) return 'N/A';
  
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
};
