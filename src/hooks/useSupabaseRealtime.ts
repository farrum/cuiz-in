
import { useState, useEffect, useRef } from 'react';
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
  | 'admin_notifications';

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
  debounceMs?: number;
  skipDuplicates?: boolean;
  stableChannel?: boolean;
  filter?: string; // Add filter option to reduce payload
  columns?: string; // Add columns option to specify columns
}

const defaultOptions: UseSupabaseRealtimeOptions = {
  event: '*',
  schema: 'public',
  showToasts: false, // Default to no toasts to reduce UI noise
  updateLocalStorage: true,
  debounceMs: 500, // Increased debounce to reduce updates
  skipDuplicates: true,
  stableChannel: true, // Default to stable channels to reuse subscriptions
  filter: undefined,
  columns: undefined
};

// Use a global registry of channels to avoid duplicates
const activeChannels = new Map<string, any>();

export function useSupabaseRealtime(
  table: RealtimeTable, 
  options: UseSupabaseRealtimeOptions = {}
) {
  const mergedOptions = { ...defaultOptions, ...options };
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealtimePayload | null>(null);
  const { toast } = useToast();
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastPayloadHashRef = useRef<string | null>(null);
  const channelRef = useRef<any>(null);

  const hashPayload = (payload: any): string => {
    try {
      const relevantData = {
        id: payload.new?.id || payload.old?.id,
        table: payload.table,
        event: payload.eventType,
        timestamp: payload.commit_timestamp
      };
      return JSON.stringify(relevantData);
    } catch (err) {
      return Date.now().toString();
    }
  };

  const getChannelKey = (table: string, options: UseSupabaseRealtimeOptions) => {
    const filterPart = options.filter ? `-${options.filter}` : '';
    const columnsPart = options.columns ? `-${options.columns}` : '';
    return `realtime_${table}_${options.event}_${options.schema}${filterPart}${columnsPart}`;
  };

  useEffect(() => {
    const channelKey = getChannelKey(table, mergedOptions);
    
    if (mergedOptions.stableChannel && activeChannels.has(channelKey)) {
      console.log(`Reusing existing channel for ${table}`);
      channelRef.current = activeChannels.get(channelKey);
      setIsConnected(true);
      return () => {};
    }
    
    console.log(`Setting up realtime listener for ${table} with debounce: ${mergedOptions.debounceMs}ms`);
    
    const channelName = `${channelKey}_${Date.now()}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;
    
    if (mergedOptions.stableChannel) {
      activeChannels.set(channelKey, channel);
    }
    
    // Build subscription config with filter and columns if provided
    const subscriptionConfig: any = {
      event: mergedOptions.event,
      schema: mergedOptions.schema,
      table: table
    };
    
    if (mergedOptions.filter) {
      subscriptionConfig.filter = mergedOptions.filter;
    }
    
    if (mergedOptions.columns) {
      subscriptionConfig.columns = mergedOptions.columns.split(',');
    }
    
    channel.on(
      'postgres_changes' as any,
      subscriptionConfig,
      (payload: any) => {
        console.log(`Realtime update received for ${table}:`, payload);
        
        const payloadHash = hashPayload(payload);
        
        if (mergedOptions.skipDuplicates && payloadHash === lastPayloadHashRef.current) {
          console.log(`Skipping duplicate realtime event for ${table}`);
          return;
        }
        
        lastPayloadHashRef.current = payloadHash;
        
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        debounceTimerRef.current = setTimeout(() => {
          console.log(`Processing debounced update for ${table}`);
          
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
          
          debounceTimerRef.current = null;
        }, mergedOptions.debounceMs);
      }
    );
    
    channel.subscribe((status: string) => {
      console.log(`Subscription status for ${table}:`, status);
      setIsConnected(status === 'SUBSCRIBED');
    });

    return () => {
      console.log(`Cleaning up realtime listener for ${table}`);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      if (!mergedOptions.stableChannel) {
        console.log(`Removing channel for ${table}`);
        supabase.removeChannel(channel);
      }
    };
  }, [table, mergedOptions.event, mergedOptions.schema, mergedOptions.debounceMs, mergedOptions.stableChannel, mergedOptions.filter, mergedOptions.columns]);

  const handleLocalStorageUpdate = (tableName: RealtimeTable, payload: RealtimePayload) => {
    try {
      const localStorageKey = getLocalStorageKey(tableName);
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
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
      admin_notifications: 'admin_notifications'
    };
    
    return mapping[tableName] || tableName;
  };

  return { isConnected, lastUpdate };
}

export function cleanupAllRealtimeChannels() {
  console.log(`Cleaning up all realtime channels (${activeChannels.size} channels)`);
  activeChannels.forEach((channel, key) => {
    supabase.removeChannel(channel);
  });
  activeChannels.clear();
}
