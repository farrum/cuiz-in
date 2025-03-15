import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import QuizCard from '@/components/QuizCard';
import PointsDisplay from '@/components/PointsDisplay';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { 
  STORAGE_KEYS, 
  QuizQuestion, 
  getRandomQuestion,
  DAILY_TARGET,
  MONTHLY_TARGET,
  syncAdSlotsToLocal
} from '@/utils/quizData';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

const QuizPage: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [dailyPoints, setDailyPoints] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [adsSynced, setAdsSynced] = useState(false);
  const { toast } = useToast();
  
  // Initialize on first load
  useEffect(() => {
    // Load user points
    const savedPoints = parseFloat(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setUserPoints(savedPoints);
    
    // Get completed questions
    const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
    setQuestionsAnswered(completedQuestions.length);
    
    // Sync ad slots from Supabase
    if (!adsSynced) {
      syncAdSlotsToLocal().then(() => {
        setAdsSynced(true);
      });
    }
    
    // Get first question
    loadNewQuestion();
    
    // Fetch daily and monthly points
    fetchPoints();
  }, []);
  
  const fetchPoints = async () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) return;
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Fetch daily points
    try {
      const { data: dailyData } = await supabase
        .from('daily_points')
        .select('points')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
        
      if (dailyData) {
        setDailyPoints(Number(dailyData.points));
      }
      
      // Fetch monthly points
      const { data: monthlyData } = await supabase
        .from('monthly_points')
        .select('points')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .single();
        
      if (monthlyData) {
        setMonthlyPoints(Number(monthlyData.points));
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };
  
  const loadNewQuestion = async () => {
    setIsLoading(true);
    
    try {
      // Get a random question and then set it to state
      const question = await getRandomQuestion();
      setCurrentQuestion(question);
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      // Simulate loading delay for smoother transitions
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    }
  };
  
  const handleQuestionComplete = (isCorrect: boolean) => {
    if (!currentQuestion) return;
    
    // Update questions answered
    setQuestionsAnswered(prev => prev + 1);
    
    // Update streak
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Bonus for streaks
      if (newStreak % 5 === 0) {
        const bonusPoints = 5;
        toast({
          title: `${newStreak} Question Streak!`,
          description: `Bonus ${bonusPoints} points awarded!`,
        });
      }
    } else {
      setStreak(0);
    }
    
    // Wait a bit then fetch updated points data from Supabase
    setTimeout(() => {
      fetchPoints();
      
      // Dispatch event to notify other components about point updates
      window.dispatchEvent(new Event('pointsUpdated'));
    }, 1000);
    
    // Load the next question
    loadNewQuestion();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        {/* First Advertisement - Top */}
        <AdvertisementBanner position="top" />
        
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <PointsDisplay animateUpdate className="flex-1" />
          
          <div className="glass rounded-2xl p-4 flex-1">
            <div className="flex flex-col items-center">
              <h4 className="text-sm text-muted-foreground mb-1">Questions Answered</h4>
              <div className="text-3xl font-bold">{questionsAnswered}</div>
              
              {streak > 0 && (
                <div className="mt-2 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {streak} question streak!
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Daily & Monthly Target Progress */}
        <div className="glass rounded-2xl p-4 mb-8">
          <h4 className="text-sm font-medium mb-3">Daily Target: {dailyPoints.toFixed(1)} / {DAILY_TARGET} points</h4>
          <Progress value={(dailyPoints / DAILY_TARGET) * 100} className="h-2 mb-4" />
          
          <h4 className="text-sm font-medium mb-3">Monthly Target: {monthlyPoints.toFixed(1)} / {MONTHLY_TARGET} points</h4>
          <Progress value={(monthlyPoints / MONTHLY_TARGET) * 100} className="h-2" />
          
          <div className="mt-3 text-xs text-muted-foreground">
            Complete the monthly target to earn ₹8,000 reward!
          </div>
        </div>
        
        {/* Second Advertisement - After Stats */}
        <AdvertisementBanner position="middle" size="small" />
        
        <div className="mb-6 mt-6">
          <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mb-2">
            <div 
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000"
              style={{ width: `${Math.min((questionsAnswered % 10) * 10, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {10 - (questionsAnswered % 10)} more questions until next milestone
          </div>
        </div>
        
        {/* Third Advertisement - Before Question */}
        <AdvertisementBanner position="middle" />
        
        {isLoading ? (
          <div className="quiz-card animate-pulse flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading next question...</p>
            </div>
          </div>
        ) : currentQuestion ? (
          <QuizCard
            question={currentQuestion}
            onComplete={handleQuestionComplete}
          />
        ) : (
          <div className="quiz-card text-center">
            <p>No questions available. Please try again later.</p>
          </div>
        )}
        
        {/* Fourth Advertisement - Bottom */}
        <AdvertisementBanner position="bottom" />
      </main>
    </div>
  );
};

export default QuizPage;
