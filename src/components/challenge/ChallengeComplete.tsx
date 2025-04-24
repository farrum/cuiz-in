import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, CheckCircle2, XCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { Challenge, Answer } from '@/hooks/challenge/challengeTypes';
import { QuizQuestion } from '@/utils/quizData';
import MotivationalCharacter from '@/components/MotivationalCharacter';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ChallengeCompleteProps {
  challenge: Challenge;
  answers: Answer[];
  questions: QuizQuestion[];
  score: number;
  onExit: () => void;
}

const ChallengeComplete: React.FC<ChallengeCompleteProps> = ({
  challenge,
  answers,
  questions,
  score,
  onExit
}) => {
  const correctCount = answers.filter(a => a.correct).length;
  const totalCount = challenge.num_questions;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <Button 
          variant="outline" 
          onClick={onExit}
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
            
            <Button onClick={onExit} className="mt-4">
              Back to Quiz
            </Button>
          </CardContent>
        </Card>
        
        <SimpleAdBanner position="footer" className="mt-8" />
      </main>
      <Footer />
    </div>
  );
};

export default ChallengeComplete;
