import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { STORAGE_KEYS, QuizQuestion } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Brain, ZapIcon, Timer, Award, Flame } from 'lucide-react';
import { getRandomMessage } from '@/utils/funMessages';
import CountdownButton from './CountdownButton';
import { logGemsEarned } from '@/utils/gemsService';
import { createSlug } from '@/utils/urlUtils';
import { isUserLoggedIn, canGuestPlay, incrementGuestPlay, getRemainingGuestPlays } from '@/utils/guestPlayService';
import GuestPlayLimitModal from './GuestPlayLimitModal';
import { trackGuestEvent } from '@/utils/guestAnalytics';
import { asUuidOrNull } from '@/utils/uuid';

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
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [revealedCorrect, setRevealedCorrect] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if guest can play
  const guestCanPlay = canGuestPlay();
  const remainingPlays = getRemainingGuestPlays();
  const isLoggedIn = isUserLoggedIn();
  
  const handleSelectOption = (option: string) => {
    if (hasSubmitted) return;
    setSelectedOption(option);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  const proceedToAnswerPage = async () => {
    if (!selectedOption) return;
    
    // Check if guest limit reached
    if (!isLoggedIn && !guestCanPlay) {
      trackGuestEvent({ event_type: 'limit_reached' });
      setShowGuestLimitModal(true);
      setIsSubmitting(false);
      return;
    }

    // Lock the options and reveal the correct/incorrect highlighting.
    setHasSubmitted(true);
    setIsSubmitting(true);
    
    try {
      // Get user ID from local storage
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      // Resolve the correct answer (server-side when it isn't available client-side)
      let correctAnswer = question.correctAnswer || '';
      if (!correctAnswer) {
        try {
          const { data } = await supabase.functions.invoke('validate-quiz-answer', {
            body: { question_id: question.id, selected_answer: selectedOption },
          });
          if (data?.correct_answer) correctAnswer = data.correct_answer;
        } catch (e) {
          console.warn('[QuizCard] answer validation failed', e);
        }
      }
      setRevealedCorrect(correctAnswer);
      const isCorrect = selectedOption === correctAnswer;
      
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
          question_id: asUuidOrNull(question.id),
          selected_answer: selectedOption,
          correct: isCorrect,
          points_earned: gemsEarned,
          answered_at: new Date().toISOString()
        });
      } else {
        // Guest user - track session gems
        incrementGuestPlay(gemsEarned);
        trackGuestEvent({ event_type: 'answer', question_id: question.id, correct: isCorrect, points: gemsEarned });
        
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
      setHasSubmitted(false);
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
          {question.options.map((option, index) => {
            const correctAnswer = revealedCorrect ?? question.correctAnswer;
            const isCorrectOption = !!correctAnswer && option === correctAnswer;
            const isSelected = selectedOption === option;
            const reveal = hasSubmitted; // answer submitted — reveal correct/incorrect

            let optionStyleClass = 'quiz-option-card-neutral';
            if (reveal && isCorrectOption) {
              optionStyleClass = 'quiz-option-card-correct font-bold ring-2 ring-emerald-500/50';
            } else if (reveal && isSelected && !isCorrectOption) {
              optionStyleClass = 'quiz-option-card-wrong ring-2 ring-rose-500/50';
            } else if (isSelected) {
              optionStyleClass = 'quiz-option-card-selected animate-royal-pulse font-bold';
            } else if (reveal) {
              optionStyleClass = 'quiz-option-card-dimmed';
            }

            return (
              <div
                key={index}
                style={{ animationDelay: `${index * 60}ms` }}
                className={cn(
                  "quiz-option-card animate-option-glide group text-left",
                  optionStyleClass,
                  isAnimating && isSelected ? 'scale-[0.98]' : ''
                )}
                onClick={() => !hasSubmitted && handleSelectOption(option)}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2 text-left">
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-xl text-sm font-black shrink-0 transition-all border shadow-xs",
                    reveal && isCorrectOption
                      ? 'border-emerald-700 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm'
                      : reveal && isSelected
                        ? 'border-rose-700 bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-sm'
                        : isSelected
                          ? 'border-amber-600 bg-gradient-to-b from-amber-400 to-amber-600 text-stone-950 shadow-sm'
                          : 'border-amber-300/80 bg-gradient-to-b from-amber-100 to-amber-200/90 text-amber-950 group-hover:border-amber-400'
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className={cn(
                    "flex-1 min-w-0 text-left font-semibold text-[15px] sm:text-[16px] leading-snug tracking-normal",
                    reveal && isCorrectOption ? "text-emerald-950 dark:text-emerald-100 font-bold" :
                    reveal && isSelected ? "text-rose-950 dark:text-rose-100 font-bold" :
                    isSelected ? "text-amber-950 font-bold" :
                    "text-stone-900 dark:text-stone-100 group-hover:text-amber-950"
                  )}>
                    {option}
                  </span>
                </div>

                {reveal && isCorrectOption && (
                  <div className="flex items-center gap-1.5 shrink-0 bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-xs animate-bounce">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Correct</span>
                  </div>
                )}
                {reveal && isSelected && !isCorrectOption && (
                  <div className="flex items-center gap-1.5 shrink-0 bg-rose-600 text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-xs">
                    <span>Your Pick</span>
                  </div>
                )}
              </div>
            );
          })}
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
          className={`w-full ${selectedOption ? 'btn-royal-gold' : ''}`}
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
