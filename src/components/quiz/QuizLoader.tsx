
import React from 'react';

const QuizLoader: React.FC = () => {
  return (
    <div className="quiz-card animate-pulse flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading next question...</p>
      </div>
    </div>
  );
};

export default QuizLoader;
