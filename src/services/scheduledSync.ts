
import { fetchAllAppData, syncLocalStorageToSupabase } from '@/integrations/supabase/client';

// Configuration constants for synchronization
export const SYNC_CONFIG = {
  autoSync: true,
  fetchInterval: 5 * 60 * 1000, // 5 minutes
  syncInterval: 15 * 60 * 1000, // 15 minutes
  minSyncInterval: 60 * 1000, // 1 minute - minimum allowed interval
  maxSyncInterval: 24 * 60 * 60 * 1000 // 24 hours - maximum allowed interval
};

class ScheduledSyncService {
  private fetchIntervalId: number | null = null;
  private syncIntervalId: number | null = null;
  private isAutoSyncEnabled: boolean;
  private lastFetchTime: Date | null = null;
  private lastSyncTime: Date | null = null;

  constructor() {
    this.isAutoSyncEnabled = SYNC_CONFIG.autoSync;
  }

  // Start the scheduled sync service
  start() {
    if (this.isAutoSyncEnabled) {
      this.startFetchInterval();
      this.startSyncInterval();
      console.log('Scheduled sync service started');
    } else {
      console.log('Scheduled sync service is disabled');
    }
  }

  // Stop the scheduled sync service
  stop() {
    this.stopFetchInterval();
    this.stopSyncInterval();
    console.log('Scheduled sync service stopped');
  }

  // Enable or disable auto sync
  setAutoSync(enabled: boolean) {
    this.isAutoSyncEnabled = enabled;
    
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
    
    console.log(`Auto sync ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get the current status of the sync service
  getStatus() {
    return {
      isAutoSyncEnabled: this.isAutoSyncEnabled,
      lastFetchTime: this.lastFetchTime,
      lastSyncTime: this.lastSyncTime,
      fetchInterval: SYNC_CONFIG.fetchInterval,
      syncInterval: SYNC_CONFIG.syncInterval
    };
  }

  // Start the fetch interval
  private startFetchInterval() {
    if (this.fetchIntervalId !== null) return;
    
    // Perform initial fetch
    this.fetchData();
    
    // Set up regular interval
    this.fetchIntervalId = window.setInterval(() => {
      this.fetchData();
    }, SYNC_CONFIG.fetchInterval);
    
    console.log(`Fetch interval started: ${SYNC_CONFIG.fetchInterval / 1000} seconds`);
  }

  // Stop the fetch interval
  private stopFetchInterval() {
    if (this.fetchIntervalId !== null) {
      window.clearInterval(this.fetchIntervalId);
      this.fetchIntervalId = null;
      console.log('Fetch interval stopped');
    }
  }

  // Start the sync interval
  private startSyncInterval() {
    if (this.syncIntervalId !== null) return;
    
    // Set up regular interval
    this.syncIntervalId = window.setInterval(() => {
      this.syncData();
    }, SYNC_CONFIG.syncInterval);
    
    console.log(`Sync interval started: ${SYNC_CONFIG.syncInterval / 1000} seconds`);
  }

  // Stop the sync interval
  private stopSyncInterval() {
    if (this.syncIntervalId !== null) {
      window.clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('Sync interval stopped');
    }
  }

  // Fetch data from the backend
  private async fetchData() {
    try {
      console.log('Scheduled fetch: Fetching data from backend...');
      const success = await fetchAllAppData();
      if (success) {
        this.lastFetchTime = new Date();
        console.log(`Scheduled fetch completed at ${this.lastFetchTime.toLocaleTimeString()}`);
      } else {
        console.error('Scheduled fetch failed');
      }
    } catch (error) {
      console.error('Error in scheduled fetch:', error);
    }
  }

  // Sync data to the backend
  private async syncData() {
    try {
      console.log('Scheduled sync: Syncing data to backend...');
      const success = await syncLocalStorageToSupabase();
      if (success) {
        this.lastSyncTime = new Date();
        console.log(`Scheduled sync completed at ${this.lastSyncTime.toLocaleTimeString()}`);
      } else {
        console.error('Scheduled sync failed');
      }
    } catch (error) {
      console.error('Error in scheduled sync:', error);
    }
  }

  // Force an immediate fetch
  forceFetch() {
    this.fetchData();
  }

  // Force an immediate sync
  forceSync() {
    this.syncData();
  }
}

// Create a singleton instance
const scheduledSyncService = new ScheduledSyncService();

export default scheduledSyncService;
