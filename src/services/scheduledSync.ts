
import { syncLocalStorageToSupabase } from '@/integrations/supabase/client';
import { checkAndSuspendInactiveAccounts } from '@/utils/accountSuspension';

// Configuration for sync intervals
export const SYNC_CONFIG = {
  fetchInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
  syncInterval: 15 * 60 * 1000, // 15 minutes in milliseconds
  autoSync: true // Default to enabled
};

// Create a service that handles scheduled synchronization tasks
class ScheduledSyncService {
  private interval: number | null = null;
  private lastFetchTime: Date | null = null;
  private lastSyncTime: Date | null = null;
  private isAutoSyncEnabled: boolean = SYNC_CONFIG.autoSync;
  
  // Start the scheduled sync
  start(): void {
    if (this.interval) return;
    
    console.log('Starting scheduled sync service...');
    
    // Run once immediately
    this.runSyncTasks();
    
    // Then schedule regular runs
    this.interval = window.setInterval(() => this.runSyncTasks(), SYNC_CONFIG.syncInterval);
  }
  
  // Stop the scheduled sync
  stop(): void {
    if (this.interval) {
      window.clearInterval(this.interval);
      this.interval = null;
      console.log('Stopped scheduled sync service');
    }
  }
  
  // Get current status of the sync service
  getStatus(): { isAutoSyncEnabled: boolean; lastFetchTime: Date | null; lastSyncTime: Date | null } {
    return {
      isAutoSyncEnabled: this.isAutoSyncEnabled,
      lastFetchTime: this.lastFetchTime,
      lastSyncTime: this.lastSyncTime
    };
  }
  
  // Set auto sync enabled/disabled
  setAutoSync(enabled: boolean): void {
    this.isAutoSyncEnabled = enabled;
    console.log(`Auto sync ${enabled ? 'enabled' : 'disabled'}`);
    
    // If enabling and not already running, start the service
    if (enabled && !this.interval) {
      this.start();
    } 
    // If disabling and running, stop the service
    else if (!enabled && this.interval) {
      this.stop();
    }
  }
  
  // Run all sync tasks
  private async runSyncTasks(): Promise<void> {
    // Skip if auto-sync is disabled
    if (!this.isAutoSyncEnabled) return;
    
    try {
      console.log('Running scheduled sync tasks at:', new Date().toISOString());
      
      // Sync local storage to Supabase
      await syncLocalStorageToSupabase();
      this.lastSyncTime = new Date();
      
      // Check and suspend inactive accounts
      await checkAndSuspendInactiveAccounts();
      this.lastFetchTime = new Date();
      
      console.log('Finished scheduled sync tasks');
    } catch (error) {
      console.error('Error in scheduled sync:', error);
    }
  }
}

// Create a singleton instance
const scheduledSyncService = new ScheduledSyncService();

export default scheduledSyncService;
