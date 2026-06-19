import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, XCircle } from "lucide-react";
import { useSupabaseRealtime, RealtimeTable } from '@/hooks/useSupabaseRealtime';

type StatusItemProps = {
  tableName: RealtimeTable;
  displayName: string;
};

const StatusItem = ({ tableName, displayName }: StatusItemProps) => {
  const { isConnected, lastUpdate } = useSupabaseRealtime(tableName);
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
        <span className="font-medium">{displayName}</span>
        <span className="text-xs text-muted-foreground">
          {lastUpdate ? `Last update: ${timeAgo}` : 'No updates received'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isConnected ? (
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

export function RealtimeStatus() {
  const tablesToMonitor: {table: RealtimeTable, displayName: string}[] = [
    { table: 'profiles', displayName: 'User Profiles' },
    { table: 'login_logs', displayName: 'Login Logs' },
    { table: 'ad_slots', displayName: 'Ad Slots' },
    { table: 'quiz_questions', displayName: 'Quiz Questions' },
    { table: 'quiz_answers', displayName: 'Quiz Answers' },
    { table: 'payments', displayName: 'Payments' },
    { table: 'user_referrals', displayName: 'Referrals' },
    { table: 'news_ticker', displayName: 'News Ticker' },
    { table: 'admin_notifications', displayName: 'Admin Notifications' }
  ];
  
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
          {tablesToMonitor.map((item) => (
            <StatusItem 
              key={item.table}
              tableName={item.table}
              displayName={item.displayName}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
