
import React, { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AnsweredQuestion } from './types';
import { formatDate } from './utils';

interface QuestionItemProps {
  question: AnsweredQuestion;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ question }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={`transition-all ${question.correct ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {question.correct ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <Badge variant="outline" className="bg-secondary/50">
                {question.category}
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(question.answered_at)}
              </div>
            </div>
            <CardTitle className="text-base font-medium">{question.question}</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 h-8 w-8 p-0" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className={isExpanded ? "block" : "hidden"}>
        <div className="space-y-2 pt-2">
          <Separator />
          
          <div className="mt-2 space-y-2">
            <p className="text-sm font-medium">Your answer:</p>
            <div className={`text-sm px-3 py-2 rounded-md ${
              question.correct ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {question.selected_answer}
            </div>
            
            {!question.correct && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Correct answer:</p>
                <div className="text-sm px-3 py-2 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {question.correct_answer}
                </div>
              </div>
            )}
            
            {question.explanation && (
              <div className="space-y-1 mt-3">
                <p className="text-sm font-medium">Explanation:</p>
                <div className="text-sm px-3 py-2 rounded-md bg-secondary/50">
                  {question.explanation}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(QuestionItem);
