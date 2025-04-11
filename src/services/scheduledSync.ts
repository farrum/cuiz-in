
import { fetchAllAppData, syncLocalStorageToSupabase } from '@/integrations/supabase/client';
import { checkAndSuspendInactiveAccounts } from '@/utils/accountSuspension';

// Configuration for sync intervals
export const SYNC_CONFIG = {
  fetchInterval: 15 * 60 * 1000, // 15 minutes in milliseconds (increased from 5 minutes)
  syncInterval: 30 * 60 * 1000, // 30 minutes in milliseconds (increased from 15 minutes)
  autoSync: true // Default to enabled
};

// Create a service that handles scheduled synchronization tasks
class ScheduledSyncService {
  private interval: number | null = null;
  private lastFetchTime: Date | null = null;
  private lastSyncTime: Date | null = null;
  private isAutoSyncEnabled: boolean = SYNC_CONFIG.autoSync;
  private isSyncing: boolean = false; // Flag to prevent overlapping sync operations
  
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
  getStatus(): { isAutoSyncEnabled: boolean; lastFetchTime: Date | null; lastSyncTime: Date | null; isSyncing: boolean } {
    return {
      isAutoSyncEnabled: this.isAutoSyncEnabled,
      lastFetchTime: this.lastFetchTime,
      lastSyncTime: this.lastSyncTime,
      isSyncing: this.isSyncing
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
    // Skip if auto-sync is disabled or another sync operation is in progress
    if (!this.isAutoSyncEnabled || this.isSyncing) return;
    
    try {
      this.isSyncing = true;
      console.log('Running scheduled sync tasks at:', new Date().toISOString());
      
      // Check if we need to sync data from client to server
      const shouldSyncToServer = !this.lastSyncTime || 
        (Date.now() - this.lastSyncTime.getTime() > SYNC_CONFIG.syncInterval);
        
      if (shouldSyncToServer) {
        // Sync local storage to Supabase
        const syncResult = await syncLocalStorageToSupabase();
        if (syncResult === true) {
          this.lastSyncTime = new Date();
          console.log('Successfully synced data to Supabase');
        } else {
          console.log('Sync to Supabase failed or was incomplete');
        }
      } else {
        console.log('Skipping sync to server - not due yet');
      }
      
      // Check if we need to fetch from server to client
      const shouldFetchFromServer = !this.lastFetchTime || 
        (Date.now() - this.lastFetchTime.getTime() > SYNC_CONFIG.fetchInterval);
        
      if (shouldFetchFromServer) {
        // Check and suspend inactive accounts less frequently
        await checkAndSuspendInactiveAccounts();
        this.lastFetchTime = new Date();
      } else {
        console.log('Skipping fetch from server - not due yet');
      }
      
      console.log('Finished scheduled sync tasks');
    } catch (error) {
      console.error('Error in scheduled sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }
}

// Create a singleton instance
const scheduledSyncService = new ScheduledSyncService();

export default scheduledSyncService;
