import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import PointsDisplay from '@/components/PointsDisplay';
import ReferralSection from '@/components/ReferralSection';
import WithdrawalSection from '@/components/WithdrawalSection';
import LeaderboardSection from '@/components/LeaderboardSection';
import BadgesSection from '@/components/BadgesSection';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { STORAGE_KEYS, DAILY_TARGET, MONTHLY_TARGET } from '@/utils/quizData';
import { checkAndAwardBadges } from '@/utils/badgeData';
import { UserCog, LogOut, Wallet, Copy, Target, Award, Calendar, Trophy, Medal, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface Achievement {
  id: string;
  type: string;
  month: string;
  reward: number;
  date: string;
  claimed: boolean;
}

interface ReferrerInfo {
  id: string;
  username: string;
  date: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [userUpi, setUserUpi] = useState('');
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [dailyPoints, setDailyPoints] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userId, setUserId] = useState('');
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const userIdFromStorage = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const name = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    if (!name) {
      navigate('/');
      return;
    }
    
    setUserName(name);
    
    let finalUserId = userIdFromStorage || '';
    
    if (userIdFromStorage) {
      setUserId(userIdFromStorage);
      fetchReferrerInfo(userIdFromStorage);
    } else {
      const generatedUserId = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36).slice(-4);
      setUserId(generatedUserId);
      finalUserId = generatedUserId;
    }
    
    const upiId = localStorage.getItem('quiz_app_user_upi');
    setUserUpi(upiId || '');
    
    const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
    setQuestionsAnswered(completedQuestions.length);
    
    const savedAchievements = JSON.parse(localStorage.getItem('quiz_app_achievements') || '[]');
    const filteredAchievements = getRecentAchievements(savedAchievements);
    setAchievements(filteredAchievements);
    
    checkAndAwardBadges(finalUserId);
    
    fetchProgressData(finalUserId);
    
    const handlePointsUpdate = () => {
      fetchProgressData(finalUserId);
      
      const updatedAchievements = JSON.parse(localStorage.getItem('quiz_app_achievements') || '[]');
      const filteredUpdatedAchievements = getRecentAchievements(updatedAchievements);
      setAchievements(filteredUpdatedAchievements);
      
      checkAndAwardBadges(finalUserId);
    };
    
    window.addEventListener('pointsUpdated', handlePointsUpdate);
    setIsLoading(false);
    
    return () => window.removeEventListener('pointsUpdated', handlePointsUpdate);
  }, [navigate]);
  
  const getRecentAchievements = (allAchievements: Achievement[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return allAchievements.filter(achievement => {
      const [year, month] = achievement.month.split('-').map(n => parseInt(n));
      
      const monthsDiff = (currentYear - year) * 12 + (currentMonth - (month - 1));
      
      return monthsDiff >= 0 && monthsDiff <= 3;
    });
  };
  
  const fetchProgressData = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const { data: dailyData } = await supabase
        .from('daily_points')
        .select('points')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
        
      if (dailyData) {
        setDailyPoints(Number(dailyData.points));
      } else {
        setDailyPoints(0);
      }
      
      const { data: monthlyData } = await supabase
        .from('monthly_points')
        .select('points')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .maybeSingle();
        
      if (monthlyData) {
        setMonthlyPoints(Number(monthlyData.points));
      } else {
        setMonthlyPoints(0);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    }
  };
  
  const fetchReferrerInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select('referrer_id, referrer_name, date')
        .eq('referred_id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching referrer info:', error);
        return;
      }
      
      if (data) {
        setReferrer({
          id: data.referrer_id,
          username: data.referrer_name,
          date: data.date
        });
      }
    } catch (err) {
      console.error('Failed to fetch referrer info:', err);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem('quiz_app_user_email');
    localStorage.removeItem('quiz_app_user_phone');
    localStorage.removeItem('quiz_app_user_upi');
    
    navigate('/');
    
    toast({
      title: "Logged Out",
      description: "Your progress is saved. See you again soon!",
    });
  };
  
  const copyUpiId = () => {
    if (userUpi) {
      navigator.clipboard.writeText(userUpi);
      toast({
        title: "UPI ID Copied",
        description: "Your UPI ID has been copied to clipboard.",
      });
    }
  };
  
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <AdvertisementBanner position="top" size="medium" className="mb-6" />
            
            <div className="glass p-6 rounded-2xl mb-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <div className="flex-shrink-0 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-semibold">
                {userName.substring(0, 1).toUpperCase()}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold mb-1">{userName}</h1>
                <p className="text-muted-foreground mb-4">
                  Joined {new Date().toLocaleDateString()}
                </p>
                
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  <div className="bg-secondary px-3 py-1 rounded-full text-sm">
                    {questionsAnswered} questions answered
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm animate-pulse-soft">
                    Active Player
                  </div>
                </div>
                
                {referrer && (
                  <div className="mt-3 flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-2 rounded-md">
                    <UserCheck className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      Referred by <span className="font-medium">{referrer.username}</span>
                      {referrer.date && (
                        <span className="ml-1 opacity-70">on {new Date(referrer.date).toLocaleDateString()}</span>
                      )}
                    </span>
                  </div>
                )}
                
                {userUpi && (
                  <div className="mt-4 flex items-center bg-secondary/50 px-3 py-2 rounded-md inline-flex">
                    <Wallet className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium mr-2">UPI ID: {userUpi}</span>
                    <button 
                      onClick={copyUpiId}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Copy UPI ID"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout} 
                className="flex-shrink-0"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
            
            <div className="glass rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium">Progress Targets</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Daily Target</h4>
                    <span className="text-sm font-bold">{dailyPoints.toFixed(1)} / {DAILY_TARGET} points</span>
                  </div>
                  <Progress value={(dailyPoints / DAILY_TARGET) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Every correct answer: +2 points, Every incorrect answer: +0.5 points
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Monthly Target</h4>
                    <span className="text-sm font-bold">{monthlyPoints.toFixed(1)} / {MONTHLY_TARGET} points</span>
                  </div>
                  <Progress value={(monthlyPoints / MONTHLY_TARGET) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete the monthly target to earn ₹8,000 reward!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <PointsDisplay animateUpdate />
              
              <div className="glass rounded-2xl p-4 col-span-2">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="bg-secondary p-2 rounded-full">
                    <UserCog className="w-4 h-4" />
                  </div>
                  <h3 className="font-medium">Account Summary</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="bg-secondary p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Questions</div>
                    <div className="text-2xl font-bold">{questionsAnswered}</div>
                  </div>
                  
                  <div className="bg-secondary p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Referral Bonus</div>
                    <div className="text-2xl font-bold">
                      {JSON.parse(localStorage.getItem(STORAGE_KEYS.REFERRALS) || '[]').filter(
                        (r: any) => r.status === 'completed'
                      ).length * 20} pts
                    </div>
                  </div>
                  
                  <div className="bg-secondary p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Withdrawals</div>
                    <div className="text-2xl font-bold">
                      ₹{(JSON.parse(localStorage.getItem('quiz_app_withdrawals') || '[]')
                        .filter((w: any) => w.status === 'completed')
                        .reduce((acc: number, curr: any) => acc + curr.amount, 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <AdvertisementBanner position="middle" size="large" className="mb-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <LeaderboardSection />
              
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Medal className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-medium">Your Badges</h3>
                </div>
                
                <BadgesSection userId={userId} limit={4} />
              </div>
            </div>
            
            {achievements.length > 0 && (
              <div className="glass rounded-2xl p-6 mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-medium">Recent Achievements</h3>
                </div>
                
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="bg-secondary/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-4 p-2 bg-primary/10 rounded-full">
                            <Calendar className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">Monthly Target Completed</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatMonth(achievement.month)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">₹{achievement.reward.toFixed(2)}</div>
                          <div className="text-xs">
                            {achievement.claimed ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Claimed</span>
                            ) : (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Available</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Tabs defaultValue="badges" className="w-full animate-fade-in">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="badges">All Badges</TabsTrigger>
                <TabsTrigger value="referrals">Referrals & Earnings</TabsTrigger>
                <TabsTrigger value="withdraw">Withdraw Funds</TabsTrigger>
              </TabsList>
              
              <TabsContent value="badges" className="animate-fade-in">
                <div className="glass rounded-2xl p-6">
                  <BadgesSection userId={userId} showProgress={true} />
                </div>
              </TabsContent>
              
              <TabsContent value="referrals" className="animate-fade-in">
                <ReferralSection />
              </TabsContent>
              
              <TabsContent value="withdraw" className="animate-fade-in">
                <WithdrawalSection />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default Profile;
