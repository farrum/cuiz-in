
import { supabase } from './client';

// Track active subscriptions to prevent duplicates
const activeSubscriptions = new Map();

// Define interface for role data to fix TypeScript errors
interface RoleData {
  user_id?: string;
  role?: string;
  [key: string]: any;
}

// Connect to realtime channel for specific tables
export const setupRealtimeSubscriptions = () => {
  const tables = [
    'user_roles',  // Only include essential tables
    'admin_notifications',
    'daily_challenges'
  ];
  
  console.log('Setting up realtime subscriptions for essential tables...');
  
  // Check if we already have an active subscription
  if (activeSubscriptions.has('global')) {
    console.log('Global realtime subscription already active, using existing channel');
    return activeSubscriptions.get('global');
  }
  
  // Create a stable channel name to prevent recreation
  const channelId = 'global-db-changes';
  
  // Create the channel
  const channel = supabase.channel(channelId);
  
  // Subscribe only to changes for essential tables
  tables.forEach(table => {
    console.log(`Adding subscription for table: ${table}`);
    
    // Get current user ID to filter events where possible
    const userId = localStorage.getItem('quiz_app_user_id');
    
    // Build appropriate filter for each table
    let filterConfig: any = {
      event: '*',
      schema: 'public',
      table,
    };
    
    // Add user-specific filters where appropriate
    if (table === 'user_roles' && userId) {
      filterConfig.filter = `user_id=eq.${userId}`;
    }
    
    channel.on(
      'postgres_changes',
      filterConfig,
      (payload) => {
        console.log(`Realtime update for ${table}:`, payload);
        
        // For user_roles table, emit role update events
        if (table === 'user_roles') {
          const roleData = (payload.new || payload.old) as RoleData; // Cast to RoleData type
          if (roleData && roleData.user_id) { // Check if user_id exists
            // Normalize role name for team leaders
            if (roleData.role === 'teamleader') {
              roleData.role = 'team_leader';
            }
            
            debouncedDispatchEvent('userRoleUpdated', [roleData]);
            
            // If the current user's role was updated, update localStorage
            const userId = localStorage.getItem('quiz_app_user_id');
            if (userId && roleData.user_id === userId && roleData.role) {
              localStorage.setItem('quiz_app_user_role', roleData.role);
              
              // Dispatch event immediately - this is important!
              window.dispatchEvent(new CustomEvent('currentUserRoleUpdated', { detail: [roleData] }));
              
              // Force reload if on specific pages to refresh permissions
              if (window.location.pathname.startsWith('/admin') || 
                  window.location.pathname.startsWith('/team-dashboard')) {
                
                // Force page reload to apply new permissions
                setTimeout(() => {
                  console.log('Role changed, reloading page to apply new permissions');
                  window.location.reload();
                }, 1500);
              }
            }
          }
        }
        
        // For daily_challenges, emit targeted events
        else if (table === 'daily_challenges') {
          const challengeData = payload.new || payload.old;
          if (challengeData) {
            debouncedDispatchEvent('challengesUpdated', [challengeData]);
          }
        }
        
        // For admin_notifications, emit events with debouncing
        else if (table === 'admin_notifications') {
          const notificationData = payload.new || payload.old;
          if (notificationData) {
            debouncedDispatchEvent('adminNotificationsUpdated', [notificationData], 250);
          }
        }
      }
    );
  });
  
  // Subscribe to the channel only once
  channel.subscribe(status => {
    console.log(`Realtime subscription status: ${status}`);
    
    // In case of error, attempt reconnection
    if (status === 'CHANNEL_ERROR') {
      console.log('Channel error detected, will attempt reconnection in 5 seconds');
      setTimeout(() => {
        console.log('Attempting to reconnect realtime channel...');
        channel.subscribe();
      }, 5000);
    }
  });
  
  // Store the active subscription
  activeSubscriptions.set('global', channel);
  
  return channel;
};

// Implement debounced event dispatch to prevent multiple rapid updates
const pendingEvents = new Map();
const debouncedDispatchEvent = (eventName, detail, timeout = 500) => {
  // Cancel any existing timeout for this event
  if (pendingEvents.has(eventName)) {
    clearTimeout(pendingEvents.get(eventName));
  }
  
  // Create a new timeout
  const timer = setTimeout(() => {
    console.log(`Dispatching debounced event: ${eventName}`);
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    pendingEvents.delete(eventName);
  }, timeout);
  
  pendingEvents.set(eventName, timer);
};

// Function to remove realtime subscriptions
export const removeRealtimeSubscriptions = () => {
  if (activeSubscriptions.has('global')) {
    const channel = activeSubscriptions.get('global');
    
    // Clear any pending debounced events
    pendingEvents.forEach((timer, eventName) => {
      clearTimeout(timer);
    });
    pendingEvents.clear();
    
    supabase.removeChannel(channel);
    activeSubscriptions.delete('global');
    console.log('Removed global realtime subscription');
  }
};

// Function to check if realtime is connected
export const isRealtimeConnected = () => {
  return activeSubscriptions.has('global');
};

// Function to reset and reconnect realtime subscriptions
export const resetRealtimeConnection = () => {
  removeRealtimeSubscriptions();
  return setupRealtimeSubscriptions();
};
