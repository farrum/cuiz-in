import { QuizQuestion } from '../types/quiz';

export const QUIZ_CATEGORIES = [
  'Geography',
  'History',
  'Science',
  'Literature',
  'Mathematics',
  'Sports',
  'Music',
  'Movies',
  'Technology',
  'Art',
  'Food & Drink',
  'Animals',
  'General Knowledge',
  'Astronomy',
  'Mythology'
];

export const DAILY_TARGET = 400;
export const MONTHLY_TARGET = 12000;
export const MONTHLY_REWARD = 8000;

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
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctAnswer: 'Pacific Ocean',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '3',
    question: 'Which country is home to the kangaroo?',
    options: ['New Zealand', 'South Africa', 'Australia', 'Brazil'],
    correctAnswer: 'Australia',
    points: 10,
    difficulty: 'easy',
    category: 'Geography'
  },
  {
    id: '4',
    question: 'What is the largest desert in the world?',
    options: ['Gobi Desert', 'Sahara Desert', 'Antarctic Desert', 'Arabian Desert'],
    correctAnswer: 'Antarctic Desert',
    points: 20,
    difficulty: 'hard',
    category: 'Geography',
    explanation: 'Contrary to popular belief, the largest desert is not the Sahara but the Antarctic Desert, which covers the entire continent of Antarctica.'
  },
  {
    id: '5',
    question: 'Which of these countries does NOT have a coastline?',
    options: ['Vietnam', 'Bolivia', 'Egypt', 'Croatia'],
    correctAnswer: 'Bolivia',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '6',
    question: 'What is the capital of Japan?',
    options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'],
    correctAnswer: 'Tokyo',
    points: 10,
    difficulty: 'easy',
    category: 'Geography'
  },
  {
    id: '7',
    question: 'Which river is the longest in the world?',
    options: ['Amazon River', 'Nile River', 'Yangtze River', 'Mississippi River'],
    correctAnswer: 'Nile River',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '8',
    question: 'What is the smallest country in the world by land area?',
    options: ['Monaco', 'Maldives', 'Vatican City', 'San Marino'],
    correctAnswer: 'Vatican City',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '9',
    question: 'Which mountain range stretches across seven countries: France, Switzerland, Italy, Germany, Austria, Slovenia, and Liechtenstein?',
    options: ['Pyrenees', 'Carpathians', 'Alps', 'Apennines'],
    correctAnswer: 'Alps',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '10',
    question: 'Which African country was formerly known as Rhodesia?',
    options: ['Zambia', 'Zimbabwe', 'Malawi', 'Mozambique'],
    correctAnswer: 'Zimbabwe',
    points: 20,
    difficulty: 'hard',
    category: 'Geography'
  },
  {
    id: '11',
    question: 'Lake Baikal, the deepest lake in the world, is located in which country?',
    options: ['Kazakhstan', 'Mongolia', 'China', 'Russia'],
    correctAnswer: 'Russia',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '12',
    question: 'What is the capital of Canada?',
    options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'],
    correctAnswer: 'Ottawa',
    points: 10,
    difficulty: 'easy',
    category: 'Geography'
  },
  {
    id: '13',
    question: 'Which South American country is the largest by land area?',
    options: ['Argentina', 'Brazil', 'Peru', 'Colombia'],
    correctAnswer: 'Brazil',
    points: 10,
    difficulty: 'easy',
    category: 'Geography'
  },
  {
    id: '14',
    question: 'The Great Barrier Reef is located off the coast of which country?',
    options: ['Indonesia', 'New Zealand', 'Australia', 'Philippines'],
    correctAnswer: 'Australia',
    points: 10,
    difficulty: 'easy',
    category: 'Geography'
  },
  {
    id: '15',
    question: 'Which country is known as the "Land of Fire and Ice"?',
    options: ['Norway', 'Greenland', 'Iceland', 'Finland'],
    correctAnswer: 'Iceland',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '16',
    question: 'What is the capital of Kenya?',
    options: ['Lagos', 'Nairobi', 'Addis Ababa', 'Khartoum'],
    correctAnswer: 'Nairobi',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '17',
    question: 'The Strait of Gibraltar separates which two countries?',
    options: ['France and Italy', 'Greece and Turkey', 'Spain and Morocco', 'Portugal and Algeria'],
    correctAnswer: 'Spain and Morocco',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '18',
    question: 'Which of these cities is NOT located on the Danube River?',
    options: ['Vienna', 'Budapest', 'Prague', 'Belgrade'],
    correctAnswer: 'Prague',
    points: 20,
    difficulty: 'hard',
    category: 'Geography'
  },
  {
    id: '19',
    question: 'What is the currency of Thailand?',
    options: ['Rupee', 'Baht', 'Ringgit', 'Yen'],
    correctAnswer: 'Baht',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '20',
    question: 'Which country has the highest population density in the world?',
    options: ['Singapore', 'Monaco', 'Bangladesh', 'Hong Kong'],
    correctAnswer: 'Monaco',
    points: 20,
    difficulty: 'hard',
    category: 'Geography'
  },
  {
    id: '21',
    question: 'The Sahel region stretches across which continent?',
    options: ['Asia', 'South America', 'Africa', 'Australia'],
    correctAnswer: 'Africa',
    points: 20,
    difficulty: 'hard',
    category: 'Geography'
  },
  {
    id: '22',
    question: 'Which of these countries is completely landlocked (has no coastline)?',
    options: ['Thailand', 'Paraguay', 'Vietnam', 'Chile'],
    correctAnswer: 'Paraguay',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '23',
    question: 'What is the largest island in the Mediterranean Sea?',
    options: ['Corsica', 'Crete', 'Sicily', 'Cyprus'],
    correctAnswer: 'Sicily',
    points: 20,
    difficulty: 'hard',
    category: 'Geography'
  },
  {
    id: '24',
    question: 'The city of Marrakech is located in which country?',
    options: ['Algeria', 'Tunisia', 'Morocco', 'Libya'],
    correctAnswer: 'Morocco',
    points: 15,
    difficulty: 'medium',
    category: 'Geography'
  },
  {
    id: '25',
    question: 'Which country has the most natural lakes?',
    options: ['Russia', 'United States', 'Brazil', 'Canada'],
    correctAnswer: 'Canada',
    points: 20,
    difficulty: 'hard',
    category: 'Geography'
  },
  {
    id: '26',
    question: 'In which year did World War II end?',
    options: ['1943', '1945', '1947', '1950'],
    correctAnswer: '1945',
    points: 15,
    difficulty: 'medium',
    category: 'History'
  },
  {
    id: '27',
    question: 'Who was the first President of the United States?',
    options: ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'John Adams'],
    correctAnswer: 'George Washington',
    points: 10,
    difficulty: 'easy',
    category: 'History'
  },
  {
    id: '28',
    question: 'The ancient city of Rome was built on how many hills?',
    options: ['Five', 'Six', 'Seven', 'Nine'],
    correctAnswer: 'Seven',
    points: 20,
    difficulty: 'hard',
    category: 'History'
  },
  {
    id: '29',
    question: 'Who painted the Mona Lisa?',
    options: ['Pablo Picasso', 'Vincent van Gogh', 'Leonardo da Vinci', 'Michelangelo'],
    correctAnswer: 'Leonardo da Vinci',
    points: 10,
    difficulty: 'easy',
    category: 'History'
  },
  {
    id: '30',
    question: 'Which ancient wonder was located in Alexandria, Egypt?',
    options: ['Hanging Gardens', 'Colossus of Rhodes', 'Lighthouse (Pharos)', 'Temple of Artemis'],
    correctAnswer: 'Lighthouse (Pharos)',
    points: 20,
    difficulty: 'hard',
    category: 'History'
  },
  {
    id: '31',
    question: 'Which civilization built Machu Picchu?',
    options: ['Aztec', 'Maya', 'Inca', 'Olmec'],
    correctAnswer: 'Inca',
    points: 15,
    difficulty: 'medium',
    category: 'History'
  },
  {
    id: '32',
    question: 'When did the French Revolution begin?',
    options: ['1789', '1799', '1776', '1804'],
    correctAnswer: '1789',
    points: 15,
    difficulty: 'medium',
    category: 'History'
  },
  {
    id: '33',
    question: 'Who was the leader of the Soviet Union during World War II?',
    options: ['Vladimir Lenin', 'Joseph Stalin', 'Leon Trotsky', 'Nikita Khrushchev'],
    correctAnswer: 'Joseph Stalin',
    points: 15,
    difficulty: 'medium',
    category: 'History'
  },
  {
    id: '34',
    question: 'The Great Wall of China was primarily built to defend against which group of people?',
    options: ['Mongols', 'Japanese', 'Russians', 'Koreans'],
    correctAnswer: 'Mongols',
    points: 15,
    difficulty: 'medium',
    category: 'History'
  },
  {
    id: '35',
    question: 'Who discovered penicillin?',
    options: ['Marie Curie', 'Louis Pasteur', 'Alexander Fleming', 'Joseph Lister'],
    correctAnswer: 'Alexander Fleming',
    points: 15,
    difficulty: 'medium',
    category: 'History'
  },
  {
    id: '51',
    question: 'Which element has the chemical symbol "O"?',
    options: ['Gold', 'Oxygen', 'Osmium', 'Oganesson'],
    correctAnswer: 'Oxygen',
    points: 10,
    difficulty: 'easy',
    category: 'Science'
  },
  {
    id: '52',
    question: 'What is the hardest natural substance on Earth?',
    options: ['Gold', 'Iron', 'Diamond', 'Platinum'],
    correctAnswer: 'Diamond',
    points: 15,
    difficulty: 'medium',
    category: 'Science'
  }
];
