
import React from 'react';
import { CheckCircle2, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Static preview - no animations or timers for mobile performance
const currentQuestion = {
  question: "Which planet is known as the Red Planet?",
  options: ["Venus", "Mars", "Jupiter", "Saturn"],
  correctIndex: 1,
  category: "Science"
};

const LiveQuizPreview: React.FC = () => {
  const getOptionStyle = (index: number) => {
    if (index === currentQuestion.correctIndex) {
      return 'border-accent bg-accent/10';
    }
    return 'border-border';
  };


  return (
    <div className="premium-card max-w-md mx-auto lg:mx-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {currentQuestion.category}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-accent">
          <Sparkles className="w-4 h-4" />
          <span>+10 pts</span>
        </div>
      </div>

      {/* Question */}
      <div>
        <h4 className="text-lg font-semibold mb-4 leading-snug">
          {currentQuestion.question}
        </h4>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border-2",
                getOptionStyle(index)
              )}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="font-medium">{option}</span>
              </div>
              
              {index === currentQuestion.correctIndex && (
                <CheckCircle2 className="w-5 h-5 text-accent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveQuizPreview;
