export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  explanation?: string;
}

// Sample questions for the quiz
export const quizQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 'Paris',
    points: 10,
    difficulty: 'easy',
    category: 'Geography',
    explanation: 'Paris is the capital and most populous city of France. It is located on the Seine River, in the north of the country.'
  },
  {
    id: '2',
    question: 'Which planet is known as the Red Planet?',
    options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
    correctAnswer: 'Mars',
    points: 10,
    difficulty: 'easy',
    category: 'Astronomy',
    explanation: 'Mars appears reddish because of iron oxide (rust) prevalent on its surface, giving it the nickname "The Red Planet".'
  },
  {
    id: '3',
    question: 'Who painted the Mona Lisa?',
    options: ['Pablo Picasso', 'Vincent van Gogh', 'Leonardo da Vinci', 'Michelangelo'],
    correctAnswer: 'Leonardo da Vinci',
    points: 10,
    difficulty: 'easy',
    category: 'Art'
  },
  {
    id: '4',
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctAnswer: 'Pacific Ocean',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '5',
    question: 'Which element has the chemical symbol "O"?',
    options: ['Gold', 'Oxygen', 'Osmium', 'Oganesson'],
    correctAnswer: 'Oxygen',
    points: 10,
    difficulty: 'easy',
    category: 'Chemistry'
  },
  {
    id: '6',
    question: 'In which year did World War II end?',
    options: ['1943', '1945', '1947', '1950'],
    correctAnswer: '1945',
    points: 15,
    difficulty: 'medium',
    category: 'History'
  },
  {
    id: '7',
    question: 'What is the square root of 144?',
    options: ['12', '14', '16', '10'],
    correctAnswer: '12',
    points: 10,
    difficulty: 'easy',
    category: 'Mathematics'
  },
  {
    id: '8',
    question: 'Which country is home to the kangaroo?',
    options: ['New Zealand', 'South Africa', 'Australia', 'Brazil'],
    correctAnswer: 'Australia',
    points: 10,
    difficulty: 'easy',
    category: 'Geography'
  },
  {
    id: '9',
    question: 'Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    correctAnswer: 'William Shakespeare',
    points: 15,
    difficulty: 'medium',
    category: 'Literature'
  },
  {
    id: '10',
    question: 'What is the hardest natural substance on Earth?',
    options: ['Gold', 'Iron', 'Diamond', 'Platinum'],
    correctAnswer: 'Diamond',
    points: 15,
    difficulty: 'medium',
    category: 'Science'
  }
];

// Get a random question
export const getRandomQuestion = (): QuizQuestion => {
  const randomIndex = Math.floor(Math.random() * quizQuestions.length);
  return quizQuestions[randomIndex];
};

// Get multiple random questions without repetition
export const getRandomQuestions = (count: number): QuizQuestion[] => {
  const questions = [...quizQuestions];
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Calculate how much money user can withdraw
export const calculateCashAmount = (points: number): number => {
  const validPoints = Math.floor(points / 100) * 100;
  return validPoints / 100; // $1 for every 100 points
};

// Check if answer is correct
export const checkAnswer = (question: QuizQuestion, selectedOption: string): boolean => {
  return question.correctAnswer === selectedOption;
};

// Local storage keys
export const STORAGE_KEYS = {
  USER_POINTS: 'quiz_app_user_points',
  USER_NAME: 'quiz_app_user_name',
  REFERRALS: 'quiz_app_referrals',
  COMPLETED_QUESTIONS: 'quiz_app_completed_questions',
};
