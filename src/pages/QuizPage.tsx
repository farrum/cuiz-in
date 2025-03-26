import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuizCard from '@/components/QuizCard';
import PointsDisplay from '@/components/PointsDisplay';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import NewsTicker from '@/components/NewsTicker';
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
import MotivationalCharacter from '@/components/MotivationalCharacter';
import { getAllBadges } from '@/utils/badgeData';

const QuizPage: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [streak, setStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [dailyPoints, setDailyPoints] = useState(0);
  const [monthlyPoints, setMonthlyPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [adsSynced, setAdsSynced] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [nextBadgeThreshold, setNextBadgeThreshold] = useState(10);
  const { toast } = useToast();
  
  useEffect(() => {
    const savedPoints = parseFloat(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setUserPoints(savedPoints);
    
    const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
    setQuestionsAnswered(completedQuestions.length);
    
    if (!adsSynced) {
      syncAdSlotsToLocal().then(() => {
        setAdsSynced(true);
      });
    }
    
    loadNewQuestion();
    fetchPoints();
    updateNextBadgeThreshold(completedQuestions.length);
  }, []);
  
  const updateNextBadgeThreshold = (currentAnsweredCount: number) => {
    const allBadges = getAllBadges();
    
    // Filter to question-based badges
    const questionBadges = allBadges.filter(
      badge => badge.criteria.type === 'questions_answered'
    ).sort((a, b) => a.criteria.threshold - b.criteria.threshold);
    
    // Find the next badge threshold
    for (const badge of questionBadges) {
      if (badge.criteria.threshold > currentAnsweredCount) {
        setNextBadgeThreshold(badge.criteria.threshold);
        return;
      }
    }
    
    // If all badges are earned, use the highest threshold + 10
    if (questionBadges.length > 0) {
      const highestThreshold = Math.max(
        ...questionBadges.map(badge => badge.criteria.threshold)
      );
      setNextBadgeThreshold(highestThreshold + 10);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('ad_tracking_session_id')) {
      const sessionId = crypto.randomUUID ? crypto.randomUUID() : 
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('ad_tracking_session_id', sessionId);
    }
  }, []);
  
  const fetchPoints = async () => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) return;
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    try {
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
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
        
      if (profileData) {
        setUserPoints(Number(profileData.points));
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, profileData.points.toString());
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };
  
  const loadNewQuestion = async () => {
    setIsLoading(true);
    
    try {
      const question = await getRandomQuestion();
      setCurrentQuestion(question);
    } catch (error) {
      console.error('Error loading question:', error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    }
  };
  
  const handleQuestionComplete = (isCorrect: boolean) => {
    if (!currentQuestion) return;
    
    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);
    updateNextBadgeThreshold(newQuestionsAnswered);
    
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
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
    
    setTimeout(() => {
      fetchPoints();
      window.dispatchEvent(new Event('pointsUpdated'));
    }, 1000);
    
    loadNewQuestion();
  };

  useEffect(() => {
    if (questionsAnswered > 0 && questionsAnswered % 3 === 0) {
      setShowMotivation(true);
      
      const motivationalMessages = [
        "You're doing great! Keep going!",
        "Your brain is getting stronger with every question!",
        "You're on a roll! Can you answer a few more?",
        "Learning is an adventure, and you're acing it!",
        "Keep up this momentum! You're amazing!"
      ];
      
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setMotivationMessage(randomMessage);
      
      setTimeout(() => {
        setShowMotivation(false);
      }, 5000);
    }
  }, [questionsAnswered]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
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
        
        <div className="glass rounded-2xl p-4 mb-8">
          <h4 className="text-sm font-medium mb-3">Daily Target: {dailyPoints.toFixed(1)} / {DAILY_TARGET} points</h4>
          <Progress value={(dailyPoints / DAILY_TARGET) * 100} className="h-2 mb-4" />
          
          <h4 className="text-sm font-medium mb-3">Monthly Target: {monthlyPoints.toFixed(1)} / {MONTHLY_TARGET} points</h4>
          <Progress value={(monthlyPoints / MONTHLY_TARGET) * 100} className="h-2" />
          
          <div className="mt-3 text-xs text-muted-foreground">
            Complete the monthly target to earn ₹8,000 reward!
          </div>
        </div>
        
        <AdvertisementBanner position="middle" size="small" />
        
        <div className="mb-6 mt-6">
          <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mb-2">
            <div 
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000"
              style={{ width: `${Math.min(((questionsAnswered % nextBadgeThreshold) / nextBadgeThreshold) * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {nextBadgeThreshold - (questionsAnswered % nextBadgeThreshold)} more questions until next milestone
          </div>
        </div>
        
        {showMotivation && (
          <div className="flex justify-center my-4">
            <MotivationalCharacter 
              mood="happy" 
              message={motivationMessage}
              showMessage={true}
            />
          </div>
        )}
        
        <AdvertisementBanner position="middle" />
        
        {isLoading ? (
          <div className="quiz-card animate-pulse flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading next question...</p>
            </div>
          </div>
        ) : currentQuestion ? (
          <div className="relative">
            <div className="absolute -top-16 -right-10 z-10 transform scale-75">
              <MotivationalCharacter 
                mood="neutral"
                showMessage={false}
              />
            </div>
            <QuizCard
              question={currentQuestion}
              onComplete={handleQuestionComplete}
            />
          </div>
        ) : (
          <div className="quiz-card text-center">
            <p>No questions available. Please try again later.</p>
          </div>
        )}
        
        <AdvertisementBanner position="bottom" />
      </main>
      
      <Footer />
    </div>
  );
};

export default QuizPage;
