import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, QuizQuestion } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getRandomMessage } from '@/utils/funMessages';
import { Sparkles, Brain, ZapIcon, Timer, Award, Flame } from 'lucide-react';
import CountdownButton from './CountdownButton';

interface QuizCardProps {
  question: QuizQuestion;
  onComplete: (isCorrect: boolean, selectedAnswer: string) => void;
  pointsMultiplier?: number;
  isChallenge?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ 
  question, 
  onComplete, 
  pointsMultiplier = 1,
  isChallenge = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  const proceedToAnswerPage = async () => {
    if (!selectedOption) return;
    
    try {
      // Get user ID from local storage
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      // Check if the selected answer is correct
      const isCorrect = selectedOption === question.correctAnswer;
      
      // Track completed question in local storage - only for non-challenge questions
      if (!isChallenge) {
        const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
        completedQuestions.push(question.id);
        localStorage.setItem(STORAGE_KEYS.COMPLETED_QUESTIONS, JSON.stringify(completedQuestions));
        
        // Show a fun welcome message (only for regular quiz, not challenge)
        const welcomeMessage = getRandomMessage('welcome');
        toast({
          title: "Quiz Time! 🧠",
          description: welcomeMessage.text,
          variant: "default",
        });
      }
      
      // Record answer in Supabase if user is logged in
      if (userId) {
        // Calculate points based on difficulty
        let pointsEarned = 0;
        if (isCorrect) {
          switch (question.difficulty) {
            case "easy": pointsEarned = 2; break;
            case "medium": pointsEarned = 3; break;
            case "hard": pointsEarned = 4; break;
            default: pointsEarned = 2;
          }
          
          // Apply points multiplier (used for challenges)
          pointsEarned = pointsEarned * pointsMultiplier;
        } else {
          // Wrong answer always gives 0.5 points (but still apply multiplier for challenges)
          pointsEarned = 0.5 * pointsMultiplier;
        }
        
        // Get current date for tracking daily/monthly stats
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        // Save answer to Supabase
        await supabase.from('quiz_answers').insert({
          user_id: userId,
          question_id: question.id,
          selected_answer: selectedOption,
          correct: isCorrect,
          points_earned: pointsEarned,
          answered_at: now.toISOString(), // Add timestamp to help with filtering by day/month
          challenge_id: isChallenge ? window.location.pathname.split('/').pop() : null // Add challenge ID if in challenge
        });
        
        console.log(`Answer saved with ${pointsEarned} points`);
        
        // Don't update daily/monthly/total points for challenge questions
        // Those will be handled by the challenge component
        if (!isChallenge) {
          // Update daily points
          const { data: dailyData, error: dailyError } = await supabase
            .from('daily_points')
            .select('points')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle();
            
          console.log('Daily points check:', { dailyData, dailyError });
          
          if (dailyData) {
            // Update existing record
            const updatedPoints = Number(dailyData.points) + pointsEarned;
            await supabase
              .from('daily_points')
              .update({ points: updatedPoints })
              .eq('user_id', userId)
              .eq('date', today);
            console.log(`Updated daily points to ${updatedPoints}`);
          } else {
            // Create new record
            await supabase
              .from('daily_points')
              .insert({ user_id: userId, date: today, points: pointsEarned });
            console.log(`Created new daily points record with ${pointsEarned} points`);
          }
          
          // Update monthly points
          const { data: monthlyData, error: monthlyError } = await supabase
            .from('monthly_points')
            .select('points')
            .eq('user_id', userId)
            .eq('month', currentMonth)
            .maybeSingle();
            
          console.log('Monthly points check:', { monthlyData, monthlyError });
          
          if (monthlyData) {
            // Update existing record
            const updatedPoints = Number(monthlyData.points) + pointsEarned;
            await supabase
              .from('monthly_points')
              .update({ points: updatedPoints })
              .eq('user_id', userId)
              .eq('month', currentMonth);
            console.log(`Updated monthly points to ${updatedPoints}`);
          } else {
            // Create new record
            await supabase
              .from('monthly_points')
              .insert({ user_id: userId, month: currentMonth, points: pointsEarned });
            console.log(`Created new monthly points record with ${pointsEarned} points`);
          }
          
          // Update user's points in the profiles table
          const { data } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', userId)
            .single();
              
          if (data) {
            const currentPoints = data.points || 0;
            const newTotal = Number(currentPoints) + pointsEarned;
            await supabase
              .from('profiles')
              .update({ points: newTotal })
              .eq('id', userId);
              
            console.log(`Updated total points from ${currentPoints} to ${newTotal}`);
            
            // Update local storage with new total points
            localStorage.setItem(STORAGE_KEYS.USER_POINTS, newTotal.toString());
          }
          
          // Dispatch point update event
          window.dispatchEvent(new Event('pointsUpdated'));
        }
      }
      
      // Call the onComplete callback
      onComplete(isCorrect, selectedOption);
      
      // Navigate to the answer page (only for regular quiz, not challenges)
      if (!isChallenge) {
        navigate(`/answer/${question.id}/${selectedOption}`);
      }
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Failed to submit answer",
        description: "Please try again",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };
  
  const handleSubmitAnswer = () => {
    if (!selectedOption || isSubmitting) return;
    setIsSubmitting(true);
  };
  
  const getDifficultyIcon = () => {
    switch (question.difficulty) {
      case 'easy': return <Brain size={18} />;
      case 'medium': return <ZapIcon size={18} />;
      case 'hard': return <Flame size={18} />;
      default: return <Brain size={18} />;
    }
  };
  
  return (
    <Card className="quiz-card fun-card">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {getDifficultyIcon()}
            {question.difficulty}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Award size={14} />
            {question.category}
          </span>
        </div>
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="text-primary h-5 w-5" />
          {question.question}
        </CardTitle>
        <CardDescription className="text-sm mt-2 flex items-center justify-center gap-1">
          <Timer className="h-4 w-4" />
          Select the correct answer below
          {pointsMultiplier > 1 && (
            <span className="text-primary font-medium ml-1">
              {pointsMultiplier}x Points!
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 ${
                selectedOption === option
                  ? 'border-primary bg-primary/10 transform scale-105'
                  : 'hover:bg-accent hover:border-accent hover:shadow-md'
              } ${isAnimating && selectedOption === option ? 'bounce-in' : ''}`}
              onClick={() => handleSelectOption(option)}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium border ${
                  selectedOption === option ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1">{option}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <CountdownButton
          onCountdownComplete={proceedToAnswerPage}
          initialSeconds={5}
          disabled={!selectedOption || isSubmitting}
          className={`w-full ${selectedOption ? 'fun-button' : ''}`}
          icon={<Sparkles className="h-4 w-4" />}
        >
          Submit Answer
        </CountdownButton>
      </CardFooter>
    </Card>
  );
};

export default QuizCard;
