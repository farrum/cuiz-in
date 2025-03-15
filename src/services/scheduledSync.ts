
import { fetchAllAppData, syncLocalStorageToSupabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Configuration for sync intervals (in milliseconds)
export const SYNC_CONFIG = {
  fetchInterval: 5 * 60 * 1000, // Fetch from Supabase every 5 minutes
  syncInterval: 10 * 60 * 1000,  // Sync to Supabase every 10 minutes
  autoSync: true, // Whether auto-sync is enabled by default
};

class ScheduledSyncService {
  private fetchIntervalId: number | null = null;
  private syncIntervalId: number | null = null;
  private isAutoSyncEnabled: boolean;
  private lastFetchTime: Date | null = null;
  private lastSyncTime: Date | null = null;
  private toast;

  constructor() {
    this.isAutoSyncEnabled = SYNC_CONFIG.autoSync;
    this.toast = useToast().toast;
  }

  public start(): void {
    if (this.isAutoSyncEnabled) {
      this.startScheduledFetch();
      this.startScheduledSync();
      console.log('Scheduled data sync service started');
    }
  }

  public stop(): void {
    this.stopScheduledFetch();
    this.stopScheduledSync();
    console.log('Scheduled data sync service stopped');
  }

  public setAutoSync(enabled: boolean): void {
    this.isAutoSyncEnabled = enabled;
    
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
    
    // Store user preference in localStorage
    localStorage.setItem('quiz_app_auto_sync', JSON.stringify(enabled));
  }

  public getStatus() {
    return {
      isAutoSyncEnabled: this.isAutoSyncEnabled,
      lastFetchTime: this.lastFetchTime,
      lastSyncTime: this.lastSyncTime,
      fetchIntervalMs: SYNC_CONFIG.fetchInterval,
      syncIntervalMs: SYNC_CONFIG.syncInterval,
    };
  }

  private startScheduledFetch(): void {
    if (this.fetchIntervalId === null) {
      // Run initial fetch
      this.performFetch();
      
      // Set interval for subsequent fetches
      this.fetchIntervalId = window.setInterval(() => {
        this.performFetch();
      }, SYNC_CONFIG.fetchInterval);
    }
  }

  private startScheduledSync(): void {
    if (this.syncIntervalId === null) {
      // Set interval for syncs
      this.syncIntervalId = window.setInterval(() => {
        this.performSync();
      }, SYNC_CONFIG.syncInterval);
    }
  }

  private stopScheduledFetch(): void {
    if (this.fetchIntervalId !== null) {
      window.clearInterval(this.fetchIntervalId);
      this.fetchIntervalId = null;
    }
  }

  private stopScheduledSync(): void {
    if (this.syncIntervalId !== null) {
      window.clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  private async performFetch(): Promise<void> {
    try {
      console.log('Performing scheduled fetch from Supabase...');
      const success = await fetchAllAppData();
      
      if (success) {
        this.lastFetchTime = new Date();
        console.log('Scheduled fetch completed successfully at', this.lastFetchTime);
      } else {
        console.error('Scheduled fetch failed');
      }
    } catch (error) {
      console.error('Error during scheduled fetch:', error);
    }
  }

  private async performSync(): Promise<void> {
    try {
      console.log('Performing scheduled sync to Supabase...');
      const success = await syncLocalStorageToSupabase();
      
      if (success) {
        this.lastSyncTime = new Date();
        console.log('Scheduled sync completed successfully at', this.lastSyncTime);
      } else {
        console.error('Scheduled sync failed');
      }
    } catch (error) {
      console.error('Error during scheduled sync:', error);
    }
  }
}

// Create a singleton instance
export const scheduledSyncService = new ScheduledSyncService();

// Initialize from localStorage if available
const initializeFromStorage = () => {
  try {
    const storedPref = localStorage.getItem('quiz_app_auto_sync');
    if (storedPref !== null) {
      const isEnabled = JSON.parse(storedPref);
      scheduledSyncService.setAutoSync(isEnabled);
    } else {
      // Use default setting if no preference stored
      scheduledSyncService.setAutoSync(SYNC_CONFIG.autoSync);
    }
  } catch (error) {
    console.error('Error initializing sync service from localStorage:', error);
    scheduledSyncService.setAutoSync(SYNC_CONFIG.autoSync);
  }
};

// Start the service when the application loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', initializeFromStorage);
}

export default scheduledSyncService;
