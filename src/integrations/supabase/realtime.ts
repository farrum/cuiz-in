
import { supabase } from './client';

// Track active subscriptions to prevent duplicates
const activeSubscriptions = new Map();

// Connect to realtime channel for specific tables
export const setupRealtimeSubscriptions = () => {
  const tables = [
    'profiles',
    'login_logs',
    'ad_slots',
    'quiz_questions',
    'quiz_answers',
    'payments',
    'user_referrals',
    'ad_views',
    'ad_clicks',
    'admin_notifications',
    'daily_challenges',
    'user_challenge_progress',
    'user_roles'  // Added user_roles table to track role changes
  ];
  
  console.log('Setting up realtime subscriptions for all tables...');
  
  // Check if we already have an active subscription
  if (activeSubscriptions.has('global')) {
    console.log('Global realtime subscription already active, using existing channel');
    return activeSubscriptions.get('global');
  }
  
  // Create a stable channel name to prevent recreation
  const channelId = 'global-db-changes';
  
  // Create the channel
  const channel = supabase.channel(channelId);
  
  // Subscribe to changes for each table
  tables.forEach(table => {
    console.log(`Adding subscription for table: ${table}`);
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      (payload) => {
        console.log(`Realtime update for ${table}:`, payload);
        
        // For ad_slots table, emit a more targeted event
        if (table === 'ad_slots') {
          // Create a custom event that includes only the updated record
          const updatedSlot = payload.new || payload.old;
          if (updatedSlot) {
            // Only dispatch event if there's actual content
            const detail = [updatedSlot];
            
            // Use debounced event dispatch
            debouncedDispatchEvent('adSlotsUpdated', detail);
          }
        }
        
        // For daily_challenges table, emit relevant events
        if (table === 'daily_challenges') {
          const challengeData = payload.new || payload.old;
          if (challengeData) {
            debouncedDispatchEvent('challengesUpdated', [challengeData]);
          }
        }
        
        // For user_challenge_progress table, emit progress events
        if (table === 'user_challenge_progress') {
          const progressData = payload.new || payload.old;
          if (progressData) {
            debouncedDispatchEvent('challengeProgressUpdated', [progressData]);
          }
        }
        
        // For user_roles table, emit role update events
        if (table === 'user_roles') {
          const roleData = payload.new || payload.old;
          if (roleData && roleData.user_id !== undefined) { // Ensure user_id exists
            debouncedDispatchEvent('userRoleUpdated', [roleData]);
            
            // If the current user's role was updated, update localStorage
            const userId = localStorage.getItem('quiz_app_user_id');
            if (userId && roleData.user_id === userId && roleData.role) { // Check for role property
              localStorage.setItem('quiz_app_user_role', roleData.role);
              
              // Force reload if on admin page to refresh permissions
              if (window.location.pathname.startsWith('/admin')) {
                debouncedDispatchEvent('currentUserRoleUpdated', [roleData]);
              }
            }
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
