
import { QuizQuestion } from '../types/quiz';
import { quizQuestions } from '../data/quizQuestions';

export const getRandomQuestion = (): QuizQuestion => {
  const randomIndex = Math.floor(Math.random() * quizQuestions.length);
  return quizQuestions[randomIndex];
};

export const getRandomQuestions = (count: number): QuizQuestion[] => {
  const questions = [...quizQuestions];
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const calculateCashAmount = (points: number): number => {
  const validPoints = Math.floor(points / 100) * 100;
  return validPoints / 100;
};

export const checkAnswer = (question: QuizQuestion, selectedOption: string): boolean => {
  return question.correctAnswer === selectedOption;
};

export const calculatePoints = (isCorrect: boolean): number => {
  return isCorrect ? 2 : 0.5;
};

export const initQuizQuestionsFromCache = () => {
  try {
    const cachedQuestions = localStorage.getItem('quiz_app_questions_cache');
    if (cachedQuestions) {
      const parsed = JSON.parse(cachedQuestions);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading cached questions:', error);
  }
  return quizQuestions;
};
