
// This file contains all quiz categories data

export type CategoryData = {
  name: string;
  description: string;
  longDescription: string;
  questionCount: number;
  icon: string;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  subcategories: string[];
  featuredQuestions: {
    id: string;
    question: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }[];
  topPerformers: {
    username: string;
    gems: number;
    rank: number;
  }[];
};

export type CategoryDataRecord = Record<string, CategoryData>;

// Quiz categories with descriptions, counts, and icons
export const categoriesArray = [
  {
    id: 1,
    name: 'History',
    slug: 'history',
    description: 'Test your knowledge of world history, important events, and historical figures.',
    questionCount: 153,
    icon: '📜'
  },
  {
    id: 2,
    name: 'Science',
    slug: 'science',
    description: 'Challenge yourself with questions about physics, chemistry, biology, and scientific discoveries.',
    questionCount: 178,
    icon: '🔬'
  },
  {
    id: 3,
    name: 'Geography',
    slug: 'geography',
    description: 'Explore your knowledge of countries, capitals, landmarks, and geographical features.',
    questionCount: 124,
    icon: '🌍'
  },
  {
    id: 4,
    name: 'Literature',
    slug: 'literature',
    description: 'Test your familiarity with famous authors, books, literary characters, and quotes.',
    questionCount: 98,
    icon: '📚'
  },
  {
    id: 5,
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Questions about movies, TV shows, music, celebrities, and pop culture.',
    questionCount: 210,
    icon: '🎬'
  },
  {
    id: 6,
    name: 'Sports',
    slug: 'sports',
    description: 'Challenge your knowledge of sports events, rules, athletes, and championships.',
    questionCount: 132,
    icon: '⚽'
  },
  {
    id: 7,
    name: 'Technology',
    slug: 'technology',
    description: 'Test what you know about computers, gadgets, the internet, and technological innovations.',
    questionCount: 116,
    icon: '💻'
  },
  {
    id: 8,
    name: 'General Knowledge',
    slug: 'general-knowledge',
    description: 'A mix of questions covering various topics for a broad knowledge challenge.',
    questionCount: 225,
    icon: '🧠'
  },
  {
    id: 9,
    name: 'Global Politics',
    slug: 'global-politics',
    description: 'World governments, international relations, and political systems.',
    questionCount: 85,
    icon: '🗳️'
  },
  {
    id: 10,
    name: 'Kids Corner',
    slug: 'kids-trivia',
    description: 'Fun, educational, and safe questions for our younger players.',
    questionCount: 120,
    icon: '🎈'
  },
  {
    id: 11,
    name: 'Law & Justice',
    slug: 'law-justice',
    description: 'Legal systems, famous trials, and the history of human rights.',
    questionCount: 65,
    icon: '⚖️'
  },
  {
    id: 12,
    name: 'World Music',
    slug: 'music',
    description: 'From classical masters to modern pop and rock legends.',
    questionCount: 145,
    icon: '🎵'
  },
  {
    id: 13,
    name: 'Environment',
    slug: 'environment-nature',
    description: 'Climate science, wildlife, and protecting our natural world.',
    questionCount: 95,
    icon: '🌱'
  },
  {
    id: 14,
    name: 'Business',
    slug: 'business-finance',
    description: 'Economics, startups, and the global financial markets.',
    questionCount: 110,
    icon: '💼'
  },
  {
    id: 15,
    name: 'Guinness World Records',
    slug: 'guinness-world-records',
    description: 'Test your knowledge of extraordinary human achievements, amazing feats, and official world records.',
    questionCount: 0,
    icon: '🏆'
  },
  {
    id: 16,
    name: 'K-Pop & K-Drama',
    slug: 'k-pop-k-drama',
    description: 'Test your knowledge on K-Pop music, groups, and popular Korean dramas.',
    questionCount: 84,
    icon: '🇰🇷'
  }
];

// Complete category data with additional details
export const categoryData: CategoryDataRecord = {
  'history': {
    name: 'History',
    description: 'Test your knowledge of world history, important events, and historical figures.',
    longDescription: 'Dive into the fascinating world of history with our comprehensive quiz collection. From ancient civilizations to modern events, our history quizzes cover a wide range of topics that will challenge your knowledge about the past. Learn about important historical figures, pivotal moments, and the evolution of human society through engaging questions.',
    questionCount: 153,
    icon: '📜',
    difficultyDistribution: {
      easy: 40,
      medium: 35,
      hard: 25
    },
    subcategories: [
      'Ancient History', 'Medieval Period', 'World Wars', 'American History', 'Asian History', 'European History'
    ],
    featuredQuestions: [
      {
        id: 'hist-001',
        question: 'In which year did Christopher Columbus first reach the Americas?',
        difficulty: 'medium'
      },
      {
        id: 'hist-002',
        question: 'Who was the first Emperor of Rome?',
        difficulty: 'medium'
      },
      {
        id: 'hist-003',
        question: 'Which civilization built the ancient city of Machu Picchu?',
        difficulty: 'hard'
      },
      {
        id: 'hist-004',
        question: 'During which century did the Black Death primarily spread across Europe?',
        difficulty: 'medium'
      }
    ],
    topPerformers: [
      { username: 'HistoryBuff42', gems: 1250, rank: 1 },
      { username: 'TimeTraveler', gems: 1150, rank: 2 },
      { username: 'AncientScholar', gems: 1050, rank: 3 }
    ]
  },
  'science': {
    name: 'Science',
    description: 'Challenge yourself with questions about physics, chemistry, biology, and scientific discoveries.',
    longDescription: 'Explore the wonders of science through our diverse collection of quizzes. From the fundamental laws of physics to cutting-edge discoveries in genetics, our science category offers a stimulating challenge for both science enthusiasts and curious minds. Test your knowledge about the natural world, scientific principles, and the brilliant minds who shaped our understanding of the universe.',
    questionCount: 178,
    icon: '🔬',
    difficultyDistribution: {
      easy: 35,
      medium: 40,
      hard: 25
    },
    subcategories: [
      'Physics', 'Chemistry', 'Biology', 'Astronomy', 'Earth Science', 'Scientific Discoveries'
    ],
    featuredQuestions: [
      {
        id: 'sci-001',
        question: 'What is the chemical symbol for gold?',
        difficulty: 'easy'
      },
      {
        id: 'sci-002',
        question: 'Which planet in our solar system has the most moons?',
        difficulty: 'medium'
      },
      {
        id: 'sci-003',
        question: 'What is the smallest unit of life that can replicate independently?',
        difficulty: 'medium'
      },
      {
        id: 'sci-004',
        question: 'What particle has the same mass as an electron but positive charge?',
        difficulty: 'hard'
      }
    ],
    topPerformers: [
      { username: 'QuantumThinker', gems: 1350, rank: 1 },
      { username: 'MolecularMaster', gems: 1200, rank: 2 },
      { username: 'StarGazer', gems: 1100, rank: 3 }
    ]
  },
  'geography': {
    name: 'Geography',
    description: 'Explore your knowledge of countries, capitals, landmarks, and geographical features.',
    longDescription: 'Test your geographical knowledge with our extensive collection of quizzes covering the entire world. From identifying capital cities and landmarks to understanding geographical features and natural wonders, our geography quizzes will take you on a journey across continents and oceans. Challenge yourself to name countries, identify flags, and learn about the diverse cultures and regions of our planet.',
    questionCount: 124,
    icon: '🌍',
    difficultyDistribution: {
      easy: 30,
      medium: 45,
      hard: 25
    },
    subcategories: [
      'Countries & Capitals', 'Physical Geography', 'World Maps', 'Landmarks', 'Mountain Ranges', 'Bodies of Water'
    ],
    featuredQuestions: [
      {
        id: 'geo-001',
        question: 'Which country has the longest coastline in the world?',
        difficulty: 'medium'
      },
      {
        id: 'geo-002',
        question: 'What is the capital city of New Zealand?',
        difficulty: 'easy'
      },
      {
        id: 'geo-003',
        question: 'Which desert is the largest hot desert in the world?',
        difficulty: 'medium'
      },
      {
        id: 'geo-004',
        question: 'Which mountain range separates Europe from Asia?',
        difficulty: 'hard'
      }
    ],
    topPerformers: [
      { username: 'GlobeExplorer', gems: 1420, rank: 1 },
      { username: 'MapMaster', gems: 1320, rank: 2 },
      { username: 'WorldTraveler', gems: 1280, rank: 3 }
    ]
  },
  'literature': {
    name: 'Literature',
    description: 'Test your familiarity with famous authors, books, literary characters, and quotes.',
    longDescription: 'From classical masterpieces to modern bestsellers, our literature quizzes will test your knowledge of authors, novels, poetry, and literary movements throughout history. Challenge yourself with questions about memorable characters, famous quotes, and influential works that have shaped our cultural heritage. Whether you\'re a bookworm or a casual reader, our literature category offers insights into the world of written art.',
    questionCount: 98,
    icon: '📚',
    difficultyDistribution: {
      easy: 35,
      medium: 40,
      hard: 25
    },
    subcategories: [
      'Classic Literature', 'Modern Fiction', 'Poetry', 'Shakespeare', 'World Literature', 'Literary Theory'
    ],
    featuredQuestions: [
      {
        id: 'lit-001',
        question: 'Who wrote "Pride and Prejudice"?',
        difficulty: 'easy'
      },
      {
        id: 'lit-002',
        question: 'Which Shakespeare play features the character Ophelia?',
        difficulty: 'medium'
      },
      {
        id: 'lit-003',
        question: 'What is the first book of J.R.R. Tolkien\'s "The Lord of the Rings" trilogy?',
        difficulty: 'easy'
      },
      {
        id: 'lit-004',
        question: 'Which Russian author wrote "War and Peace"?',
        difficulty: 'medium'
      }
    ],
    topPerformers: [
      { username: 'BookWorm99', gems: 980, rank: 1 },
      { username: 'ClassicReader', gems: 920, rank: 2 },
      { username: 'NovelEnthusiast', gems: 870, rank: 3 }
    ]
  },
  'entertainment': {
    name: 'Entertainment',
    description: 'Questions about movies, TV shows, music, celebrities, and pop culture.',
    longDescription: 'Stay up-to-date with the world of entertainment through our engaging quiz collection. From blockbuster movies and binge-worthy TV shows to chart-topping music and celebrity news, our entertainment category covers all aspects of popular culture. Test your knowledge of actors, directors, musicians, and iconic moments in entertainment history. Whether you\'re a film buff, music lover, or pop culture enthusiast, these quizzes will challenge and entertain.',
    questionCount: 210,
    icon: '🎬',
    difficultyDistribution: {
      easy: 45,
      medium: 40,
      hard: 15
    },
    subcategories: [
      'Movies', 'Television', 'Music', 'Celebrities', 'Award Shows', 'Video Games'
    ],
    featuredQuestions: [
      {
        id: 'ent-001',
        question: 'Which actor played Iron Man in the Marvel Cinematic Universe?',
        difficulty: 'easy'
      },
      {
        id: 'ent-002',
        question: 'Which band released the album "Abbey Road"?',
        difficulty: 'medium'
      },
      {
        id: 'ent-003',
        question: 'Who directed the film "Jaws"?',
        difficulty: 'medium'
      },
      {
        id: 'ent-004',
        question: 'Which TV show features characters named Ross, Rachel, Monica, Chandler, Joey, and Phoebe?',
        difficulty: 'easy'
      }
    ],
    topPerformers: [
      { username: 'MovieBuff', gems: 2150, rank: 1 },
      { username: 'PopCultureGuru', gems: 2050, rank: 2 },
      { username: 'Cinephile', gems: 1950, rank: 3 }
    ]
  },
  'sports': {
    name: 'Sports',
    description: 'Challenge your knowledge of sports events, rules, athletes, and championships.',
    longDescription: 'Whether you\'re a die-hard sports fan or casual observer, our sports quizzes will put your athletic knowledge to the test. Covering major sports like football, basketball, soccer, tennis, and cricket, along with Olympic events and legendary athletes, these questions span the entire sporting world. From championship records to famous moments and game rules, our comprehensive sports category offers challenges for fans of all types of athletic competition.',
    questionCount: 132,
    icon: '⚽',
    difficultyDistribution: {
      easy: 30,
      medium: 50,
      hard: 20
    },
    subcategories: [
      'Football', 'Basketball', 'Soccer', 'Tennis', 'Olympics', 'Racing Sports'
    ],
    featuredQuestions: [
      {
        id: 'spt-001',
        question: 'Which country won the FIFA World Cup in 2018?',
        difficulty: 'easy'
      },
      {
        id: 'spt-002',
        question: 'How many players are on a standard basketball team on the court at once?',
        difficulty: 'easy'
      },
      {
        id: 'spt-003',
        question: 'In which city were the 2016 Summer Olympics held?',
        difficulty: 'medium'
      },
      {
        id: 'spt-004',
        question: 'Which tennis player has won the most Grand Slam tournaments in men\'s singles?',
        difficulty: 'medium'
      }
    ],
    topPerformers: [
      { username: 'SportsFanatic', gems: 1320, rank: 1 },
      { username: 'StatsMaster', gems: 1280, rank: 2 },
      { username: 'ChampionKnowledge', gems: 1230, rank: 3 }
    ]
  },
  'technology': {
    name: 'Technology',
    description: 'Test what you know about computers, gadgets, the internet, and technological innovations.',
    longDescription: 'Keep pace with the rapidly evolving world of technology through our informative quizzes. Covering everything from computer hardware and software to internet innovations, mobile devices, and future tech trends, our technology category is perfect for tech enthusiasts and curious minds alike. Test your knowledge of tech giants, groundbreaking inventions, programming concepts, and the digital revolution that continues to shape our world.',
    questionCount: 116,
    icon: '💻',
    difficultyDistribution: {
      easy: 30,
      medium: 45,
      hard: 25
    },
    subcategories: [
      'Computers', 'Internet', 'Mobile Technology', 'Programming', 'AI & Robotics', 'Tech Companies'
    ],
    featuredQuestions: [
      {
        id: 'tech-001',
        question: 'In what year was the first iPhone released?',
        difficulty: 'easy'
      },
      {
        id: 'tech-002',
        question: 'Who is considered the co-founder of Microsoft alongside Bill Gates?',
        difficulty: 'medium'
      },
      {
        id: 'tech-003',
        question: 'What does "HTTP" stand for?',
        difficulty: 'medium'
      },
      {
        id: 'tech-004',
        question: 'Which programming language was created by James Gosling at Sun Microsystems?',
        difficulty: 'hard'
      }
    ],
    topPerformers: [
      { username: 'CodeMaster', gems: 1160, rank: 1 },
      { username: 'TechWizard', gems: 1120, rank: 2 },
      { username: 'DigitalGuru', gems: 1050, rank: 3 }
    ]
  },
  'general-knowledge': {
    name: 'General Knowledge',
    description: 'A mix of questions covering various topics for a broad knowledge challenge.',
    longDescription: 'Our general knowledge category offers the perfect mix of questions spanning multiple subjects for a well-rounded quiz experience. From historical events and scientific discoveries to pop culture references and everyday facts, these quizzes will test the breadth of your knowledge. Whether you\'re preparing for a trivia night or simply want to expand your horizons, our diverse general knowledge questions provide an entertaining and educational challenge.',
    questionCount: 225,
    icon: '🧠',
    difficultyDistribution: {
      easy: 40,
      medium: 40,
      hard: 20
    },
    subcategories: [
      'Trivia', 'Current Events', 'Famous People', 'World Records', 'Unusual Facts', 'Random Knowledge'
    ],
    featuredQuestions: [
      {
        id: 'gk-001',
        question: 'Which is the largest ocean on Earth?',
        difficulty: 'easy'
      },
      {
        id: 'gk-002',
        question: 'Who painted the Mona Lisa?',
        difficulty: 'easy'
      },
      {
        id: 'gk-003',
        question: 'What is the currency of Japan?',
        difficulty: 'easy'
      },
      {
        id: 'gk-004',
        question: 'Which element has the chemical symbol "O"?',
        difficulty: 'easy'
      }
    ],
    topPerformers: [
      { username: 'Quizmaster', gems: 2250, rank: 1 },
      { username: 'KnowledgeBank', gems: 2100, rank: 2 },
      { username: 'FactCollector', gems: 1950, rank: 3 }
    ]
  },
  'guinness-world-records': {
    name: 'Guinness World Records',
    description: 'Test your knowledge of extraordinary human achievements, amazing feats, and official world records.',
    longDescription: 'Dive into the fascinating world of Guinness World Records and test your knowledge of humanity\'s most extraordinary achievements. From the tallest and fastest to the oldest and most unusual, our world records quizzes cover incredible feats across sports, nature, science, food, and human endurance. Challenge yourself with questions about record holders, amazing milestones, and the iconic Guinness World Records archives.',
    questionCount: 0,
    icon: '🏆',
    difficultyDistribution: {
      easy: 40,
      medium: 40,
      hard: 20
    },
    subcategories: [
      'Human Achievements', 'Sports Records', 'Nature Records', 'Food Records', 'Entertainment Records', 'Science Records'
    ],
    featuredQuestions: [
      {
        id: 'gwr-001',
        question: 'Which country holds the record for the most cricket World Cup wins?',
        difficulty: 'easy'
      },
      {
        id: 'gwr-002',
        question: 'What is the tallest mountain in the world according to Guinness World Records?',
        difficulty: 'easy'
      },
      {
        id: 'gwr-003',
        question: 'Who holds the record for the most Olympic gold medals won by an individual athlete?',
        difficulty: 'medium'
      },
      {
        id: 'gwr-004',
        question: 'What is the fastest land animal recorded by Guinness World Records?',
        difficulty: 'easy'
      }
    ],
    topPerformers: [
      { username: 'RecordBreaker', gems: 0, rank: 1 },
      { username: 'WorldRecordPro', gems: 0, rank: 2 },
      { username: 'GuinnessGuru', gems: 0, rank: 3 }
    ]
  },
  'k-pop-k-drama': {
    name: 'K-Pop & K-Drama',
    description: 'Test your knowledge on K-Pop music, groups, and popular Korean dramas.',
    longDescription: 'Dive into the world of Hallyu with our K-Pop & K-Drama quizzes! Challenge yourself on your favorite Korean music groups, lyrics, actors, dramas, and entertainment culture. From iconic tracks by BTS, Blackpink, and TWICE to hit dramas like Squid Game, Crash Landing on You, and Goblin, test your knowledge and see if you are a true fan.',
    questionCount: 84,
    icon: '🇰🇷',
    difficultyDistribution: {
      easy: 40,
      medium: 40,
      hard: 20
    },
    subcategories: [
      'K-Pop Music', 'Korean Drama'
    ],
    featuredQuestions: [
      {
        id: 'kpop-001',
        question: 'Which K-Pop group released the hit song "Dynamite" in 2020?',
        difficulty: 'easy'
      },
      {
        id: 'kpop-002',
        question: 'In Squid Game, what is the game played in the final round?',
        difficulty: 'medium'
      }
    ],
    topPerformers: [
      { username: 'HallyuStar', gems: 1280, rank: 1 },
      { username: 'KdramaWatcher', gems: 1190, rank: 2 },
      { username: 'BtsArmy', gems: 1090, rank: 3 }
    ]
  }
};

// Generate placeholder data for categories that don't have detailed information
export const getDefaultCategoryData = (categorySlug: string, basicInfo: any): CategoryData => {
  // Find the basic info for this category
  const info = basicInfo || {
    name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, ' '),
    description: 'Test your knowledge in this exciting category.',
    questionCount: 50,
    icon: '❓'
  };
  
  return {
    name: info.name,
    description: info.description,
    longDescription: `Explore our collection of ${info.name.toLowerCase()} quizzes and test your knowledge. This category offers a range of questions from beginner to expert level.`,
    questionCount: info.questionCount,
    icon: info.icon,
    difficultyDistribution: {
      easy: 35,
      medium: 40,
      hard: 25
    },
    subcategories: ['General', 'Basics', 'Advanced', 'Special Topics'],
    featuredQuestions: [
      {
        id: `${categorySlug}-001`,
        question: 'Sample question 1?',
        difficulty: 'easy'
      },
      {
        id: `${categorySlug}-002`,
        question: 'Sample question 2?',
        difficulty: 'medium'
      }
    ],
    topPerformers: [
      { username: 'User1', gems: 1000, rank: 1 },
      { username: 'User2', gems: 900, rank: 2 },
      { username: 'User3', gems: 800, rank: 3 }
    ]
  };
};

// Function to get category data with a fallback to generated data
export const getCategoryData = (categorySlug: string): CategoryData => {
  // Find the basic info for this category from categories array
  const basicInfo = categoriesArray.find(cat => cat.slug === categorySlug);
  
  // Return existing data or generate default data
  return categoryData[categorySlug] || getDefaultCategoryData(categorySlug, basicInfo);
};
