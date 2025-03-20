import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define valid table names as a type
type TableName = 'profiles' | 'login_logs' | 'ad_slots' | 'quiz_questions' | 'quiz_answers' | 'payments' | 'user_referrals' | 'user_roles' | 'news_ticker';
type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

// Define the type for the payload structure we receive from Supabase realtime
interface RealtimePayload {
  commit_timestamp: string;
  eventType: string;
  schema: string;
  table: string;
  new: any;
  old: any;
}

export const useRealtimeUpdates = (tableName: TableName, eventType: EventType = '*') => {
  const [lastUpdate, setLastUpdate] = useState<RealtimePayload | null>(null);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log(`Setting up realtime listener for ${tableName}`);
    
    // Create a channel for this specific table
    const channel = supabase.channel(`table:${tableName}:changes`);
    
    // Set up the subscription
    channel
      .on('postgres_changes', { 
        event: eventType,
        schema: 'public',
        table: tableName 
      }, (payload) => {
        console.log(`Realtime update for ${tableName}:`, payload);
        // Cast payload to our expected structure
        const realTimePayload = payload as unknown as RealtimePayload;
        setLastUpdate(realTimePayload);
        
        toast({
          title: `${tableName} Updated`,
          description: `${realTimePayload.eventType} operation detected. Data has been updated.`,
        });
        
        // Update localStorage with the new data
        if (realTimePayload.eventType === 'INSERT' || realTimePayload.eventType === 'UPDATE') {
          updateLocalStorage(tableName, realTimePayload);
        } else if (realTimePayload.eventType === 'DELETE') {
          removeFromLocalStorage(tableName, realTimePayload);
        }
      })
      .subscribe((status) => {
        console.log(`Subscription status for ${tableName}:`, status);
        if (status === 'SUBSCRIBED') {
          setIsListening(true);
          console.log(`Listening for changes on ${tableName} table`);
        }
      });

    return () => {
      console.log(`Cleaning up realtime listener for ${tableName}`);
      supabase.removeChannel(channel);
      setIsListening(false);
    };
  }, [tableName, eventType, toast]);

  const updateLocalStorage = (table: string, payload: RealtimePayload) => {
    try {
      const localStorageKey = getLocalStorageKey(table);
      const existingData = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
      
      // Find if the item already exists
      const index = existingData.findIndex((item: any) => item.id === payload.new.id);
      
      if (index !== -1) {
        // Update existing item
        existingData[index] = payload.new;
      } else {
        // Add new item
        existingData.push(payload.new);
      }
      
      // Save back to localStorage
      localStorage.setItem(localStorageKey, JSON.stringify(existingData));
      console.log(`Updated ${localStorageKey} in localStorage with realtime data`);
    } catch (error) {
      console.error(`Error updating localStorage for ${table}:`, error);
    }
  };

  const removeFromLocalStorage = (table: string, payload: RealtimePayload) => {
    try {
      const localStorageKey = getLocalStorageKey(table);
      const existingData = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
      
      // Filter out the deleted item
      const filteredData = existingData.filter((item: any) => item.id !== payload.old.id);
      
      // Save back to localStorage
      localStorage.setItem(localStorageKey, JSON.stringify(filteredData));
      console.log(`Removed item from ${localStorageKey} in localStorage`);
    } catch (error) {
      console.error(`Error removing item from localStorage for ${table}:`, error);
    }
  };

  const getLocalStorageKey = (table: string): string => {
    switch (table) {
      case 'profiles':
        return 'admin_users';
      case 'login_logs':
        return 'quiz_app_login_log';
      case 'ad_slots':
        return 'quiz_app_ad_slots';
      case 'quiz_questions':
        return 'quiz_questions';
      case 'quiz_answers':
        return 'quiz_answers';
      case 'payments':
        return 'admin_payments';
      case 'user_referrals':
        return 'admin_referrals';
      case 'user_roles':
        return 'admin_user_roles';
      case 'news_ticker':
        return 'news_ticker';
      default:
        return table;
    }
  };

  return { isListening, lastUpdate };
};
