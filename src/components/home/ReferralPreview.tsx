import React, { useState, useEffect } from 'react';
import { Users, Gift, Copy, Share2, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
}

const ReferralPreview: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const storedName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    
    setIsLoggedIn(!!userId);
    if (storedName) setUserName(storedName);
    
    if (userId) {
      fetchReferralStats(userId);
    }
  }, []);

  const fetchReferralStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select('status, earnings')
        .eq('referrer_id', userId);

      if (error) {
        console.error('Error fetching referral stats:', error);
        return;
      }

      if (data) {
        const totalReferrals = data.length;
        const activeReferrals = data.filter(r => r.status === 'active').length;
        const totalEarned = data.reduce((sum, r) => sum + (Number(r.earnings) || 0), 0);
        
        setStats({ totalReferrals, activeReferrals, totalEarned });
      }
    } catch (err) {
      console.error('Failed to fetch referral stats:', err);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${userName}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    
    toast({
      title: "Link Copied!",
      description: "Share this link with friends to earn rewards",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralLink = async () => {
    const link = `${window.location.origin}/register?ref=${userName}`;
    const shareData = {
      title: 'Join CuizIN - Play Fun Quizzes!',
      text: 'Hey! Join me on CuizIN and test your knowledge with fun quizzes. Use my referral link to get started!',
      url: link
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const benefits = [
    { icon: '⭐', text: '500 bonus points per active referral' },
    { icon: '👥', text: 'Become Team Leader with 10+ referrals' },
    { icon: '🔄', text: 'Recurring monthly bonus points' }
  ];

  return (
    <div className="bg-gradient-to-br from-purple-500/10 via-card to-blue-500/10 rounded-2xl p-6 border border-purple-500/20 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Invite Friends</h3>
            <p className="text-sm text-muted-foreground">Share with friends, play together!</p>
          </div>
        </div>
        
        {isLoggedIn && stats.totalReferrals > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-500">{stats.totalReferrals}</div>
            <div className="text-xs text-muted-foreground">referrals</div>
          </div>
        )}
      </div>

      {isLoggedIn ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.totalReferrals}</div>
              <div className="text-xs text-muted-foreground">Friends Invited</div>
            </div>
            <div className="bg-background/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-500">{stats.activeReferrals}</div>
              <div className="text-xs text-muted-foreground">Active Players</div>
            </div>
          </div>

          {/* Referral Link Actions */}
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={copyReferralLink}
              variant="outline"
              className="flex-1"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button 
              onClick={shareReferralLink}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Team Leader Progress */}
          {stats.activeReferrals < 10 && (
            <div className="bg-purple-500/10 rounded-lg p-3">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">Progress to Team Leader</span>
                <span className="font-medium text-purple-500">{stats.activeReferrals}/10</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${(stats.activeReferrals / 10) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                🎯 {10 - stats.activeReferrals} more active referrals to unlock Team Leader!
              </p>
            </div>
          )}

          {stats.activeReferrals >= 10 && (
            <Button 
              onClick={() => navigate('/team-dashboard')}
              variant="outline"
              className="w-full border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
            >
              View Team Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </>
      ) : (
        <>
          {/* Benefits for non-logged in users */}
          <div className="space-y-3 mb-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg bg-background/50",
                  "transform transition-all hover:scale-[1.02]"
                )}
              >
                <span className="text-xl">{benefit.icon}</span>
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          <Button 
            onClick={() => navigate('/register')}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Gift className="w-4 h-4 mr-2" />
            Sign Up to Start Earning
          </Button>
        </>
      )}
    </div>
  );
};

export default ReferralPreview;
