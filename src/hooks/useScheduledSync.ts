
import { useState, useEffect } from 'react';
import scheduledSyncService, { SYNC_CONFIG } from '@/services/scheduledSync';

export const useScheduledSync = () => {
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(SYNC_CONFIG.autoSync);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  useEffect(() => {
    // Initialize state from the service
    const status = scheduledSyncService.getStatus();
    setIsAutoSyncEnabled(status.isAutoSyncEnabled);
    setLastFetchTime(status.lastFetchTime);
    setLastSyncTime(status.lastSyncTime);
    
    // Poll for status updates
    const intervalId = setInterval(() => {
      const updatedStatus = scheduledSyncService.getStatus();
      setLastFetchTime(updatedStatus.lastFetchTime);
      setLastSyncTime(updatedStatus.lastSyncTime);
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  const toggleAutoSync = (enabled: boolean) => {
    scheduledSyncService.setAutoSync(enabled);
    setIsAutoSyncEnabled(enabled);
  };
  
  return {
    isAutoSyncEnabled,
    lastFetchTime,
    lastSyncTime,
    toggleAutoSync,
    fetchIntervalMs: SYNC_CONFIG.fetchInterval,
    syncIntervalMs: SYNC_CONFIG.syncInterval
  };
};
