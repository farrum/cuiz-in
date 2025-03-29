
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Timer, HelpCircle } from "lucide-react";
import { useTimer } from 'react-timer-hook';
import { useConfettiStore } from '@/store/confetti';
import { useQuestionDifficulty } from '@/hooks/useQuestionDifficulty';

// Update the QuizCardProps to use the QuizQuestion from challenges.ts
import { QuizQuestion } from '@/types/challenges';

export interface QuizCardProps {
  question: QuizQuestion;
  onComplete: (isCorrect: boolean, points: number) => void;
}

const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export function QuizCard({ question, onComplete }: QuizCardProps) {
  const [value, setValue] = React.useState("");
  const [isAnswered, setIsAnswered] = React.useState(false);
  const [shuffledOptions, setShuffledOptions] = React.useState<string[]>([]);
  const [isCorrect, setIsCorrect] = React.useState(false);
  const { addConfetti } = useConfettiStore();
  const { difficultyColors } = useQuestionDifficulty(question.difficulty);

  const now = new Date();
  const time = new Date();
  time.setSeconds(now.getSeconds() + 20);
  const {
    seconds,
    isRunning,
    start,
    restart,
  } = useTimer({ expiryTimestamp: time, onExpire: () => handleTimeout() });

  useEffect(() => {
    setShuffledOptions(shuffleArray(question.options));
    start();
  }, [question]);

  const handleAnswer = (option: string) => {
    if (isAnswered) return;

    setIsAnswered(true);
    setValue(option);

    const correct = option === question.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      addConfetti();
    }

    onComplete(correct, question.points);
  };

  const handleTimeout = () => {
    if (isAnswered) return;

    setIsAnswered(true);
    setIsCorrect(false);
    onComplete(false, 0);
  };

  const handleNextQuestion = () => {
    setIsAnswered(false);
    setValue("");
    setIsCorrect(false);

    const now = new Date();
    const time = new Date();
    time.setSeconds(now.getSeconds() + 20);
    restart(time)
  };

  return (
    <Card className="w-[550px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {question.question}
          </CardTitle>
          <Badge variant="secondary" className={`border-${difficultyColors.border} bg-${difficultyColors.background} text-${difficultyColors.text}`}>
            {question.difficulty}
          </Badge>
        </div>
        <CardDescription>
          <div className="flex items-center justify-between">
            Choose the correct answer
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4" />
              <span>{seconds}</span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={setValue}>
          <div className="grid gap-2">
            {shuffledOptions.map((option) => (
              <div key={option}>
                <RadioGroupItem value={option} id={option} disabled={isAnswered} />
                <label htmlFor={option} className="peer-data-[state=checked]:bg-secondary/50 flex cursor-pointer items-center p-4 border rounded-md">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between">
        {isAnswered ? (
          <div className="flex items-center space-x-2">
            {isCorrect ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">Correct!</span>
              </>
            ) : (
              <>
                <HelpCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">Incorrect!</span>
              </>
            )}
          </div>
        ) : null}
        {isAnswered ? (
          <Button onClick={handleNextQuestion}>Next Question</Button>
        ) : (
          <Button onClick={() => handleAnswer(value)} disabled={!value || isAnswered || !isRunning}>Submit Answer</Button>
        )}
      </CardFooter>
    </Card>
  )
}
