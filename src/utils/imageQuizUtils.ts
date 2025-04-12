
import { QuizQuestion } from './types';

// List of placeholder image URLs for our image-based quizzes
const placeholderImages = [
  'https://images.unsplash.com/photo-1472396961693-142e6e269027', // deer
  'https://images.unsplash.com/photo-1466721591366-2d5fba72006d', // antelope and zebra
  'https://images.unsplash.com/photo-1493962853295-0fd70327578a', // brown ox
  'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1', // grey tabby kitten
  'https://images.unsplash.com/photo-1498936178812-4b2e558d2937', // bees
  'https://images.unsplash.com/photo-1452960962994-acf4fd70b632', // sheep
  'https://images.unsplash.com/photo-1518877593221-1f28583780b4', // whale
  'https://images.unsplash.com/photo-1439886183900-e79ec0057170', // deer in woods
  'https://images.unsplash.com/photo-1465379944081-7f47de8d74ac', // cattle in forest
  'https://images.unsplash.com/photo-1441057206919-63d19fac2369', // penguins
  'https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a', // architecture
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625', // white building
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742', // building
  'https://images.unsplash.com/photo-1496307653780-42ee777d4833', // glass building
  'https://images.unsplash.com/photo-1481938426547-7ce24483a5e2', // laptop electronics
];

// Sample image questions
const imageQuizQuestions: Partial<QuizQuestion>[] = [
  {
    question: "What animal is shown in this image?",
    options: ["Deer", "Elk", "Moose", "Antelope"],
    correctAnswer: "Deer",
    category: "Animals",
    difficulty: "easy",
    explanation: "The image shows a deer in its natural habitat.",
    questionType: "image"
  },
  {
    question: "What breed of cat is displayed?",
    options: ["Persian", "Tabby", "Siamese", "Maine Coon"],
    correctAnswer: "Tabby",
    category: "Animals",
    difficulty: "medium",
    explanation: "The image shows a tabby cat, recognized by its distinctive striped pattern.",
    questionType: "image"
  },
  {
    question: "What architectural style is shown in this building?",
    options: ["Gothic", "Modern", "Baroque", "Art Deco"],
    correctAnswer: "Modern",
    category: "Architecture",
    difficulty: "medium",
    explanation: "The image displays a modern architectural style with clean lines and minimalist design.",
    questionType: "image"
  },
  {
    question: "What type of device is shown?",
    options: ["Laptop", "Tablet", "Smartphone", "Desktop Computer"],
    correctAnswer: "Laptop",
    category: "Technology",
    difficulty: "easy",
    explanation: "The image shows a laptop computer.",
    questionType: "image"
  },
  {
    question: "Which insect is featured in this image?",
    options: ["Bee", "Wasp", "Fly", "Hornet"],
    correctAnswer: "Bee",
    category: "Animals",
    difficulty: "easy",
    explanation: "The image shows bees, which are important pollinators.",
    questionType: "image"
  }
];

// Create a complete image quiz question with an assigned image
export const createImageQuizQuestion = (baseQuestion: Partial<QuizQuestion>, imageUrl: string): QuizQuestion => {
  return {
    id: crypto.randomUUID(),
    question: baseQuestion.question || "",
    options: baseQuestion.options || [],
    correctAnswer: baseQuestion.correctAnswer || "",
    category: baseQuestion.category || "General",
    difficulty: baseQuestion.difficulty || "medium",
    points: baseQuestion.points || 10,
    explanation: baseQuestion.explanation || "",
    imageUrl: imageUrl,
    questionType: "image"
  };
};

// Generate a random image quiz question
export const getRandomImageQuizQuestion = (): QuizQuestion => {
  // Select a random base question
  const randomQuestionIndex = Math.floor(Math.random() * imageQuizQuestions.length);
  const baseQuestion = imageQuizQuestions[randomQuestionIndex];
  
  // Select a random image that conceptually matches the question
  let imageIndex = Math.floor(Math.random() * placeholderImages.length);
  
  // Try to match the image to the question category
  if (baseQuestion.category === "Animals" && randomQuestionIndex <= 4) {
    imageIndex = randomQuestionIndex; // Use the first 5 images for animal questions
  } else if (baseQuestion.category === "Architecture") {
    imageIndex = 10 + (randomQuestionIndex % 5); // Use the architecture images
  } else if (baseQuestion.category === "Technology") {
    imageIndex = 15; // Use the technology image
  }
  
  const imageUrl = placeholderImages[imageIndex];
  
  return createImageQuizQuestion(baseQuestion, imageUrl);
};

// Check if it's time to show an image question (roughly 1 in 5 questions)
export const shouldShowImageQuestion = (): boolean => {
  return Math.random() < 0.2; // 20% chance
};
