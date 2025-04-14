
import React, { useState, useEffect } from 'react';
import { DragAndDropQuestion, checkDragAndDropAnswer, DragAndDropItem } from '@/utils/dragAndDropQuizUtils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Check, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import CountdownButton from '@/components/CountdownButton';

interface DragAndDropQuizContentProps {
  question: DragAndDropQuestion;
  onComplete: (isCorrect: boolean, selectedAnswer: string) => void;
  isChallenge?: boolean;
}

const DragAndDropQuizContent: React.FC<DragAndDropQuizContentProps> = ({
  question,
  onComplete,
  isChallenge = false
}) => {
  const [items, setItems] = useState<DragAndDropItem[]>([]);
  const [userSubmitted, setUserSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  useEffect(() => {
    // Shuffle the items for initial display
    const shuffledItems = [...question.items].sort(() => Math.random() - 0.5);
    setItems(shuffledItems);
  }, [question]);
  
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (userSubmitted) return;
    
    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setItems(updatedItems);
  };
  
  const handleSubmit = () => {
    const result = checkDragAndDropAnswer(question, items);
    setIsCorrect(result);
    setUserSubmitted(true);
    
    // Use a dummy selected answer string since drag-and-drop doesn't have a traditional "answer"
    onComplete(result, "drag-and-drop-submission");
  };
  
  return (
    <Card className="quiz-card">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {question.difficulty}
          </span>
          <span className="text-xs text-muted-foreground">{question.category}</span>
        </div>
        <CardTitle className="text-xl">{question.question}</CardTitle>
        <CardDescription className="mt-2">
          Drag items into the correct order
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-center mb-4">
          <ArrowUpDown className="h-8 w-8 text-primary opacity-70" />
        </div>
        
        <div className="space-y-2">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className={cn(
                "p-3 border rounded-md flex justify-between items-center",
                userSubmitted && item.correctPosition === index ? "bg-green-50 border-green-200" : 
                userSubmitted && item.correctPosition !== index ? "bg-red-50 border-red-200" : 
                "bg-background"
              )}
            >
              <span>{item.text}</span>
              
              {!userSubmitted && (
                <div className="flex space-x-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => moveItem(index, Math.max(0, index - 1))}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => moveItem(index, Math.min(items.length - 1, index + 1))}
                    disabled={index === items.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {userSubmitted && item.correctPosition === index && (
                <Check className="h-5 w-5 text-green-500" />
              )}
            </div>
          ))}
        </div>
        
        {userSubmitted && (
          <div className="mt-6 p-4 bg-accent/50 rounded-md">
            <p className="font-semibold">Explanation:</p>
            <p>{question.explanation}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {!userSubmitted ? (
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={userSubmitted}
          >
            Submit Answer
          </Button>
        ) : (
          <CountdownButton
            onCountdownComplete={() => {}}
            initialSeconds={5}
            disabled={false}
            className="w-full"
            icon={<Sparkles className="h-4 w-4" />}
          >
            {isCorrect ? "Correct! Next Question" : "Incorrect! Next Question"}
          </CountdownButton>
        )}
      </CardFooter>
    </Card>
  );
};

export default DragAndDropQuizContent;
