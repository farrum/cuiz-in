
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
    'admin_notifications'
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
      }
    );
  });
  
  // Subscribe to the channel
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

// New function to remove realtime subscriptions
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

// New function to check if realtime is connected
export const isRealtimeConnected = () => {
  return activeSubscriptions.has('global');
};
