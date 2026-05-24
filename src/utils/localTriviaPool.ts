import { QuizQuestion } from './types';

export interface LocalWordle {
  clue: string;
  answer: string;
}

export const LOCAL_TRIVIA_QUESTIONS: QuizQuestion[] = [
  {
    id: 'lt1',
    question: 'Which planet is known as the Red Planet?',
    options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 'Mars',
    category: 'Science',
    difficulty: 'easy',
    explanation: 'Mars appears red because of iron oxide (rust) on its surface.'
  },
  {
    id: 'lt2',
    question: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    correctAnswer: 'Canberra',
    category: 'Geography',
    difficulty: 'medium',
    explanation: 'Canberra was chosen as the capital in 1908 as a compromise between rivals Sydney and Melbourne.'
  },
  {
    id: 'lt3',
    question: 'Which planet is closest to the Sun?',
    options: ['Venus', 'Earth', 'Mercury', 'Mars'],
    correctAnswer: 'Mercury',
    category: 'Science',
    difficulty: 'easy',
    explanation: 'Mercury is the closest planet to the Sun, orbiting it in just 88 Earth days.'
  },
  {
    id: 'lt4',
    question: 'Who painted the Mona Lisa?',
    options: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Claude Monet'],
    correctAnswer: 'Leonardo da Vinci',
    category: 'Art',
    difficulty: 'medium',
    explanation: 'Leonardo da Vinci painted the Mona Lisa in Florence, Italy, during the Renaissance.'
  },
  {
    id: 'lt5',
    question: 'What is the chemical symbol for Gold?',
    options: ['Gd', 'Au', 'Ag', 'Go'],
    correctAnswer: 'Au',
    category: 'Science',
    difficulty: 'easy',
    explanation: 'The chemical symbol for Gold is Au, derived from the Latin word "aurum", meaning shining dawn.'
  },
  {
    id: 'lt6',
    question: 'How many bones are in an adult human body?',
    options: ['206', '300', '150', '250'],
    correctAnswer: '206',
    category: 'Science',
    difficulty: 'medium',
    explanation: 'Humans are born with around 270 bones, but many fuse together as they grow, leaving adults with 206.'
  },
  {
    id: 'lt7',
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctAnswer: 'Pacific Ocean',
    category: 'Geography',
    difficulty: 'easy',
    explanation: 'The Pacific Ocean is the largest and deepest of Earth\'s oceanic divisions, covering over 30% of the Earth\'s surface.'
  },
  {
    id: 'lt8',
    question: 'Which country gifted the Statue of Liberty to the United States?',
    options: ['United Kingdom', 'France', 'Germany', 'Spain'],
    correctAnswer: 'France',
    category: 'History',
    difficulty: 'medium',
    explanation: 'France gifted the Statue of Liberty to the USA in 1886 to commemorate the alliance between the two nations during the American Revolution.'
  },
  {
    id: 'lt9',
    question: 'Who wrote the play "Romeo and Juliet"?',
    options: ['Charles Dickens', 'Mark Twain', 'William Shakespeare', 'Jane Austen'],
    correctAnswer: 'William Shakespeare',
    category: 'Literature',
    difficulty: 'easy',
    explanation: 'William Shakespeare wrote the tragic romance play Romeo and Juliet early in his career, around 1595.'
  },
  {
    id: 'lt10',
    question: 'What is the smallest country in the world by land area?',
    options: ['Monaco', 'San Marino', 'Liechtenstein', 'Vatican City'],
    correctAnswer: 'Vatican City',
    category: 'Geography',
    difficulty: 'medium',
    explanation: 'Vatican City is the smallest independent state in the world, covering just 0.49 square kilometers.'
  },
  {
    id: 'lt11',
    question: 'Which organ in the human body is responsible for pumping blood?',
    options: ['Brain', 'Lungs', 'Liver', 'Heart'],
    correctAnswer: 'Heart',
    category: 'Science',
    difficulty: 'easy',
    explanation: 'The heart pumps blood through the network of arteries and veins, supplying oxygen and nutrients to tissues.'
  },
  {
    id: 'lt12',
    question: 'What gas do plants absorb from the atmosphere for photosynthesis?',
    options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
    correctAnswer: 'Carbon Dioxide',
    category: 'Science',
    difficulty: 'medium',
    explanation: 'Plants take in carbon dioxide and water to produce glucose and oxygen using light energy.'
  },
  {
    id: 'lt13',
    question: 'Who was the first person to step on the Moon?',
    options: ['Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'Michael Collins'],
    correctAnswer: 'Neil Armstrong',
    category: 'History',
    difficulty: 'easy',
    explanation: 'Neil Armstrong was the commander of Apollo 11 and became the first person on the Moon on July 20, 1869.'
  },
  {
    id: 'lt14',
    question: 'In which year did the Titanic sink?',
    options: ['1905', '1912', '1918', '1923'],
    correctAnswer: '1912',
    category: 'History',
    difficulty: 'hard',
    explanation: 'The RMS Titanic struck an iceberg and sank on its maiden voyage on April 15, 1912.'
  },
  {
    id: 'lt15',
    question: 'What is the capital city of Japan?',
    options: ['Osaka', 'Kyoto', 'Tokyo', 'Hiroshima'],
    correctAnswer: 'Tokyo',
    category: 'Geography',
    difficulty: 'easy',
    explanation: 'Tokyo has been the capital and seat of government of Japan since 1868, previously known as Edo.'
  },
  {
    id: 'lt16',
    question: 'Which element is the most abundant in Earth\'s atmosphere?',
    options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'],
    correctAnswer: 'Nitrogen',
    category: 'Science',
    difficulty: 'medium',
    explanation: 'Earth\'s atmosphere is composed of about 78% Nitrogen, 21% Oxygen, and small amounts of other gases.'
  },
  {
    id: 'lt17',
    question: 'What is the hardest natural substance on Earth?',
    options: ['Gold', 'Iron', 'Diamond', 'Quartz'],
    correctAnswer: 'Diamond',
    category: 'Science',
    difficulty: 'easy',
    explanation: 'Diamond is the hardest known natural material, composed of carbon atoms arranged in a crystal lattice.'
  },
  {
    id: 'lt18',
    question: 'Who wrote the "Harry Potter" book series?',
    options: ['J.R.R. Tolkien', 'C.S. Lewis', 'J.K. Rowling', 'George R.R. Martin'],
    correctAnswer: 'J.K. Rowling',
    category: 'Literature',
    difficulty: 'easy',
    explanation: 'British author J.K. Rowling wrote the highly popular seven-part fantasy series Harry Potter.'
  },
  {
    id: 'lt19',
    question: 'Which country is known as the Land of the Rising Sun?',
    options: ['China', 'Japan', 'South Korea', 'Thailand'],
    correctAnswer: 'Japan',
    category: 'Geography',
    difficulty: 'easy',
    explanation: 'Japan is referred to as the Land of the Rising Sun because it lies to the east of China, from where the sun appears to rise.'
  },
  {
    id: 'lt20',
    question: 'How many minutes are in a full 24-hour day?',
    options: ['1200', '1440', '1500', '1680'],
    correctAnswer: '1440',
    category: 'Math',
    difficulty: 'hard',
    explanation: 'A single day has 24 hours, and each hour has 60 minutes. 24 * 60 = 1440 minutes.'
  },
  {
    id: 'lt21',
    question: 'Which continent is the largest by land area?',
    options: ['Africa', 'North America', 'Europe', 'Asia'],
    correctAnswer: 'Asia',
    category: 'Geography',
    difficulty: 'easy',
    explanation: 'Asia is Earth\'s largest and most populous continent, covering nearly 30% of Earth\'s land area.'
  },
  {
    id: 'lt22',
    question: 'What is the capital of Canada?',
    options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'],
    correctAnswer: 'Ottawa',
    category: 'Geography',
    difficulty: 'medium',
    explanation: 'Queen Victoria designated Ottawa as the capital of Canada in 1857 because of its central location.'
  },
  {
    id: 'lt23',
    question: 'Who developed the theory of relativity?',
    options: ['Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Nikola Tesla'],
    correctAnswer: 'Albert Einstein',
    category: 'Science',
    difficulty: 'easy',
    explanation: 'Albert Einstein developed the special and general theories of relativity, reshaping modern physics.'
  },
  {
    id: 'lt24',
    question: 'Which bird is famous for its ability to mimic human speech?',
    options: ['Eagle', 'Penguin', 'Parrot', 'Owl'],
    correctAnswer: 'Parrot',
    category: 'Science',
    difficulty: 'easy',
    explanation: 'Parrots, particularly African Greys, are highly intelligent birds famous for their mimicry and communication abilities.'
  },
  {
    id: 'lt25',
    question: 'What is the square root of 144?',
    options: ['10', '12', '14', '16'],
    correctAnswer: '12',
    category: 'Math',
    difficulty: 'easy',
    explanation: 'The square root of 144 is 12, since 12 multiplied by itself equals 144.'
  },
  {
    id: 'lt26',
    question: 'Which country is the largest in the world by land area?',
    options: ['Canada', 'China', 'United States', 'Russia'],
    correctAnswer: 'Russia',
    category: 'Geography',
    difficulty: 'easy',
    explanation: 'Russia is the largest country in the world, covering more than 17 million square kilometers.'
  },
  {
    id: 'lt27',
    question: 'Who is widely known as the "Father of Computers"?',
    options: ['Alan Turing', 'Bill Gates', 'Charles Babbage', 'Steve Jobs'],
    correctAnswer: 'Charles Babbage',
    category: 'Science',
    difficulty: 'medium',
    explanation: 'Charles Babbage designed the first mechanical computer, the Analytical Engine, in the 1830s.'
  },
  {
    id: 'lt28',
    question: 'Which is the longest river in the world?',
    options: ['Amazon River', 'Mississippi River', 'Yangtze River', 'Nile'],
    correctAnswer: 'Nile',
    category: 'Geography',
    difficulty: 'medium',
    explanation: 'The Nile is historically considered the longest river in the world, stretching 6,650 kilometers through northeastern Africa.'
  },
  {
    id: 'lt29',
    question: 'What color is a sapphire usually associated with?',
    options: ['Red', 'Green', 'Yellow', 'Blue'],
    correctAnswer: 'Blue',
    category: 'General',
    difficulty: 'easy',
    explanation: 'Sapphires are precious gemstones traditionally known for their rich, deep blue color.'
  },
  {
    id: 'lt30',
    question: 'What is the capital city of Italy?',
    options: ['Milan', 'Venice', 'Rome', 'Florence'],
    correctAnswer: 'Rome',
    category: 'Geography',
    difficulty: 'easy',
    explanation: 'Rome is the capital of Italy and has a history spanning over 2,500 years as the heart of the Roman Empire.'
  }
];

export const LOCAL_WORDLES: LocalWordle[] = [
  { clue: 'The red planet in our solar system', answer: 'MARS' },
  { clue: 'The capital city of France', answer: 'PARIS' },
  { clue: 'A round fruit, often red, yellow, or green', answer: 'APPLE' },
  { clue: 'The planet we live on', answer: 'EARTH' },
  { clue: 'The large organ that pumps blood', answer: 'HEART' },
  { clue: 'A sweet gold substance made by bees', answer: 'HONEY' },
  { clue: 'The country famous for its ancient pyramids', answer: 'EGYPT' },
  { clue: 'A yellow metal that is highly precious', answer: 'GOLD' },
  { clue: 'The season between summer and winter', answer: 'AUTUMN' },
  { clue: 'A primary color, also the color of the sky', answer: 'BLUE' },
  { clue: 'An instrument with black and white keys', answer: 'PIANO' },
  { clue: 'The largest mammal living in the ocean', answer: 'WHALE' },
  { clue: 'The natural satellite that orbits the Earth', answer: 'MOON' },
  { clue: 'The coldest season with snow and ice', answer: 'WINTER' },
  { clue: 'The hot season perfect for beach visits', answer: 'SUMMER' },
  { clue: 'Liquid water falling in drops from clouds', answer: 'RAIN' },
  { clue: 'The vital gas we breathe to stay alive', answer: 'OXYGEN' },
  { clue: 'A primary color, also the color of grass', answer: 'GREEN' },
  { clue: 'A slow-moving reptile with a hard shell', answer: 'TURTLE' },
  { clue: 'The capital city of Italy', answer: 'ROME' }
];

export function getLocalQuestionsBatch(limit: number = 5): QuizQuestion[] {
  const shuffled = [...LOCAL_TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

export function getRandomLocalWordle(): LocalWordle {
  const randomIndex = Math.floor(Math.random() * LOCAL_WORDLES.length);
  return LOCAL_WORDLES[randomIndex];
}
