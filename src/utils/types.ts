
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
  questionType?: 'text' | 'image'; // Type of question (default is text)
}
