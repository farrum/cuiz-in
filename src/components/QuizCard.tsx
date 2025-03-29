import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, QuizQuestion } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getRandomMessage } from '@/utils/funMessages';
import { Sparkles, Brain, ZapIcon, Timer, Award, Flame } from 'lucide-react';
import CountdownButton from './CountdownButton';
import { Button } from '@/components/ui/button';
import { QuestionDifficulty } from '@/types/challenges';

const QuizCard: React.FC = () => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    fetchRandomQuestion();
  }, []);
  
  const fetchRandomQuestion = async () => {
    try {
      setIsLoading(true);
      
      const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
      
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .not('id', 'in', `(${completedQuestions.join(',')})`)
        .limit(1)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const quizQuestion: QuizQuestion = {
          id: data[0].id,
          question: data[0].question,
          options: data[0].options as string[],
          correctAnswer: data[0].correct_answer,
          category: data[0].category,
          difficulty: (data[0].difficulty || 'medium') as QuestionDifficulty,
          explanation: data[0].explanation || ''
        };
        
        setQuestion(quizQuestion);
      } else {
        toast({
          title: 'No more questions',
          description: 'You have completed all available questions!'
        });
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quiz question',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  const proceedToAnswerPage = async () => {
    if (!selectedOption || !question) return;
    
    try {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      const isCorrect = selectedOption === question.correctAnswer;
      
      const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
      completedQuestions.push(question.id);
      localStorage.setItem(STORAGE_KEYS.COMPLETED_QUESTIONS, JSON.stringify(completedQuestions));
      
      const welcomeMessage = getRandomMessage('welcome');
      toast({
        title: "Quiz Time! 🧠",
        description: welcomeMessage.text,
        variant: "default",
      });
      
      if (userId) {
        let pointsEarned = 0;
        if (isCorrect) {
          switch (question.difficulty) {
            case "easy": pointsEarned = 2; break;
            case "medium": pointsEarned = 3; break;
            case "hard": pointsEarned = 4; break;
            default: pointsEarned = 2;
          }
        } else {
          pointsEarned = 0.5;
        }
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        
        await supabase.from('quiz_answers').insert({
          user_id: userId,
          question_id: question.id,
          selected_answer: selectedOption,
          correct: isCorrect,
          points_earned: pointsEarned,
          answered_at: now.toISOString()
        });
        
        const { data: dailyData, error: dailyError } = await supabase
          .from('daily_points')
          .select('points')
          .eq('user_id', userId)
          .eq('date', today)
          .maybeSingle();
          
        if (dailyData) {
          const updatedPoints = Number(dailyData.points) + pointsEarned;
          await supabase
            .from('daily_points')
            .update({ points: updatedPoints })
            .eq('user_id', userId)
            .eq('date', today);
        } else {
          await supabase
            .from('daily_points')
            .insert({ user_id: userId, date: today, points: pointsEarned });
        }
        
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('monthly_points')
          .select('points')
          .eq('user_id', userId)
          .eq('month', currentMonth)
          .maybeSingle();
          
        if (monthlyData) {
          const updatedPoints = Number(monthlyData.points) + pointsEarned;
          await supabase
            .from('monthly_points')
            .update({ points: updatedPoints })
            .eq('user_id', userId)
            .eq('month', currentMonth);
        } else {
          await supabase
            .from('monthly_points')
            .insert({ user_id: userId, month: currentMonth, points: pointsEarned });
        }
        
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
            
          localStorage.setItem(STORAGE_KEYS.USER_POINTS, newTotal.toString());
        }
        
        window.dispatchEvent(new Event('pointsUpdated'));
      }
      
      navigate(`/answer/${question.id}/${selectedOption}`);
      
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
  
  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return <Brain size={18} />;
      case 'medium': return <ZapIcon size={18} />;
      case 'hard': return <Flame size={18} />;
      default: return <Brain size={18} />;
    }
  };
  
  if (isLoading || !question) {
    return (
      <Card className="quiz-card">
        <CardHeader>
          <CardTitle className="text-xl">Loading question...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            <div className="space-y-2 mt-6">
              <div className="h-12 bg-gray-100 rounded"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled className="w-full">Loading...</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="quiz-card fun-card">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {getDifficultyIcon(question.difficulty)}
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
