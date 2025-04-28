
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS, QuizQuestion } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getRandomMessage } from '@/utils/funMessages';
import { Sparkles, Brain, ZapIcon, Timer, Award, Flame } from 'lucide-react';
import CountdownButton from './CountdownButton';
import { logPointsEarned } from '@/utils/pointsService';

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
      setIsSubmitting(true);
      
      // Get user ID from local storage
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      // Check if the selected answer is correct
      const isCorrect = selectedOption === question.correctAnswer;
      
      // Track completed question in local storage - only for non-challenge questions
      if (!isChallenge) {
        const completedQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_QUESTIONS) || '[]');
        if (!completedQuestions.includes(question.id)) {
          completedQuestions.push(question.id);
          localStorage.setItem(STORAGE_KEYS.COMPLETED_QUESTIONS, JSON.stringify(completedQuestions));
        }
        
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
        console.log(`Recording answer for question ${question.id}, correct: ${isCorrect}`);
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
        
        // For non-challenge questions, update points across all systems
        if (!isChallenge) {
          console.log(`User earned ${pointsEarned} points for this answer`);
          await logPointsEarned(pointsEarned, userId);
        }
        
        // Save answer to the quiz_answers table
        const answerData = {
          user_id: userId,
          question_id: question.id,
          selected_answer: selectedOption,
          correct: isCorrect,
          points_earned: pointsEarned,
          answered_at: new Date().toISOString()
        };
        
        // Log if this is a challenge question
        if (isChallenge) {
          const challengeId = window.location.pathname.split('/').pop();
          console.log(`Recording answer for challenge: ${challengeId}`);
        }
        
        // Insert the answer data into the database
        const { error } = await supabase.from('quiz_answers').insert(answerData);
        if (error) {
          console.error("Error saving answer:", error);
          toast({
            title: "Error saving answer",
            description: "Your answer was processed but couldn't be saved to your history",
            variant: "destructive"
          });
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
  
  // Don't skip rendering even if it's an image-based question
  // The ImageQuizContent component will handle image-based questions separately
  
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
