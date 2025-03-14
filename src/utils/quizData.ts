
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points?: number;
  explanation?: string;
}

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

export const DAILY_TARGET = 400;
export const MONTHLY_TARGET = 12000;
export const MONTHLY_REWARD = 8000;

export const hasCompletedDailyTarget = (points: number): boolean => {
  const todayPoints = getPointsForToday();
  return todayPoints >= DAILY_TARGET;
};

export const hasCompletedMonthlyTarget = (points: number): boolean => {
  const monthlyPoints = getPointsForMonth();
  return monthlyPoints >= MONTHLY_TARGET;
};

export const getPointsForToday = (): number => {
  const today = new Date().toISOString().split('T')[0];
  const dailyLog = JSON.parse(localStorage.getItem('quiz_app_daily_points') || '{}');
  return dailyLog[today] || 0;
};

export const getPointsForMonth = (): number => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyLog = JSON.parse(localStorage.getItem('quiz_app_monthly_points') || '{}');
  return monthlyLog[currentMonth] || 0;
};

export const logPointsForDay = (pointsEarned: number): void => {
  const today = new Date().toISOString().split('T')[0];
  const dailyLog = JSON.parse(localStorage.getItem('quiz_app_daily_points') || '{}');
  
  if (!dailyLog[today]) {
    dailyLog[today] = 0;
  }
  
  dailyLog[today] += pointsEarned;
  localStorage.setItem('quiz_app_daily_points', JSON.stringify(dailyLog));
};

export const logPointsForMonth = (pointsEarned: number): void => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyLog = JSON.parse(localStorage.getItem('quiz_app_monthly_points') || '{}');
  
  if (!monthlyLog[currentMonth]) {
    monthlyLog[currentMonth] = 0;
  }
  
  monthlyLog[currentMonth] += pointsEarned;
  localStorage.setItem('quiz_app_monthly_points', JSON.stringify(monthlyLog));
  
  if (monthlyLog[currentMonth] >= MONTHLY_TARGET) {
    handleMonthlyTargetAchievement(currentMonth);
  }
};

const handleMonthlyTargetAchievement = (month: string): void => {
  const achievements = JSON.parse(localStorage.getItem('quiz_app_achievements') || '[]');
  const alreadyRewarded = achievements.some((a: any) => a.month === month && a.type === 'monthly_target');
  
  if (!alreadyRewarded) {
    achievements.push({
      id: Date.now().toString(),
      type: 'monthly_target',
      month: month,
      reward: MONTHLY_REWARD,
      date: new Date().toISOString(),
      claimed: false
    });
    
    localStorage.setItem('quiz_app_achievements', JSON.stringify(achievements));
  }
};

export const STORAGE_KEYS = {
  USER_NAME: 'quiz_app_user_name',
  USER_POINTS: 'quiz_app_user_points',
  CURRENT_QUIZ: 'quiz_app_current_quiz',
  COMPLETED_QUIZZES: 'quiz_app_completed_quizzes',
  USER_QUIZ_HISTORY: 'quiz_app_user_quiz_history',
  ADMIN_USERNAME: 'quiz_app_admin_username',
  ADMIN_AUTH: 'quiz_app_admin_auth',
  COMPLETED_QUESTIONS: 'quiz_app_completed_questions',
  REFERRALS: 'quiz_app_referrals'
};

// Function to sync ad slots from Supabase to localStorage
export const syncAdSlotsToLocal = async () => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('ad_slots')
      .select('*')
      .eq('active', true);
      
    if (error) {
      throw error;
    }
    
    if (data) {
      localStorage.setItem('quiz_app_ad_slots', JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error syncing ad slots:', error);
  }
};
