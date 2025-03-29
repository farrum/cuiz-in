import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type RealtimeTable = 
  | 'profiles' 
  | 'login_logs' 
  | 'ad_slots' 
  | 'quiz_questions' 
  | 'quiz_answers' 
  | 'payments' 
  | 'user_referrals' 
  | 'user_roles' 
  | 'news_ticker'
  | 'login_streaks'
  | 'admin_notifications'
  | 'daily_challenges'
  | 'user_challenge_progress';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimePayload {
  commit_timestamp: string;
  eventType: string;
  schema: string;
  table: string;
  new: any;
  old: any;
}

export interface UseSupabaseRealtimeOptions {
  event?: RealtimeEvent;
  schema?: string;
  showToasts?: boolean;
  updateLocalStorage?: boolean;
}

const defaultOptions: UseSupabaseRealtimeOptions = {
  event: '*',
  schema: 'public',
  showToasts: true,
  updateLocalStorage: true
};

export function useSupabaseRealtime(
  table: RealtimeTable, 
  options: UseSupabaseRealtimeOptions = {}
) {
  const mergedOptions = { ...defaultOptions, ...options };
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealtimePayload | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log(`Setting up realtime listener for ${table}`);
    
    // Create a unique channel name
    const channelName = `realtime_${table}_${Date.now()}`;
    
    // Create the channel
    const channel = supabase.channel(channelName);
    
    // Configure the channel to listen for postgres changes
    // The type definition issue is with how we use the .on() method
    channel.on(
      'postgres_changes' as any, // Use type assertion to work around the type issue
      {
        event: mergedOptions.event,
        schema: mergedOptions.schema,
        table: table
      },
      (payload: any) => {
        console.log(`Realtime update received for ${table}:`, payload);
        setLastUpdate(payload);
        
        if (mergedOptions.showToasts) {
          toast({
            title: `${table} Updated`,
            description: `${payload.eventType} operation detected.`,
          });
        }
        
        if (mergedOptions.updateLocalStorage) {
          handleLocalStorageUpdate(table, payload);
        }
      }
    );
    
    // Subscribe to the channel
    channel.subscribe((status: string) => {
      console.log(`Subscription status for ${table}:`, status);
      setIsConnected(status === 'SUBSCRIBED');
    });

    // Cleanup function
    return () => {
      console.log(`Cleaning up realtime listener for ${table}`);
      supabase.removeChannel(channel);
    };
  }, [table, mergedOptions, toast]);

  const handleLocalStorageUpdate = (tableName: RealtimeTable, payload: RealtimePayload) => {
    try {
      const localStorageKey = getLocalStorageKey(tableName);
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        // Update existing data
        const existingData = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
        const index = existingData.findIndex((item: any) => item.id === payload.new.id);
        
        if (index !== -1) {
          existingData[index] = payload.new;
        } else {
          existingData.push(payload.new);
        }
        
        localStorage.setItem(localStorageKey, JSON.stringify(existingData));
        console.log(`Updated ${localStorageKey} in localStorage with realtime data`);
      } 
      else if (payload.eventType === 'DELETE') {
        // Remove deleted item
        const existingData = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
        const filteredData = existingData.filter((item: any) => item.id !== payload.old.id);
        localStorage.setItem(localStorageKey, JSON.stringify(filteredData));
        console.log(`Removed item from ${localStorageKey} in localStorage`);
      }
    } catch (error) {
      console.error(`Error updating localStorage for ${tableName}:`, error);
    }
  };

  const getLocalStorageKey = (tableName: RealtimeTable): string => {
    const mapping: Record<RealtimeTable, string> = {
      profiles: 'admin_users',
      login_logs: 'quiz_app_login_log',
      ad_slots: 'quiz_app_ad_slots',
      quiz_questions: 'quiz_questions',
      quiz_answers: 'quiz_answers',
      payments: 'admin_payments',
      user_referrals: 'admin_referrals',
      user_roles: 'admin_user_roles',
      news_ticker: 'news_ticker',
      login_streaks: 'login_streaks',
      admin_notifications: 'admin_notifications',
      daily_challenges: 'daily_challenges',
      user_challenge_progress: 'user_challenge_progress'
    };
    
    return mapping[tableName] || tableName;
  };

  return { isConnected, lastUpdate };
}
