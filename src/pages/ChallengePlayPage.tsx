import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS, QuizQuestion } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import QuizCard from '@/components/QuizCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, CheckCircle2, XCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import MotivationalCharacter from '@/components/MotivationalCharacter';
import { Skeleton } from '@/components/ui/skeleton';
import { confetti } from '@/utils/animations';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  num_questions: number;
  points_multiplier: number;
  question_ids: string[];
}

interface ChallengeProgress {
  id: string;
  challenge_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  completed: boolean;
  score: number;
}

interface Answer {
  questionId: string;
  correct: boolean;
  selectedAnswer: string;
  explanation: string;
  correctAnswer: string;
}

// Simple interface for question data to avoid type recursion
interface QuestionExplanation {
  question: string;
  explanation: string;
  correctAnswer: string;
}

// Create a proper type for the map to avoid infinite recursion
type QuestionMap = Record<string, QuestionExplanation>;

// Create a proper type for the answer map
type AnswerMap = Record<string, {
  question_id: string;
  correct: boolean;
  selected_answer: string;
}>;

const ChallengePlayPage = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(0);
  
  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    
    fetchChallengeData();
  }, [challengeId, userId, navigate]);
  
  const fetchChallengeData = async () => {
    if (!challengeId) return;
    
    try {
      setLoading(true);
      
      // Fetch challenge data
      const { data: challengeData, error: challengeError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();
        
      if (challengeError) throw challengeError;
      setChallenge(challengeData);
      
      // Fetch progress data
      const { data: progressData, error: progressError } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (progressError) throw progressError;
      
      if (!progressData) {
        // Create new progress record if it doesn't exist
        const { data: newProgress, error: newProgressError } = await supabase
          .from('user_challenge_progress')
          .insert([{
            challenge_id: challengeId,
            user_id: userId,
            started_at: new Date().toISOString(),
            completed: false,
            score: 0
          }])
          .select()
          .single();
          
        if (newProgressError) throw newProgressError;
        setProgress(newProgress);
      } else {
        setProgress(progressData);
        setIsComplete(progressData.completed);
        setScore(progressData.score);
        
        // If already completed, load all answers for result page
        if (progressData.completed) {
          // Get all answers for this challenge
          const { data: answerData } = await supabase
            .from('quiz_answers')
            .select('question_id, correct, selected_answer')
            .eq('user_id', userId)
            .eq('challenge_id', challengeId)
            .order('created_at', { ascending: true });
          
          // Get question data to include explanations and correct answers
          const { data: questionData } = await supabase
            .from('quiz_questions')
            .select('*')
            .in('id', challengeData.question_ids);
            
          // Map questions for easy lookup
          const questionMap: QuestionMap = {};
          if (questionData) {
            questionData.forEach(q => {
              questionMap[q.id] = {
                question: q.question,
                explanation: q.explanation || '',
                correctAnswer: q.correct_answer
              };
            });
          }
          
          // Create answers array using the correct order from challenge.question_ids
          const completedAnswers: Answer[] = [];
          
          if (answerData && answerData.length > 0) {
            // Create a map of question_id to answer for quick lookup
            const answerMap: AnswerMap = {};
            answerData.forEach(a => {
              answerMap[a.question_id] = a;
            });
            
            // Build answers array in the correct order
            challengeData.question_ids.forEach(qId => {
              const answer = answerMap[qId];
              if (answer) {
                completedAnswers.push({
                  questionId: qId,
                  correct: answer.correct,
                  selectedAnswer: answer.selected_answer,
                  explanation: questionMap[qId]?.explanation || '',
                  correctAnswer: questionMap[qId]?.correctAnswer || ''
                });
              }
            });
          }
          
          setAnswers(completedAnswers);
        }
      }
      
      // Fetch questions data in the correct order
      if (challengeData.question_ids && challengeData.question_ids.length > 0) {
        const { data: questionData, error: questionError } = await supabase
          .from('quiz_questions')
          .select('*')
          .in('id', challengeData.question_ids);
          
        if (questionError) throw questionError;
        
        // Convert DB question format to QuizQuestion format with proper type conversion
        const formattedQuestions: Record<string, QuizQuestion> = {};
        
        questionData.forEach(q => {
          formattedQuestions[q.id] = {
            id: q.id,
            question: q.question,
            options: Array.isArray(q.options) 
              ? q.options.map(opt => String(opt)) 
              : typeof q.options === 'object' && q.options !== null
                ? Object.values(q.options).map(opt => String(opt))
                : [],
            correctAnswer: q.correct_answer,
            explanation: q.explanation || '',
            category: q.category,
            difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
            points: q.points || 10
          };
        });
        
        // Ensure questions are in the same order as question_ids
        const orderedQuestions = challengeData.question_ids
          .map(id => formattedQuestions[id])
          .filter(Boolean) as QuizQuestion[];
        
        setQuestions(orderedQuestions);
      }
    } catch (error) {
      console.error('Error fetching challenge data:', error);
      toast({
        title: "Error loading challenge",
        description: "Please try again or return to the quiz page",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuestionComplete = async (isCorrect: boolean, selectedAnswer: string) => {
    if (!challenge || !questions[currentQuestionIndex]) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    // Calculate earned points
    let earnedPoints = 0;
    if (isCorrect) {
      // Calculate points based on difficulty
      switch (currentQuestion.difficulty) {
        case "easy": earnedPoints = 2; break;
        case "medium": earnedPoints = 3; break;
        case "hard": earnedPoints = 4; break;
        default: earnedPoints = 2;
      }
      // Apply multiplier
      earnedPoints = earnedPoints * (challenge.points_multiplier || 1);
    } else {
      // Wrong answer gives 0.5 points with multiplier
      earnedPoints = 0.5 * (challenge.points_multiplier || 1);
    }
    
    const newTotalPoints = currentPoints + earnedPoints;
    setCurrentPoints(newTotalPoints);
    
    // Add to answers array
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      correct: isCorrect,
      selectedAnswer: selectedAnswer,
      explanation: currentQuestion.explanation || '',
      correctAnswer: currentQuestion.correctAnswer
    };
    
    setAnswers([...answers, newAnswer]);
    
    try {
      // Record the answer
      await supabase.from('quiz_answers').insert([{
        question_id: currentQuestion.id,
        user_id: userId,
        selected_answer: selectedAnswer,
        correct: isCorrect,
        points_earned: earnedPoints,
        challenge_id: challengeId // Add reference to challenge
      }]);
      
      // Check if this was the last question
      if (currentQuestionIndex >= challenge.num_questions - 1) {
        // Challenge complete!
        await completeChallenge(newTotalPoints);
      } else {
        // Move to next question
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      }
    } catch (error) {
      console.error('Error recording answer:', error);
      toast({
        title: "Error saving answer",
        description: "Your progress might not be fully saved",
        variant: "destructive"
      });
    }
  };
  
  const completeChallenge = async (finalScore: number) => {
    if (!challenge || !progress) return;
    
    try {
      // Update user profile points
      const userProfileData = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();
        
      if (userProfileData.error) throw userProfileData.error;
      
      const currentUserPoints = userProfileData.data.points || 0;
      const newTotalPoints = currentUserPoints + finalScore;
      
      await supabase
        .from('profiles')
        .update({ points: newTotalPoints })
        .eq('id', userId);
        
      // Store updated points in localStorage
      localStorage.setItem(STORAGE_KEYS.USER_POINTS, newTotalPoints.toString());
      
      // Update challenge progress
      await supabase
        .from('user_challenge_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          score: finalScore
        })
        .eq('id', progress.id);
        
      setIsComplete(true);
      setScore(finalScore);
      
      // Show completion toast and trigger confetti
      toast({
        title: "Challenge Completed!",
        description: `You earned ${finalScore} points!`,
      });
      
      // Only trigger confetti if there are correct answers
      if (answers.some(a => a.correct)) {
        confetti();
      }
      
      // Update progress state
      setProgress({
        ...progress,
        completed: true,
        completed_at: new Date().toISOString(),
        score: finalScore
      });
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        title: "Error saving results",
        description: "Your progress might not be fully saved",
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
          <Skeleton className="h-10 w-72 mb-4" />
          <Skeleton className="h-6 w-full max-w-md mb-8" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4 flex items-center justify-center">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="mb-4">Challenge not found or no longer available.</p>
              <Button onClick={() => navigate('/quiz')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Quiz
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Challenge completion summary
  if (isComplete) {
    const correctCount = answers.filter(a => a.correct).length;
    const totalCount = challenge.num_questions;
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/quiz')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quiz
          </Button>
          
          <Card className="border-primary/30">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-2xl flex justify-center items-center">
                <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
                Challenge Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-6">
              <div className="flex justify-center mb-6">
                <MotivationalCharacter 
                  mood={percentage >= 70 ? "happy" : percentage >= 40 ? "neutral" : "sad"}
                  showMessage={true}
                  message={
                    percentage >= 70 
                      ? "Amazing job! You crushed this challenge!" 
                      : percentage >= 40 
                      ? "Good effort! Keep practicing!" 
                      : "Don't give up! You'll do better next time!"
                  }
                />
              </div>
              
              <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
              
              <div className="glass p-4 rounded-lg mb-6 mx-auto max-w-md">
                <div className="text-4xl font-bold text-primary mb-2">{score}</div>
                <div className="text-muted-foreground">Points Earned</div>
                
                <div className="mt-4 space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Correct Answers</span>
                      <span className="font-medium">{correctCount} / {totalCount}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Points Multiplier</span>
                    <span className="font-medium">{challenge.points_multiplier}x</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6 max-w-md mx-auto">
                <h4 className="font-medium text-left mb-2">Question Summary</h4>
                {answers.map((answer, index) => {
                  // Find the corresponding question
                  const question = questions.find(q => q.id === answer.questionId);
                  
                  return (
                    <div key={index} className="glass p-3 rounded mb-3">
                      <div className="flex items-start gap-2 mb-2">
                        {answer.correct ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                        )}
                        <span className="text-sm font-medium">
                          Q{index + 1}: {question?.question || 'Question'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-left mt-1">
                        <span className="font-medium">Your answer: </span>
                        {answer.selectedAnswer}
                      </div>
                      
                      {!answer.correct && (
                        <div className="bg-muted/40 p-2 rounded text-sm mt-2 text-left">
                          <span className="font-medium">Correct answer: </span> 
                          {answer.correctAnswer}
                        </div>
                      )}
                      
                      {answer.explanation && (
                        <div className="bg-primary/5 p-2 rounded text-sm text-left mt-2">
                          <div className="flex items-start gap-1">
                            <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{answer.explanation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <Button onClick={() => navigate('/quiz')} className="mt-4">
                Back to Quiz
              </Button>
            </CardContent>
          </Card>
          
          <AdvertisementBanner position="bottom" slotId="challenge-bottom" pageSection="challenge-page" />
        </main>
        <Footer />
      </div>
    );
  }
  
  // Challenge in progress - show the current question
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/quiz')}
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Challenge
          </Button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{challenge?.title}</h1>
          {challenge?.description && (
            <p className="text-muted-foreground mt-1">{challenge.description}</p>
          )}
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-1">
            <span>Question {currentQuestionIndex + 1} of {challenge?.num_questions || 0}</span>
            <span>Points: {currentPoints}</span>
          </div>
          <Progress 
            value={((currentQuestionIndex) / (challenge?.num_questions || 1)) * 100} 
            className="h-2"
          />
        </div>
        
        <AdvertisementBanner position="middle" slotId="challenge-middle" pageSection="challenge-page" />
        
        {questions.length > currentQuestionIndex ? (
          <div className="relative mb-8">
            <div className="absolute -top-16 -right-10 z-10 transform scale-75">
              <MotivationalCharacter 
                mood="neutral"
                showMessage={false}
              />
            </div>
            <QuizCard
              question={questions[currentQuestionIndex]}
              onComplete={handleQuestionComplete}
              pointsMultiplier={challenge?.points_multiplier}
              isChallenge={true}
            />
          </div>
        ) : (
          <div className="quiz-card text-center">
            <p>No questions available for this challenge.</p>
          </div>
        )}
        
        <AdvertisementBanner position="bottom" slotId="challenge-bottom" pageSection="challenge-page" />
      </main>
      <Footer />
    </div>
  );
};

export default ChallengePlayPage;
