
import { useState, useEffect } from 'react';
import { useSupabaseRealtime, RealtimeTable, RealtimeEvent } from './useSupabaseRealtime';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';

// Define the type for the payload structure we receive from Supabase realtime
interface RealtimePayload {
  commit_timestamp: string;
  eventType: string;
  schema: string;
  table: string;
  new: any;
  old: any;
}

// This is a wrapper around useSupabaseRealtime for backward compatibility
export const useRealtimeUpdates = (tableName: RealtimeTable, eventType: RealtimeEvent = '*') => {
  const { isConnected, lastUpdate } = useSupabaseRealtime(tableName, {
    event: eventType
  });

  // If this is related to user_roles, add special handling for team leaders
  useEffect(() => {
    if (tableName === 'user_roles' && lastUpdate) {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const roleData = lastUpdate.new || lastUpdate.old;
      
      if (userId && roleData && roleData.user_id === userId) {
        // Normalize role name for team leaders
        let normalizedRole = roleData.role;
        if (normalizedRole === 'teamleader') {
          normalizedRole = 'team_leader';
        }
        
        // Update localStorage
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, normalizedRole);
        
        // Dispatch custom event for other components to listen to
        window.dispatchEvent(new CustomEvent('currentUserRoleUpdated', { 
          detail: [{ ...roleData, role: normalizedRole }]
        }));
        
        console.log('Role updated in useRealtimeUpdates:', normalizedRole);
      }
    }
  }, [tableName, lastUpdate]);

  return { 
    isListening: isConnected, 
    lastUpdate 
  };
};
