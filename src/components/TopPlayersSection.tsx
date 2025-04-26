
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { STORAGE_KEYS } from '@/utils/quizData';

interface TopPlayer {
  username: string;
  points: number;
  isCurrentUser: boolean;
}

interface TopPlayersSectionProps {
  className?: string;
  limit?: number;
  showMonthlyComparison?: boolean;
}

const TopPlayersSection: React.FC<TopPlayersSectionProps> = ({ 
  className = "", 
  limit = 3,
  showMonthlyComparison = false
}) => {
  const [players, setPlayers] = useState<TopPlayer[]>([]);
  const [currentUserMonthlyPoints, setCurrentUserMonthlyPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Get current user from localStorage once
  const currentUserId = useMemo(() => localStorage.getItem(STORAGE_KEYS.USER_ID), []);
  const currentUsername = useMemo(() => localStorage.getItem(STORAGE_KEYS.USER_NAME), []);

  // Check if user is logged in
  useEffect(() => {
    setIsLoggedIn(!!currentUserId && !!currentUsername);
  }, [currentUserId, currentUsername]);

  // Optimize data fetching with useCallback
  const fetchTopPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, points')
        .order('points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const formattedPlayers = data.map(player => ({
        username: player.username,
        points: Number(player.points || 0),
        isCurrentUser: player.id === currentUserId
      }));

      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Error fetching top players:', error);
    } finally {
      setLoading(false);
    }
  }, [limit, currentUserId]);

  // Optimize monthly points fetching
  const fetchCurrentUserMonthlyPoints = useCallback(async () => {
    if (!currentUserId) {
      setCurrentUserMonthlyPoints(null);
      return;
    }

    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const { data, error } = await supabase
        .from('monthly_points')
        .select('points')
        .eq('user_id', currentUserId)
        .eq('month', currentMonth)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const pointsValue = Number(data.points);
        setCurrentUserMonthlyPoints(pointsValue);
        
        // Update localStorage for consistency across components
        const monthKey = `monthly_points_${now.getFullYear()}_${now.getMonth()}`;
        localStorage.setItem(monthKey, pointsValue.toString());
      } else {
        setCurrentUserMonthlyPoints(0);
      }
    } catch (error) {
      console.error('Error fetching monthly points:', error);
      setCurrentUserMonthlyPoints(0);
    }
  }, [currentUserId]);

  // Only fetch data when needed and use Promise.all for parallel queries
  useEffect(() => {
    const fetchData = async () => {
      const promises = [fetchTopPlayers()];
      
      if (showMonthlyComparison && isLoggedIn) {
        promises.push(fetchCurrentUserMonthlyPoints());
      }
      
      await Promise.all(promises);
    };
    
    fetchData();
    
    // Listen for points updates to refresh data
    const handlePointsUpdate = () => {
      console.log('Points update detected in TopPlayersSection');
      fetchData();
    };
    
    window.addEventListener('pointsUpdated', handlePointsUpdate);
    
    // Refresh leaderboard every 5 minutes instead of on every render
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate);
      clearInterval(intervalId);
    };
  }, [fetchTopPlayers, fetchCurrentUserMonthlyPoints, showMonthlyComparison, isLoggedIn]);

  // Memoize player icon function to prevent recreating on each render
  const getPlayerIcon = useCallback((index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="w-5 h-5 inline-flex items-center justify-center">{index + 1}</span>;
    }
  }, []);

  // Calculate the next month for the monthly reset message
  const getNextMonthReset = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const nextMonth = (currentMonth + 1) % 12;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[nextMonth]} 1`;
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-md flex items-center">
            <Trophy className="mr-2 h-4 w-4" />
            <span>Top Players</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-md flex items-center">
          <Trophy className="mr-2 h-4 w-4" />
          <span>Top Players</span>
          {showMonthlyComparison && (
            <Badge variant="outline" className="ml-2 text-xs">Monthly Reset: {getNextMonthReset()}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {players.length === 0 ? (
          <div className="text-muted-foreground text-center py-3">No data available</div>
        ) : (
          <div className="space-y-2">
            {players.map((player, index) => (
              <div 
                key={player.username} 
                className={`flex items-center justify-between p-2 rounded ${
                  player.isCurrentUser ? 'bg-primary/10' : 'bg-card'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getPlayerIcon(index)}
                  <span className="font-medium">
                    {player.username}
                    {player.isCurrentUser && (
                      <span className="ml-1 text-xs text-primary">(You)</span>
                    )}
                  </span>
                </div>
                <div className="font-semibold">{player.points.toFixed(1)}</div>
              </div>
            ))}

            {showMonthlyComparison && isLoggedIn && currentUserMonthlyPoints !== null && !players.find(p => p.isCurrentUser) && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Your monthly points:</div>
                  <div className="font-semibold">{currentUserMonthlyPoints.toFixed(1)}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {currentUsername || 'You'} {currentUserMonthlyPoints > 0 ? 'have' : 'have not'} earned 
                  {currentUserMonthlyPoints > 0 ? ` ${currentUserMonthlyPoints.toFixed(1)} ` : ' any '} 
                  points this month
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(TopPlayersSection);
