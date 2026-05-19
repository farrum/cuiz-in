
import React from 'react';
import { CheckCircle, XCircle, Star, PartyPopper, Frown } from 'lucide-react';
import { QuizQuestion } from '@/utils/quizData';
import MotivationalCharacter from '@/components/MotivationalCharacter';

interface ResultCardProps {
  question: QuizQuestion;
  isCorrect: boolean;
  funMessage: string;
  funEmoji: string;
  backgroundClass: string;
}

const ResultCard: React.FC<ResultCardProps> = ({
  question,
  isCorrect,
  funMessage,
  funEmoji,
  backgroundClass,
}) => {
  // Calculate the gems earned based on the difficulty and correctness
  const getGemsEarned = (isCorrect: boolean, difficulty?: string): number => {
    if (isCorrect) {
      switch (difficulty) {
        case 'easy': return 2;
        case 'medium': return 3;
        case 'hard': return 4;
        default: return 2;
      }
    }
    return 0.5; // Wrong answer always gives 0.5 gems
  };

  return (
    <div 
      className={`quiz-card p-6 rounded-xl fun-card ${backgroundClass} ${isCorrect ? 'bounce-in' : 'shake'}`}
      style={{ 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Add pattern overlay for texture */}
      <div className="absolute inset-0 pattern-dots opacity-30 mix-blend-overlay"></div>
      
      {/* Motivational character */}
      <div className="absolute top-4 right-4">
        <MotivationalCharacter 
          mood={isCorrect ? 'happy' : 'sad'} 
          message={funMessage}
          showMessage={true}
        />
      </div>
      
      <h3 className="text-2xl font-medium mb-6 relative z-10">{question.question}</h3>
      
      <div className="mb-8 mt-8 relative z-10">
        <div className={`p-6 rounded-lg backdrop-blur-sm ${
          isCorrect 
            ? 'bg-green-500/20 border border-green-500 celebration' 
            : 'bg-red-500/20 border border-red-500'
        }`}>
          <div className="flex flex-col items-center text-center">
            {isCorrect ? (
              <>
                <PartyPopper className="w-12 h-12 text-green-500 mb-4" />
                <div className="confetti-bg w-full h-full absolute top-0 left-0 opacity-30 z-0" />
              </>
            ) : (
              <Frown className="w-12 h-12 text-red-500 mb-4" />
            )}
            <h4 className={`text-2xl font-bold mb-2 ${isCorrect ? 'glow-text' : ''}`}>
              {isCorrect ? 'Awesome! Correct Answer! 🎉' : 'Not Quite Right 🤔'}
            </h4>
            <p className="text-lg mb-4">
              {funMessage}
            </p>
            <p className="text-lg font-medium">
              {isCorrect 
                ? `You earned ${getGemsEarned(true, question.difficulty)} gems! ${funEmoji}` 
                : `You earned 0.5 gems. The correct answer was: ${question.correctAnswer} ${funEmoji}`}
            </p>
            {isCorrect && (
              <div className="flex mt-4">
                {[...Array(getGemsEarned(true, question.difficulty))].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 mx-1" fill="#FACC15" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {question.explanation && (
        <div className="mb-8 mt-4 p-4 bg-primary/5 backdrop-blur-md rounded-lg relative z-10">
          <h4 className="font-medium mb-2">Explanation:</h4>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default ResultCard;
