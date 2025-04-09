
import { checkAndSuspendInactiveAccounts } from '@/utils/accountSuspension';

/**
 * Service to periodically check and update user account status
 */
export const accountStatusService = {
  checkInterval: null as NodeJS.Timeout | null,
  
  /**
   * Start the account status checking service
   * @param intervalMinutes How often to check (in minutes)
   */
  start(intervalMinutes: number = 60) {
    if (this.checkInterval) {
      console.log('Account status service already running');
      return;
    }
    
    // Run an initial check
    console.log('Starting initial account status check...');
    checkAndSuspendInactiveAccounts();
    
    // Set up interval for regular checks
    this.checkInterval = setInterval(() => {
      console.log('Running scheduled account status check...');
      checkAndSuspendInactiveAccounts();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`Account status service started, will check every ${intervalMinutes} minutes`);
  },
  
  /**
   * Stop the account status checking service
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Account status service stopped');
    }
  }
};

export default accountStatusService;
