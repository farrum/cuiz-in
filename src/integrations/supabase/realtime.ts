
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
    'user_challenge_progress'
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
        
        // For profiles table, ensure we update admin_users in localStorage
        if (table === 'profiles') {
          const profileData = payload.new || payload.old;
          if (profileData) {
            updateLocalStorageForTable('profiles', profileData, payload.eventType);
            debouncedDispatchEvent('profilesUpdated', [profileData]);
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

// Update localStorage for a specific table
const updateLocalStorageForTable = (table: string, data: any, eventType: string) => {
  try {
    const mappings: Record<string, string> = {
      'profiles': 'admin_users',
      'login_logs': 'quiz_app_login_log',
      'ad_slots': 'quiz_app_ad_slots',
      'quiz_questions': 'quiz_questions',
      'quiz_answers': 'quiz_answers',
      'payments': 'admin_payments',
      'user_referrals': 'admin_referrals',
      'ad_views': 'quiz_app_ad_views',
      'ad_clicks': 'quiz_app_ad_clicks',
      'daily_challenges': 'daily_challenges',
      'user_challenge_progress': 'user_challenge_progress'
    };
    
    const localStorageKey = mappings[table] || table;
    
    if (!localStorageKey) {
      console.warn(`No localStorage mapping found for table: ${table}`);
      return;
    }
    
    // Get existing data from localStorage
    const existingDataStr = localStorage.getItem(localStorageKey);
    let existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
    
    if (!Array.isArray(existingData)) {
      console.warn(`Invalid data format in localStorage for ${localStorageKey}, resetting to empty array`);
      existingData = [];
    }
    
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      // Check if item already exists
      const index = existingData.findIndex((item: any) => item.id === data.id);
      
      if (index !== -1) {
        // Update existing item
        existingData[index] = data;
      } else {
        // Add new item
        existingData.push(data);
      }
    } else if (eventType === 'DELETE') {
      // Remove item
      existingData = existingData.filter((item: any) => item.id !== data.id);
    }
    
    // Save back to localStorage
    localStorage.setItem(localStorageKey, JSON.stringify(existingData));
    console.log(`Updated localStorage for ${localStorageKey} (${eventType})`);
    
  } catch (error) {
    console.error(`Error updating localStorage for table ${table}:`, error);
  }
};

// Implement debounced event dispatch to prevent multiple rapid updates
const pendingEvents = new Map();
const debouncedDispatchEvent = (eventName: string, detail: any, timeout = 500) => {
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

// Function to force refresh admin_users from the profiles table
export const refreshAdminUsers = async () => {
  try {
    console.log('Manually refreshing admin users from database...');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return false;
    }
    
    if (data) {
      localStorage.setItem('admin_users', JSON.stringify(data));
      console.log(`Refreshed admin_users in localStorage with ${data.length} users`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing admin users:', error);
    return false;
  }
};

// Function to manually reset and reconnect realtime
export const resetAndReconnectRealtime = () => {
  console.log('Performing full realtime reset and reconnection...');
  removeRealtimeSubscriptions();
  return setupRealtimeSubscriptions();
};
