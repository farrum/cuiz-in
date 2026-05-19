
import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardUser {
  userId: string;
  username: string;
  gems: number;
  rank: number;
  isCurrentUser?: boolean;
}

const LeaderboardSection: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchLeaderboard = async () => {
    setLoading(true);

    try {
      // Get current user
      const currentUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      console.log('Current user ID for leaderboard:', currentUserId);
      
      // Directly fetch top players from profiles table
      const { data: topUsers, error } = await supabase
        .from('profiles')
        .select('id, username, gems')
        .order('gems', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('Error fetching top performers:', error);
        throw error;
      }
      
      if (!topUsers || topUsers.length === 0) {
        console.log('No top users found');
        setUsers([]);
        setLoading(false);
        return;
      }
      
      console.log('Top users from profiles:', topUsers);
      
      // Process users with rankings
      const processedUsers = topUsers.map((user, index) => ({
        userId: user.id,
        username: user.username,
        gems: Number(user.gems || 0),
        rank: index + 1,
        isCurrentUser: user.id === currentUserId
      }));
      
      setUsers(processedUsers);
      
      // Check if current user is in top 10
      const currentUserInTop10 = processedUsers.find(user => user.isCurrentUser);
      
      // If not, find their rank and add them separately
      if (!currentUserInTop10 && currentUserId) {
        // Count how many users have more gems
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gt('gems', parseFloat(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || '0'));
          
        if (countError) {
          console.error('Error counting higher ranked users:', countError);
        } else if (count !== null) {
          setCurrentUserRank(count + 1);
          console.log('Current user rank:', count + 1);
        }
      } else if (currentUserInTop10) {
        setCurrentUserRank(currentUserInTop10.rank);
        console.log('Current user is in top 10, rank:', currentUserInTop10.rank);
      }
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
      
      // Fallback to in-memory data if needed
      toast({
        title: "Connection issue",
        description: "Using cached leaderboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Set up listener for point updates
    window.addEventListener('gemsUpdated', fetchLeaderboard);
    return () => {
      window.removeEventListener('gemsUpdated', fetchLeaderboard);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="w-5 h-5 inline-flex items-center justify-center text-muted-foreground">{position}</span>;
    }
  };

  const getPositionClass = (position: number, isCurrentUser: boolean = false) => {
    if (isCurrentUser) return "bg-primary/10";
    
    switch (position) {
      case 1:
        return "bg-yellow-50 dark:bg-yellow-950/30";
      case 2:
        return "bg-gray-50 dark:bg-gray-900/30";
      case 3:
        return "bg-amber-50 dark:bg-amber-950/30";
      default:
        return "";
    }
  };

  return (
    <div className="glass rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-medium">Top Quiz Players</h3>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing || loading}
          className="h-8 px-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 bg-secondary w-28 rounded mb-3"></div>
            <div className="h-20 bg-secondary w-full rounded"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {users.length > 0 ? (
            <>
              {users.map((user) => (
                <div 
                  key={user.userId}
                  className={`flex items-center justify-between p-3 rounded-lg ${getPositionClass(user.rank, user.isCurrentUser)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      {getPositionIcon(user.rank)}
                    </div>
                    <div>
                      <div className="font-medium">
                        {user.username} 
                        {user.isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(You)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{user.gems.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">pts</span>
                    {user.rank <= 3 && (
                      <Badge variant={user.rank === 1 ? "default" : "secondary"} className="ml-2">
                        Top {user.rank}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {currentUserRank && currentUserRank > 10 && (
                <>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-dashed"></span>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-2 text-xs text-muted-foreground">
                        {currentUserRank - 10} more players
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                        <span className="w-5 h-5 inline-flex items-center justify-center text-primary">{currentUserRank}</span>
                      </div>
                      <div className="font-medium">
                        {localStorage.getItem(STORAGE_KEYS.USER_NAME)} 
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {parseFloat(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || '0').toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No users available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardSection;
