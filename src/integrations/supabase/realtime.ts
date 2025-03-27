
import { supabase } from './client';

// Connect to realtime channel for all tables
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
    'admin_notifications'  // Add this line
  ];
  
  console.log('Setting up realtime subscriptions for all tables...');
  
  // Create a unique channel for all table changes
  const channel = supabase.channel('db-changes');
  
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
      }
    );
  });
  
  // Subscribe to the channel
  channel.subscribe(status => {
    console.log(`Realtime subscription status: ${status}`);
  });
  
  return channel;
};
