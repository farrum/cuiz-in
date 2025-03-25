import { syncLocalStorageToSupabase } from '@/integrations/supabase/client';
import { checkAndSuspendInactiveAccounts } from '@/utils/accountSuspension';

// Create a service that handles scheduled synchronization tasks
class ScheduledSyncService {
  private interval: number | null = null;
  private syncInterval = 15 * 60 * 1000; // 15 minutes in milliseconds
  
  // Start the scheduled sync
  start(): void {
    if (this.interval) return;
    
    console.log('Starting scheduled sync service...');
    
    // Run once immediately
    this.runSyncTasks();
    
    // Then schedule regular runs
    this.interval = window.setInterval(() => this.runSyncTasks(), this.syncInterval);
  }
  
  // Stop the scheduled sync
  stop(): void {
    if (this.interval) {
      window.clearInterval(this.interval);
      this.interval = null;
      console.log('Stopped scheduled sync service');
    }
  }
  
  // Run all sync tasks
  private async runSyncTasks(): Promise<void> {
    try {
      console.log('Running scheduled sync tasks at:', new Date().toISOString());
      
      // Sync local storage to Supabase
      await syncLocalStorageToSupabase();
      
      // Check and suspend inactive accounts
      await checkAndSuspendInactiveAccounts();
      
      console.log('Finished scheduled sync tasks');
    } catch (error) {
      console.error('Error in scheduled sync:', error);
    }
  }
}

// Create a singleton instance
const scheduledSyncService = new ScheduledSyncService();

export default scheduledSyncService;
