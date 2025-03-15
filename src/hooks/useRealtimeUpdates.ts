
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

// Define valid table names as a type
type TableName = 'profiles' | 'login_logs' | 'ad_slots' | 'quiz_questions' | 'quiz_answers' | 'payments' | 'user_referrals' | 'user_roles';
type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export const useRealtimeUpdates = (tableName: TableName, eventType: EventType = '*') => {
  const [lastUpdate, setLastUpdate] = useState<any | null>(null);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Enable realtime for the table
    const enableRealtimeQuery = async () => {
      try {
        // Enable realtime on the table if not already enabled
        // Use type assertion to ensure TypeScript understands this is a valid call
        await supabase.rpc('enable_realtime', { table_name: tableName as string });
        console.log(`Realtime enabled for table: ${tableName}`);
      } catch (error) {
        console.error(`Error enabling realtime for ${tableName}:`, error);
      }
    };

    enableRealtimeQuery();

    // Subscribe to changes
    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes' as any,
        {
          event: eventType,
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          console.log(`Realtime update for ${tableName}:`, payload);
          setLastUpdate(payload);
          
          toast({
            title: `${tableName} Updated`,
            description: `${payload.eventType} operation detected. Data has been updated.`,
          });
          
          // Update localStorage with the new data
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            updateLocalStorage(tableName, payload);
          } else if (payload.eventType === 'DELETE') {
            removeFromLocalStorage(tableName, payload);
          }
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setIsListening(true);
          console.log(`Listening for changes on ${tableName} table`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsListening(false);
    };
  }, [tableName, eventType, toast]);

  const updateLocalStorage = (table: string, payload: any) => {
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

  const removeFromLocalStorage = (table: string, payload: any) => {
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
      default:
        return table;
    }
  };

  return { isListening, lastUpdate };
};
