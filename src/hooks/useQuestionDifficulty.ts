
import { useMemo } from 'react';
import { QuestionDifficulty } from '@/types/challenges';

type DifficultyColors = {
  border: string;
  background: string;
  text: string;
};

export const useQuestionDifficulty = (difficulty: QuestionDifficulty) => {
  const difficultyColors = useMemo(() => {
    const colors: Record<QuestionDifficulty, DifficultyColors> = {
      easy: {
        border: 'green-500',
        background: 'green-100',
        text: 'green-800'
      },
      medium: {
        border: 'yellow-500',
        background: 'yellow-100',
        text: 'yellow-800'
      },
      hard: {
        border: 'red-500',
        background: 'red-100',
        text: 'red-800'
      }
    };

    return colors[difficulty] || colors.medium;
  }, [difficulty]);

  return { difficultyColors };
};
