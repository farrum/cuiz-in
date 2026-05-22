import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { STORAGE_KEYS, QuizQuestion } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getRandomMessage } from '@/utils/funMessages';
import { Sparkles, Brain, ZapIcon, Timer, Award, Flame } from 'lucide-react';
import CountdownButton from './CountdownButton';
import { logGemsEarned } from '@/utils/gemsService';
import { createSlug } from '@/utils/urlUtils';
import { isUserLoggedIn, canGuestPlay, incrementGuestPlay, getRemainingGuestPlays } from '@/utils/guestPlayService';
import GuestPlayLimitModal from './GuestPlayLimitModal';

interface QuizCardProps {
  question: QuizQuestion;
  onComplete: (isCorrect: boolean, selectedAnswer: string) => void;
  gemsMultiplier?: number;
  isChallenge?: boolean;
  skipAutoNavigation?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ 
  question, 
  onComplete, 
  gemsMultiplier = 1,
  isChallenge = false,
  skipAutoNavigation = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if guest can play
  const guestCanPlay = canGuestPlay();
  const remainingPlays = getRemainingGuestPlays();
  const isLoggedIn = isUserLoggedIn();
  
  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  const proceedToAnswerPage = async () => {
    if (!selectedOption) return;
    
    // Check if guest limit reached
    if (!isLoggedIn && !guestCanPlay) {
      setShowGuestLimitModal(true);
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Get user ID from local storage
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      // Check if the selected answer is correct
      const isCorrect = selectedOption === question.correctAnswer;
      
      // Calculate gems based on difficulty
      let gemsEarned = 0;
      if (isCorrect) {
        switch (question.difficulty) {
          case "easy": gemsEarned = 2; break;
          case "medium": gemsEarned = 3; break;
          case "hard": gemsEarned = 4; break;
          default: gemsEarned = 2;
        }
        gemsEarned = gemsEarned * gemsMultiplier;
      } else {
        gemsEarned = 0.5 * gemsMultiplier;
      }
      
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
      
      // Handle logged-in users
      if (userId) {
        console.log(`Recording answer for question ${question.id}, correct: ${isCorrect}`);
        
        // For non-challenge questions, update gems across all systems
        if (!isChallenge) {
          console.log(`User earned ${gemsEarned} gems for this answer`);
          await logGemsEarned(gemsEarned, userId);
        }
        
        // Save answer to the quiz_answers table regardless of challenge type
        await supabase.from('quiz_answers').insert({
          user_id: userId,
          question_id: question.id,
          selected_answer: selectedOption,
          correct: isCorrect,
          points_earned: gemsEarned,
          answered_at: new Date().toISOString()
        });
      } else {
        // Guest user - track session gems
        incrementGuestPlay(gemsEarned);
        
        // Show remaining plays for guests
        const remaining = getRemainingGuestPlays();
        if (remaining > 0 && remaining <= 3) {
          toast({
            title: `${remaining} free questions left!`,
            description: "Register to save your gems and play unlimited quizzes.",
            variant: "default",
          });
        }
      }
      
      // Call the onComplete callback
      onComplete(isCorrect, selectedOption);
      
      // Navigate to the answer page (only for regular quiz, not challenges)
      if (!isChallenge && !skipAutoNavigation) {
        // Use consistent slug generation
        const answerSlug = createSlug(selectedOption, 50);
        navigate(`/answer/${question.id}/${answerSlug}`);
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
          {gemsMultiplier > 1 && (
            <span className="text-primary font-medium ml-1">
              {gemsMultiplier}x Gems!
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
      <CardFooter className="flex-col gap-2">
        {!isLoggedIn && remainingPlays > 0 && remainingPlays <= 5 && (
          <p className="text-xs text-muted-foreground text-center w-full">
            {remainingPlays} free {remainingPlays === 1 ? 'question' : 'questions'} remaining • <Link to="/register" className="text-primary hover:underline">Register to save gems</Link>
          </p>
        )}
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
      
      {/* Guest Play Limit Modal */}
      <GuestPlayLimitModal 
        isOpen={showGuestLimitModal} 
        onClose={() => setShowGuestLimitModal(false)} 
      />
    </Card>
  );
};

export default QuizCard;
