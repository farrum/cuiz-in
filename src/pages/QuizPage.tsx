import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import QuizCard from '@/components/QuizCard';
import PointsDisplay from '@/components/PointsDisplay';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { 
  STORAGE_KEYS, 
  QuizQuestion, 
  getRandomQuestion, 
  calculatePoints,
  logPointsForDay,
  logPointsForMonth,
  DAILY_TARGET,
  getPointsForToday,
  getPointsForMonth,
  MONTHLY_TARGET,
  syncAdSlotsToLocal
} from '@/utils/quizData';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  
  useEffect(() => {
    const savedPoints = parseInt(localStorage.getItem(STORAGE_KEYS.USER_POINTS) || '0');
    setUserPoints(savedPoints);
    
    const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
    setQuestionsAnswered(completedQuestions.length);
    
    const loadPoints = async () => {
      const userId = user?.id;
      const dailyPts = await getPointsForToday(userId);
      const monthlyPts = await getPointsForMonth(userId);
      setDailyPoints(dailyPts);
      setMonthlyPoints(monthlyPts);
    };
    loadPoints();
    
    if (!adsSynced) {
      syncAdSlotsToLocal().then(() => {
        setAdsSynced(true);
      });
    }
    
    loadNewQuestion();
  }, [user]);
  
  const loadNewQuestion = () => {
    setIsLoading(true);
    
    setTimeout(async () => {
      const question = await getRandomQuestion();
      setCurrentQuestion(question);
      setIsLoading(false);
    }, 600);
  };
  
  const handleQuestionComplete = async (isCorrect: boolean) => {
    const pointsEarned = calculatePoints(isCorrect);
    
    const newTotal = userPoints + pointsEarned;
    setUserPoints(newTotal);
    localStorage.setItem(STORAGE_KEYS.USER_POINTS, newTotal.toString());
    
    const userId = user?.id;
    await logPointsForDay(pointsEarned.toString(), userId);
    await logPointsForMonth(pointsEarned.toString(), userId);
    
    const updatedDailyPoints = await getPointsForToday(userId);
    const updatedMonthlyPoints = await getPointsForMonth(userId);
    setDailyPoints(updatedDailyPoints);
    setMonthlyPoints(updatedMonthlyPoints);
    
    if (updatedDailyPoints >= DAILY_TARGET && dailyPoints < DAILY_TARGET) {
      toast({
        title: "Daily Target Achieved!",
        description: "Congratulations! You've reached your daily target of 400 points.",
      });
    }
    
    if (updatedMonthlyPoints >= MONTHLY_TARGET && monthlyPoints < MONTHLY_TARGET) {
      toast({
        title: "Monthly Target Achieved!",
        description: "Amazing! You've reached your monthly target of 12,000 points. ₹8,000 reward is available for withdrawal!",
      });
    }
    
    window.dispatchEvent(new Event('pointsUpdated'));
    
    setQuestionsAnswered(prev => prev + 1);
    
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      if (newStreak % 5 === 0) {
        const bonusPoints = 20;
        const bonusTotal = newTotal + bonusPoints;
        
        setUserPoints(bonusTotal);
        localStorage.setItem(STORAGE_KEYS.USER_POINTS, bonusTotal.toString());
        await logPointsForDay(bonusPoints.toString(), userId);
        await logPointsForMonth(bonusPoints.toString(), userId);
        window.dispatchEvent(new Event('pointsUpdated'));
        
        toast({
          title: `${newStreak} Question Streak!`,
          description: `Bonus ${bonusPoints} points awarded!`,
        });
      }
    } else {
      setStreak(0);
    }
    
    loadNewQuestion();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
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
              style={{ width: `${Math.min((questionsAnswered % 10) * 10, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {10 - (questionsAnswered % 10)} more questions until next milestone
          </div>
        </div>
        
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
        
        <AdvertisementBanner position="bottom" />
      </main>
    </div>
  );
};

export default QuizPage;
