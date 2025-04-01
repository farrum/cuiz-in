
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
  
  // Create a unique channel for all table changes
  const channelId = 'db-changes-' + Date.now();
  
  // Check if we already have an active subscription
  if (activeSubscriptions.has('global')) {
    console.log('Global realtime subscription already active, skipping');
    return activeSubscriptions.get('global');
  }
  
  // Create the channel
  const channel = supabase.channel(channelId);
  
  // Subscribe to changes for each table
  tables.forEach(table => {
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
          const detail = updatedSlot ? [updatedSlot] : [];
          
          window.dispatchEvent(new CustomEvent('adSlotsUpdated', { 
            detail 
          }));
        }
      }
    );
  });
  
  // Subscribe to the channel
  channel.subscribe(status => {
    console.log(`Realtime subscription status: ${status}`);
  });
  
  // Store the active subscription
  activeSubscriptions.set('global', channel);
  
  return channel;
};

// New function to remove realtime subscriptions
export const removeRealtimeSubscriptions = () => {
  if (activeSubscriptions.has('global')) {
    const channel = activeSubscriptions.get('global');
    supabase.removeChannel(channel);
    activeSubscriptions.delete('global');
    console.log('Removed global realtime subscription');
  }
};

// New function to check if realtime is connected
export const isRealtimeConnected = () => {
  return activeSubscriptions.has('global');
};
