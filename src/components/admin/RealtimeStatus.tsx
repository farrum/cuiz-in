
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, XCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

type StatusItemProps = {
  tableName: string;
  isListening: boolean;
  lastUpdate: any | null;
};

const StatusItem = ({ tableName, isListening, lastUpdate }: StatusItemProps) => {
  const [timeAgo, setTimeAgo] = useState<string>('Never');
  
  useEffect(() => {
    if (lastUpdate?.commit_timestamp) {
      const updateTime = () => {
        const seconds = Math.floor((Date.now() - new Date(lastUpdate.commit_timestamp).getTime()) / 1000);
        
        if (seconds < 60) {
          setTimeAgo(`${seconds} second${seconds !== 1 ? 's' : ''} ago`);
        } else if (seconds < 3600) {
          const minutes = Math.floor(seconds / 60);
          setTimeAgo(`${minutes} minute${minutes !== 1 ? 's' : ''} ago`);
        } else {
          const hours = Math.floor(seconds / 3600);
          setTimeAgo(`${hours} hour${hours !== 1 ? 's' : ''} ago`);
        }
      };
      
      updateTime();
      const interval = setInterval(updateTime, 10000);
      return () => clearInterval(interval);
    }
  }, [lastUpdate]);
  
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex flex-col">
        <span className="font-medium">{tableName}</span>
        <span className="text-xs text-muted-foreground">
          {lastUpdate ? `Last update: ${timeAgo}` : 'No updates received'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isListening ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex gap-1 items-center">
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex gap-1 items-center">
            <XCircle className="h-3 w-3" />
            Disconnected
          </Badge>
        )}
        {lastUpdate && (
          <Badge variant="secondary" className="text-xs">
            {lastUpdate.eventType}
          </Badge>
        )}
      </div>
    </div>
  );
};

type TableStatus = {
  name: string;
  displayName: string;
  isListening: boolean;
  lastUpdate: any | null;
};

export function RealtimeStatus() {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([
    { name: 'profiles', displayName: 'User Profiles', isListening: false, lastUpdate: null },
    { name: 'login_logs', displayName: 'Login Logs', isListening: false, lastUpdate: null },
    { name: 'ad_slots', displayName: 'Ad Slots', isListening: false, lastUpdate: null },
    { name: 'quiz_questions', displayName: 'Quiz Questions', isListening: false, lastUpdate: null },
    { name: 'quiz_answers', displayName: 'Quiz Answers', isListening: false, lastUpdate: null },
    { name: 'payments', displayName: 'Payments', isListening: false, lastUpdate: null },
    { name: 'user_referrals', displayName: 'Referrals', isListening: false, lastUpdate: null }
  ]);

  useEffect(() => {
    // Create a channel for each table
    const channels = tableStatuses.map(table => {
      const channel = supabase
        .channel(`table-changes-${table.name}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table.name,
          },
          (payload) => {
            // Update the table status with the new payload
            setTableStatuses(prev => 
              prev.map(t => 
                t.name === table.name 
                  ? { ...t, lastUpdate: payload } 
                  : t
              )
            );
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            // Update the listening status
            setTableStatuses(prev => 
              prev.map(t => 
                t.name === table.name 
                  ? { ...t, isListening: true } 
                  : t
              )
            );
            console.log(`Listening for changes on ${table.name} table`);
          }
        });

      return channel;
    });

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, []);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Realtime Data Status</CardTitle>
            <CardDescription>
              Live connection status with Supabase
            </CardDescription>
          </div>
          <Activity className="h-5 w-5 text-primary animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {tableStatuses.map((item) => (
            <StatusItem 
              key={item.name}
              tableName={item.displayName}
              isListening={item.isListening}
              lastUpdate={item.lastUpdate}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
