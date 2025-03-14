
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { STORAGE_KEYS } from '@/utils/quizData';

interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  position?: number;
  isCurrentUser?: boolean;
}

const LeaderboardSection: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);

    try {
      // For now we'll use localStorage to simulate a database
      // In a real app, we'd use Supabase to fetch this data
      const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
      
      // Get current user
      const currentUserName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
      
      // Sort users by points in descending order
      const sortedUsers = [...adminUsers]
        .sort((a, b) => b.points - a.points)
        .slice(0, 10) // Get top 10 users
        .map((user, index) => ({
          id: user.id,
          name: user.name,
          points: user.points || 0,
          position: index + 1,
          isCurrentUser: user.name === currentUserName
        }));
      
      // Find current user's rank if they're not in top 10
      const currentUserPos = sortedUsers.findIndex(user => user.isCurrentUser);
      if (currentUserPos !== -1) {
        setCurrentUserRank(currentUserPos + 1);
      } else {
        // Find user's position in full list
        const allUsers = [...adminUsers]
          .sort((a, b) => b.points - a.points);
        
        const userPos = allUsers.findIndex(user => user.name === currentUserName);
        if (userPos !== -1) {
          setCurrentUserRank(userPos + 1);
        }
      }
      
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center space-x-3 mb-4">
        <div className="bg-primary/10 p-2 rounded-full">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-medium">Top Quiz Players</h3>
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
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${getPositionClass(user.position!, user.isCurrentUser)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      {getPositionIcon(user.position!)}
                    </div>
                    <div>
                      <div className="font-medium">
                        {user.name} 
                        {user.isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(You)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{user.points}</span>
                    <span className="text-xs text-muted-foreground">pts</span>
                    {user.position <= 3 && (
                      <Badge variant={user.position === 1 ? "default" : "secondary"} className="ml-2">
                        Top {user.position}
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
                        {Number(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || 0)}
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
