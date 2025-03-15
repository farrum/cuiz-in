
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, QuizQuestion } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface QuizCardProps {
  question: QuizQuestion;
  onComplete: (isCorrect: boolean) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ question, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
  };
  
  const handleSubmitAnswer = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    
    try {
      // Get user ID from local storage
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      // Check if the selected answer is correct
      const isCorrect = selectedOption === question.correctAnswer;
      
      // Track completed question in local storage
      const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
      completedQuestions.push(question.id);
      localStorage.setItem(STORAGE_KEYS.COMPLETED_QUESTIONS, JSON.stringify(completedQuestions));
      
      // Record answer in Supabase if user is logged in
      if (userId) {
        // Calculate points based on difficulty - UPDATED POINTS CALCULATION
        let pointsEarned = 0;
        if (isCorrect) {
          switch (question.difficulty) {
            case "easy": pointsEarned = 2; break;
            case "medium": pointsEarned = 3; break;
            case "hard": pointsEarned = 4; break;
            default: pointsEarned = 2;
          }
        } else {
          // Wrong answer always gives 0.5 points
          pointsEarned = 0.5;
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
          answered_at: now.toISOString() // Add timestamp to help with filtering by day/month
        });
        
        // Update daily points
        const { data: dailyData, error: dailyError } = await supabase
          .from('daily_points')
          .select('points')
          .eq('user_id', userId)
          .eq('date', today)
          .single();
          
        if (dailyError && dailyError.code !== 'PGSQL_ERROR') {
          console.error('Error checking daily points:', dailyError);
        }
        
        if (dailyData) {
          // Update existing record
          await supabase
            .from('daily_points')
            .update({ points: Number(dailyData.points) + pointsEarned })
            .eq('user_id', userId)
            .eq('date', today);
        } else {
          // Create new record
          await supabase
            .from('daily_points')
            .insert({ user_id: userId, date: today, points: pointsEarned });
        }
        
        // Update monthly points
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('monthly_points')
          .select('points')
          .eq('user_id', userId)
          .eq('month', currentMonth)
          .single();
          
        if (monthlyError && monthlyError.code !== 'PGSQL_ERROR') {
          console.error('Error checking monthly points:', monthlyError);
        }
        
        if (monthlyData) {
          // Update existing record
          await supabase
            .from('monthly_points')
            .update({ points: Number(monthlyData.points) + pointsEarned })
            .eq('user_id', userId)
            .eq('month', currentMonth);
        } else {
          // Create new record
          await supabase
            .from('monthly_points')
            .insert({ user_id: userId, month: currentMonth, points: pointsEarned });
        }
        
        // If correct, update user's points in the profiles table
        const { data } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', userId)
          .single();
            
        if (data) {
          const currentPoints = data.points || 0;
          await supabase
            .from('profiles')
            .update({ points: currentPoints + pointsEarned })
            .eq('id', userId);
            
          // Update local storage with new total points
          localStorage.setItem(STORAGE_KEYS.USER_POINTS, (currentPoints + pointsEarned).toString());
        }
      }
      
      // Call the onComplete callback
      onComplete(isCorrect);
      
      // Navigate to the answer page
      navigate(`/answer/${question.id}/${selectedOption}`);
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Failed to submit answer",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="quiz-card">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {question.difficulty}
          </span>
          <span className="text-xs text-muted-foreground">{question.category}</span>
        </div>
        <CardTitle className="text-xl">{question.question}</CardTitle>
        <CardDescription>Select the correct answer below</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedOption === option
                  ? 'border-primary bg-primary/10'
                  : 'hover:bg-accent'
              }`}
              onClick={() => handleSelectOption(option)}
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border ${
                  selectedOption === option ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div>{option}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          disabled={!selectedOption || isSubmitting}
          onClick={handleSubmitAnswer}
        >
          {isSubmitting ? "Submitting..." : "Submit Answer"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QuizCard;
