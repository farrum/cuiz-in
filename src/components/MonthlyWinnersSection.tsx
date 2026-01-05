import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Star, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { STORAGE_KEYS } from '@/utils/quizData';

interface MonthlyWinner {
  username: string;
  points: number;
  isCurrentUser: boolean;
  rank: number;
}

interface MonthlyWinnersSectionProps {
  className?: string;
  limit?: number;
}

const MonthlyWinnersSection: React.FC<MonthlyWinnersSectionProps> = ({ 
  className = "", 
  limit = 5
}) => {
  const [winners, setWinners] = useState<MonthlyWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('');
  
  const currentUserId = useMemo(() => localStorage.getItem(STORAGE_KEYS.USER_ID), []);

  const fetchMonthlyWinners = useCallback(async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      setCurrentMonth(`${monthNames[now.getMonth()]} ${now.getFullYear()}`);
      
      // Fetch monthly points with user info
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('monthly_points')
        .select('user_id, points')
        .eq('month', monthKey)
        .order('points', { ascending: false })
        .limit(limit);

      if (monthlyError) throw monthlyError;

      if (!monthlyData || monthlyData.length === 0) {
        setWinners([]);
        return;
      }

      // Get usernames for top monthly earners
      const userIds = monthlyData.map(mp => mp.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Create username lookup map
      const usernameMap = new Map(profileData?.map(p => [p.id, p.username]) || []);

      // Format winners data
      const formattedWinners: MonthlyWinner[] = monthlyData.map((mp, index) => ({
        username: usernameMap.get(mp.user_id) || 'Unknown',
        points: Number(mp.points || 0),
        isCurrentUser: mp.user_id === currentUserId,
        rank: index + 1
      }));

      setWinners(formattedWinners);
    } catch (error) {
      console.error('Error fetching monthly winners:', error);
    } finally {
      setLoading(false);
    }
  }, [limit, currentUserId]);

  useEffect(() => {
    fetchMonthlyWinners();
    
    const handlePointsUpdate = () => {
      fetchMonthlyWinners();
    };
    
    window.addEventListener('pointsUpdated', handlePointsUpdate);
    
    // Refresh every 5 minutes
    const intervalId = setInterval(fetchMonthlyWinners, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener('pointsUpdated', handlePointsUpdate);
      clearInterval(intervalId);
    };
  }, [fetchMonthlyWinners]);

  const getRankIcon = useCallback((rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Star className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Star className="h-5 w-5 text-amber-700" />;
      default:
        return <Sparkles className="h-4 w-4 text-primary/60" />;
    }
  }, []);

  const getRankBadge = useCallback((rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">🥇 1st</Badge>;
      case 2:
        return <Badge className="bg-gray-400/20 text-gray-600 border-gray-400/30">🥈 2nd</Badge>;
      case 3:
        return <Badge className="bg-amber-700/20 text-amber-700 border-amber-700/30">🥉 3rd</Badge>;
      default:
        return <Badge variant="outline">#{rank}</Badge>;
    }
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-md flex items-center">
            <Crown className="mr-2 h-4 w-4 text-yellow-500" />
            <span>This Month's Winners</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-md flex items-center justify-between">
          <div className="flex items-center">
            <Crown className="mr-2 h-4 w-4 text-yellow-500" />
            <span>This Month's Winners</span>
          </div>
          <Badge variant="secondary" className="text-xs">{currentMonth}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {winners.length === 0 ? (
          <div className="text-muted-foreground text-center py-6">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary/40" />
            <p>No winners yet this month!</p>
            <p className="text-sm">Be the first to earn points</p>
          </div>
        ) : (
          <div className="space-y-2">
            {winners.map((winner, index) => (
              <div 
                key={winner.username}
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                  winner.isCurrentUser 
                    ? 'bg-primary/10 border border-primary/20' 
                    : winner.rank <= 3 
                      ? 'bg-gradient-to-r from-muted/50 to-transparent' 
                      : 'bg-card hover:bg-muted/30'
                }`}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    {getRankIcon(winner.rank)}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {winner.username}
                      {winner.isCurrentUser && (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">You</Badge>
                      )}
                    </div>
                    {winner.rank <= 3 && (
                      <div className="text-xs text-muted-foreground">
                        {winner.rank === 1 ? 'Leading this month!' : `${winner.points.toFixed(0)} points earned`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{winner.points.toFixed(0)}</span>
                  {getRankBadge(winner.rank)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(MonthlyWinnersSection);
