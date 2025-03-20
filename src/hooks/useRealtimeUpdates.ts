
import { useState, useEffect } from 'react';
import { useSupabaseRealtime, RealtimeTable, RealtimeEvent } from './useSupabaseRealtime';
import { useToast } from '@/hooks/use-toast';

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

  return { 
    isListening: isConnected, 
    lastUpdate 
  };
};
