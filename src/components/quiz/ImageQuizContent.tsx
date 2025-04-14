
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Image as ImageIcon } from "lucide-react";
import { QuizQuestion } from '@/utils/quizData';
import CountdownButton from '@/components/CountdownButton';

interface ImageQuizOptionProps {
  option: string;
  index: number;
  selected: boolean;
  onSelect: (option: string) => void;
}

const ImageQuizOption: React.FC<ImageQuizOptionProps> = ({ option, index, selected, onSelect }) => {
  return (
    <div 
      className={`p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
        selected ? 'border-primary bg-primary/10 transform scale-105' : 'hover:bg-accent hover:border-accent'
      }`}
      onClick={() => onSelect(option)}
    >
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium border ${
          selected ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
        }`}>
          {String.fromCharCode(65 + index)}
        </div>
        <div className="flex-1">{option}</div>
      </div>
    </div>
  );
};

interface ImageQuizContentProps {
  question: QuizQuestion;
  onComplete: (isCorrect: boolean, selectedAnswer: string) => void;
  isLoading?: boolean;
  isChallenge?: boolean;
}

const ImageQuizContent: React.FC<ImageQuizContentProps> = ({
  question,
  onComplete,
  isLoading = false,
  isChallenge = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Store image question in local storage for answer page retrieval
  useEffect(() => {
    if (question && question.questionType === 'image') {
      // Cache the image questions for answer page retrieval
      const cachedQuestions = localStorage.getItem('image_quiz_questions') || '[]';
      const imageQuestions = JSON.parse(cachedQuestions);
      
      // Check if this question is already cached
      const existingQuestion = imageQuestions.find((q: QuizQuestion) => q.id === question.id);
      if (!existingQuestion) {
        imageQuestions.push(question);
        localStorage.setItem('image_quiz_questions', JSON.stringify(imageQuestions));
      }
    }
  }, [question]);

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption || isSubmitting) return;
    setIsSubmitting(true);
    
    const isCorrect = selectedOption === question.correctAnswer;
    onComplete(isCorrect, selectedOption);
    
    // If this is not a challenge question, navigate to the answer page
    if (!isChallenge) {
      navigate(`/answer/${question.id}/${encodeURIComponent(selectedOption)}`);
    }
  };

  if (isLoading) {
    return (
      <Card className="quiz-card animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48 w-full rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="quiz-card fun-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {question.difficulty}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Award size={14} />
            {question.category}
          </span>
        </div>
        <CardTitle className="text-xl flex items-center gap-2">
          <ImageIcon className="text-primary h-5 w-5" />
          {question.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
            <img
              src={question.imageUrl}
              alt="Quiz question image"
              className="object-contain w-full h-full"
              loading="eager"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
        )}
        <div className="space-y-3 mt-4">
          {question.options.map((option, index) => (
            <ImageQuizOption
              key={index}
              option={option}
              index={index}
              selected={selectedOption === option}
              onSelect={handleSelectOption}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <CountdownButton
          onCountdownComplete={handleSubmit}
          initialSeconds={5}
          disabled={!selectedOption || isSubmitting}
          className={`w-full ${selectedOption ? 'fun-button' : ''}`}
        >
          Submit Answer
        </CountdownButton>
      </CardFooter>
    </Card>
  );
};

export default ImageQuizContent;
