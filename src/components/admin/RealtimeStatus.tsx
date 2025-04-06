
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabaseRealtime, RealtimeTable } from '@/hooks/useSupabaseRealtime';
import { resetAndReconnectRealtime } from '@/integrations/supabase/realtime';
import { useToast } from '@/hooks/use-toast';

type StatusItemProps = {
  tableName: string;
  displayName: string;
  isConnected: boolean;
  lastUpdate: any | null;
};

const StatusItem = ({ tableName, displayName, isConnected, lastUpdate }: StatusItemProps) => {
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

interface TableStatus {
  table: RealtimeTable;
  displayName: string;
  isConnected: boolean;
  lastUpdate: any | null;
}

export function RealtimeStatus() {
  const { toast } = useToast();
  const [isReconnecting, setIsReconnecting] = useState(false);
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
  
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>(
    tablesToMonitor.map(item => ({
      table: item.table,
      displayName: item.displayName,
      isConnected: false,
      lastUpdate: null
    }))
  );
  
  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const channel = resetAndReconnectRealtime();
      if (channel) {
        toast({
          title: "Reconnection Successful",
          description: "Realtime connections have been refreshed.",
        });
        
        // Wait a moment for connections to establish
        setTimeout(() => setIsReconnecting(false), 2000);
      } else {
        toast({
          title: "Reconnection Failed",
          description: "Failed to reconnect to realtime channels.",
          variant: "destructive"
        });
        setIsReconnecting(false);
      }
    } catch (error) {
      console.error('Error reconnecting:', error);
      toast({
        title: "Reconnection Error",
        description: "An unexpected error occurred during reconnection.",
        variant: "destructive"
      });
      setIsReconnecting(false);
    }
  };

  tablesToMonitor.forEach((tableInfo, index) => {
    const { isConnected, lastUpdate } = useSupabaseRealtime(tableInfo.table);
    
    useEffect(() => {
      setTableStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[index] = {
          ...newStatuses[index],
          isConnected,
          lastUpdate
        };
        return newStatuses;
      });
    }, [isConnected, lastUpdate]);
  });
  
  const connectionCount = tableStatuses.filter(status => status.isConnected).length;
  const totalConnections = tableStatuses.length;
  
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
              key={item.table}
              tableName={item.table}
              displayName={item.displayName}
              isConnected={item.isConnected}
              lastUpdate={item.lastUpdate}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-3 border-t">
        <div className="text-sm text-muted-foreground">
          {connectionCount} of {totalConnections} connections active
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReconnect}
          disabled={isReconnecting} 
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
          {isReconnecting ? 'Reconnecting...' : 'Reconnect All'}
        </Button>
      </CardFooter>
    </Card>
  );
}
