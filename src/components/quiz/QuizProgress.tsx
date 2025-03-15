
import React from 'react';

interface QuizProgressProps {
  questionsAnswered: number;
}

const QuizProgress: React.FC<QuizProgressProps> = ({ questionsAnswered }) => {
  return (
    <div className="mb-6 mt-6">
      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mb-2">
        <div 
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000"
          style={{ width: `${Math.min((questionsAnswered % 10) * 10, 100)}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {10 - (questionsAnswered % 10)} more questions until next milestone
      </div>
    </div>
  );
};

export default QuizProgress;
