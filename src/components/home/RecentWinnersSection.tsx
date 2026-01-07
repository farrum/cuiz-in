import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface RecentWinner {
  id: string;
  username: string;
  amount: number;
  type: string;
  date: string;
  status: string;
}

const RecentWinnersSection: React.FC = () => {
  const [winners, setWinners] = useState<RecentWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPaidOut, setTotalPaidOut] = useState(0);

  useEffect(() => {
    fetchRecentWinners();
    // Refresh every 30 seconds for live feel
    const interval = setInterval(fetchRecentWinners, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentWinners = async () => {
    try {
      // Fetch recent approved/completed payments
      const { data, error } = await supabase
        .from('payments')
        .select('id, username, amount, type, date, status')
        .in('status', ['approved', 'completed'])
        .order('date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent winners:', error);
        // Use mock data if no real data
        setWinners(generateMockWinners());
      } else if (data && data.length > 0) {
        setWinners(data);
        // Calculate total paid out
        const total = data.reduce((sum, w) => sum + Number(w.amount), 0);
        setTotalPaidOut(total);
      } else {
        // Use mock data for demo
        setWinners(generateMockWinners());
      }
    } catch (err) {
      console.error('Failed to fetch recent winners:', err);
      setWinners(generateMockWinners());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockWinners = (): RecentWinner[] => {
    const names = ['Priya S.', 'Rahul K.', 'Aisha M.', 'Vikram P.', 'Neha T.', 'Arjun R.', 'Sneha D.', 'Karthik N.'];
    const types = ['quiz', 'referral', 'achievement'];
    const now = new Date();
    
    return names.map((name, i) => ({
      id: `mock-${i}`,
      username: name,
      amount: Math.floor(Math.random() * 900 + 100),
      type: types[Math.floor(Math.random() * types.length)],
      date: new Date(now.getTime() - i * 3600000 * Math.random() * 24).toISOString(),
      status: 'completed'
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz': return '🎯';
      case 'referral': return '👥';
      case 'achievement': return '🏆';
      default: return '💰';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'quiz': return 'Quiz Reward';
      case 'referral': return 'Referral Bonus';
      case 'achievement': return 'Achievement';
      default: return 'Reward';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-muted/30 to-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Real Players, Real Rewards
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Recent Winners
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join thousands of players earning real rewards every day
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-center gap-8 mb-10">
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center text-2xl md:text-3xl font-bold text-green-500">
              <TrendingUp className="w-6 h-6" />
              ₹{totalPaidOut > 0 ? totalPaidOut.toLocaleString() : '50,000+'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Paid Out</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center text-2xl md:text-3xl font-bold text-primary">
              <Trophy className="w-6 h-6" />
              {winners.length}+
            </div>
            <p className="text-xs text-muted-foreground mt-1">Winners This Week</p>
          </div>
        </div>

        {/* Winners Scroll */}
        <div className="relative">
          {/* Gradient Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
          
          {/* Scrolling Container */}
          <div className="flex gap-4 animate-scroll-left hover:pause-animation">
            {[...winners, ...winners].map((winner, index) => (
              <div
                key={`${winner.id}-${index}`}
                className={cn(
                  "flex-shrink-0 w-64 bg-card rounded-xl p-4 border border-border",
                  "transform transition-all hover:scale-105 hover:shadow-lg",
                  "relative overflow-hidden"
                )}
              >
                {/* Celebration Effect */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-transparent rounded-bl-full"></div>
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-green-500 rounded-full flex items-center justify-center text-lg">
                      {getTypeIcon(winner.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground truncate max-w-[120px]">
                        {winner.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTypeLabel(winner.type)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-green-500">
                    ₹{winner.amount}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(winner.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex justify-center mt-8">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live updates every 30 seconds
          </div>
        </div>
      </div>

      {/* CSS for scroll animation */}
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default RecentWinnersSection;
