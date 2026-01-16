import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Star, Sparkles, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { STORAGE_KEYS } from '@/utils/quizData';

interface MonthlyWinner {
  username: string;
  points: number;
  isCurrentUser: boolean;
  rank: number;
  userId: string;
  profilePicture: string | null;
}

interface CurrentUserRank {
  rank: number;
  points: number;
  username: string;
  profilePicture: string | null;
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
  const [currentUserRank, setCurrentUserRank] = useState<CurrentUserRank | null>(null);
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
      
      // Fetch ALL monthly points to calculate current user's rank
      const { data: allMonthlyData, error: allMonthlyError } = await supabase
        .from('monthly_points')
        .select('user_id, points')
        .eq('month', monthKey)
        .order('points', { ascending: false });

      if (allMonthlyError) throw allMonthlyError;

      if (!allMonthlyData || allMonthlyData.length === 0) {
        setWinners([]);
        setCurrentUserRank(null);
        return;
      }

      // Get top N for display
      const topMonthlyData = allMonthlyData.slice(0, limit);
      
      // Find current user's position
      let userRankData: CurrentUserRank | null = null;
      const userInTop = topMonthlyData.some(mp => String(mp.user_id) === String(currentUserId));
      
      if (currentUserId && !userInTop) {
        const userIndex = allMonthlyData.findIndex(mp => String(mp.user_id) === String(currentUserId));
        if (userIndex !== -1) {
          const userData = allMonthlyData[userIndex];
          // Fetch user's profile for the rank display
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('username, profile_picture')
            .eq('id', currentUserId)
            .single();
          
          userRankData = {
            rank: userIndex + 1,
            points: Number(userData.points || 0),
            username: userProfile?.username || 'You',
            profilePicture: userProfile?.profile_picture || null
          };
        }
      }
      
      setCurrentUserRank(userRankData);

      // Get usernames and profile pictures for top monthly earners
      const userIds = topMonthlyData.map(mp => mp.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, profile_picture')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Create profile lookup map
      const profileMap = new Map<string, { username: string; profilePicture: string | null }>();
      profileData?.forEach(p => {
        if (p.id) {
          profileMap.set(String(p.id), {
            username: p.username || 'Anonymous Player',
            profilePicture: p.profile_picture || null
          });
        }
      });

      // Format winners data with proper string comparison
      const formattedWinners: MonthlyWinner[] = topMonthlyData.map((mp, index) => {
        const profile = profileMap.get(String(mp.user_id));
        return {
          username: profile?.username || 'Anonymous Player',
          profilePicture: profile?.profilePicture || null,
          points: Number(mp.points || 0),
          isCurrentUser: String(mp.user_id) === String(currentUserId),
          rank: index + 1,
          userId: String(mp.user_id)
        };
      });

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const WinnerRow = ({ winner, showDivider = false }: { winner: MonthlyWinner | CurrentUserRank & { isCurrentUser: boolean; userId?: string }; showDivider?: boolean }) => (
    <>
      {showDivider && (
        <div className="flex items-center gap-2 py-2">
          <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
          <span className="text-xs text-muted-foreground">Your Rank</span>
          <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
        </div>
      )}
      <div 
        className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
          winner.isCurrentUser 
            ? 'bg-primary/10 border border-primary/20' 
            : winner.rank <= 3 
              ? 'bg-gradient-to-r from-muted/50 to-transparent' 
              : 'bg-card hover:bg-muted/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
              <AvatarImage src={winner.profilePicture || undefined} alt={winner.username} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(winner.username)}
              </AvatarFallback>
            </Avatar>
            {winner.rank <= 3 && (
              <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-background shadow-sm">
                {getRankIcon(winner.rank)}
              </div>
            )}
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
    </>
  );

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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
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
            {winners.map((winner) => (
              <WinnerRow key={winner.userId} winner={winner} />
            ))}
            
            {/* Show current user's rank if not in top list */}
            {currentUserRank && (
              <WinnerRow 
                winner={{ 
                  ...currentUserRank, 
                  isCurrentUser: true 
                }} 
                showDivider 
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(MonthlyWinnersSection);
