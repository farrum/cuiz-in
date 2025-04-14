
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
  explanation: string;
  imageUrl?: string; // URL for image-based questions
  questionType?: 'text' | 'image' | 'drag-and-drop' | 'multiple-choice' | 'true-false'; // Type of question (default is text)
}

// Export our updated hooks from the quiz index file
<lov-write file_path="src/hooks/quiz/index.ts">
export * from './useQuizState';
export * from './useQuizPoints';
export * from './useQuizQuestion';
export * from './useQuizMotivation';
export * from './useQuizAdSync';
export * from './useQuizSuspension';
export * from './useQuizTypes';
