
import React from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBatchQuizImport, QuizQuestionImport } from './hooks/useBatchQuizImport';

const TriviaImporter: React.FC<{
  onSuccess: () => void;
}> = ({ onSuccess }) => {
  const { importQuestions, isImporting, progress } = useBatchQuizImport();

  const handleImportTrivia = async () => {
    // Here we define 30 trivia questions
    const triviaQuestions: QuizQuestionImport[] = [
      {
        question: "Which planet in our solar system has the most moons?",
        options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
        correctAnswer: "Saturn",
        category: "Science",
        difficulty: "medium",
        explanation: "Saturn has 83 moons with confirmed orbits, while Jupiter has 79."
      },
      {
        question: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso", "Michelangelo"],
        correctAnswer: "Leonardo da Vinci",
        category: "Art",
        difficulty: "easy",
        explanation: "Leonardo da Vinci painted the Mona Lisa between 1503 and 1519."
      },
      {
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        correctAnswer: "Pacific Ocean",
        category: "Geography",
        difficulty: "easy",
        explanation: "The Pacific Ocean is the largest and deepest ocean, covering more than 30% of the Earth's surface."
      },
      {
        question: "Which element has the chemical symbol 'Au'?",
        options: ["Silver", "Aluminum", "Gold", "Copper"],
        correctAnswer: "Gold",
        category: "Science",
        difficulty: "medium",
        explanation: "The symbol 'Au' comes from the Latin word for gold, 'aurum'."
      },
      {
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        correctAnswer: "William Shakespeare",
        category: "Literature",
        difficulty: "easy",
        explanation: "William Shakespeare wrote Romeo and Juliet in the late 16th century."
      },
      {
        question: "What is the capital of Australia?",
        options: ["Sydney", "Melbourne", "Canberra", "Perth"],
        correctAnswer: "Canberra",
        category: "Geography",
        difficulty: "medium",
        explanation: "Canberra is the capital city of Australia, not Sydney which is a common misconception."
      },
      {
        question: "Which of these is not a programming language?",
        options: ["Java", "Python", "Jaguar", "Ruby"],
        correctAnswer: "Jaguar",
        category: "Technology",
        difficulty: "easy",
        explanation: "Jaguar is a car brand, while Java, Python, and Ruby are all programming languages."
      },
      {
        question: "What year did the Titanic sink?",
        options: ["1910", "1912", "1915", "1920"],
        correctAnswer: "1912",
        category: "History",
        difficulty: "medium",
        explanation: "The Titanic sank on its maiden voyage in April 1912 after hitting an iceberg."
      },
      {
        question: "Which of these countries is not in Africa?",
        options: ["Kenya", "Myanmar", "Nigeria", "Morocco"],
        correctAnswer: "Myanmar",
        category: "Geography",
        difficulty: "medium",
        explanation: "Myanmar (formerly Burma) is located in Southeast Asia, not Africa."
      },
      {
        question: "What is the smallest bone in the human body?",
        options: ["Stapes", "Femur", "Radius", "Tibia"],
        correctAnswer: "Stapes",
        category: "Science",
        difficulty: "hard",
        explanation: "The stapes (or stirrup) is the smallest bone in the human body, located in the middle ear."
      },
      {
        question: "Which planet is known as the 'Red Planet'?",
        options: ["Venus", "Mars", "Jupiter", "Mercury"],
        correctAnswer: "Mars",
        category: "Science",
        difficulty: "easy",
        explanation: "Mars is called the Red Planet because of the reddish appearance given by iron oxide (rust) on its surface."
      },
      {
        question: "Who was the first woman to win a Nobel Prize?",
        options: ["Marie Curie", "Rosalind Franklin", "Dorothy Hodgkin", "Jane Goodall"],
        correctAnswer: "Marie Curie",
        category: "History",
        difficulty: "medium",
        explanation: "Marie Curie was the first woman to win a Nobel Prize, winning the Physics Prize in 1903 and Chemistry Prize in 1911."
      },
      {
        question: "What is the largest mammal in the world?",
        options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
        correctAnswer: "Blue Whale",
        category: "Biology",
        difficulty: "easy",
        explanation: "The Blue Whale is the largest animal known to have ever existed, with adults weighing up to 200 tons."
      },
      {
        question: "Which country is home to the Great Barrier Reef?",
        options: ["Brazil", "Philippines", "Australia", "Thailand"],
        correctAnswer: "Australia",
        category: "Geography",
        difficulty: "easy",
        explanation: "The Great Barrier Reef, the world's largest coral reef system, is located off the coast of Queensland, Australia."
      },
      {
        question: "What is the world's most spoken language?",
        options: ["English", "Spanish", "Mandarin Chinese", "Hindi"],
        correctAnswer: "Mandarin Chinese",
        category: "Language",
        difficulty: "medium",
        explanation: "Mandarin Chinese is the most spoken language globally with over 1 billion native speakers."
      },
      {
        question: "Which of the following is not a noble gas?",
        options: ["Helium", "Neon", "Chlorine", "Argon"],
        correctAnswer: "Chlorine",
        category: "Science",
        difficulty: "hard",
        explanation: "Chlorine is a halogen, not a noble gas. Noble gases include helium, neon, argon, krypton, xenon, and radon."
      },
      {
        question: "What is the main ingredient in guacamole?",
        options: ["Tomato", "Avocado", "Onion", "Lime"],
        correctAnswer: "Avocado",
        category: "Food",
        difficulty: "easy",
        explanation: "Avocado is the primary ingredient in guacamole, a traditional Mexican dip."
      },
      {
        question: "Which US state is known as the 'Sunshine State'?",
        options: ["California", "Texas", "Florida", "Hawaii"],
        correctAnswer: "Florida",
        category: "Geography",
        difficulty: "medium",
        explanation: "Florida is nicknamed the 'Sunshine State' due to its warm climate and abundant sunshine."
      },
      {
        question: "In which year did World War II end?",
        options: ["1943", "1945", "1947", "1950"],
        correctAnswer: "1945",
        category: "History",
        difficulty: "easy",
        explanation: "World War II ended in 1945 with the surrender of Nazi Germany in May and Japan in September."
      },
      {
        question: "Who invented the telephone?",
        options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Guglielmo Marconi"],
        correctAnswer: "Alexander Graham Bell",
        category: "History",
        difficulty: "easy",
        explanation: "Alexander Graham Bell patented the first practical telephone in 1876."
      },
      {
        question: "What is the hardest natural substance on Earth?",
        options: ["Titanium", "Platinum", "Diamond", "Quartz"],
        correctAnswer: "Diamond",
        category: "Science",
        difficulty: "easy",
        explanation: "Diamond is the hardest known natural material on Earth, made of compressed carbon atoms."
      },
      {
        question: "What is the square root of 144?",
        options: ["10", "12", "14", "16"],
        correctAnswer: "12",
        category: "Mathematics",
        difficulty: "easy",
        explanation: "The square root of 144 is 12, as 12 × 12 = 144."
      },
      {
        question: "Which of these instruments is not in the string family?",
        options: ["Violin", "Harp", "Flute", "Cello"],
        correctAnswer: "Flute",
        category: "Music",
        difficulty: "medium",
        explanation: "The flute is a woodwind instrument, while the violin, harp, and cello are all string instruments."
      },
      {
        question: "What is the chemical formula for water?",
        options: ["H2O", "CO2", "O2", "NaCl"],
        correctAnswer: "H2O",
        category: "Science",
        difficulty: "easy",
        explanation: "Water's chemical formula is H2O, indicating it consists of two hydrogen atoms bonded to one oxygen atom."
      },
      {
        question: "Which ancient civilization built the Machu Picchu?",
        options: ["Aztecs", "Mayans", "Incas", "Egyptians"],
        correctAnswer: "Incas",
        category: "History",
        difficulty: "medium",
        explanation: "Machu Picchu was built by the Inca Empire in the 15th century, high in the Andes Mountains of Peru."
      },
      {
        question: "What is the largest organ in the human body?",
        options: ["Heart", "Liver", "Skin", "Brain"],
        correctAnswer: "Skin",
        category: "Biology",
        difficulty: "medium",
        explanation: "The skin is the largest organ in the human body, with a surface area of about 2 square meters in adults."
      },
      {
        question: "Who wrote 'The Great Gatsby'?",
        options: ["Ernest Hemingway", "F. Scott Fitzgerald", "Mark Twain", "John Steinbeck"],
        correctAnswer: "F. Scott Fitzgerald",
        category: "Literature",
        difficulty: "medium",
        explanation: "F. Scott Fitzgerald wrote 'The Great Gatsby', published in 1925 during the Jazz Age."
      },
      {
        question: "What is the name of the longest river in the world?",
        options: ["Amazon River", "Nile River", "Mississippi River", "Yangtze River"],
        correctAnswer: "Nile River",
        category: "Geography",
        difficulty: "medium",
        explanation: "The Nile River in Africa is generally considered the longest river in the world at about 6,650 kilometers (4,130 miles)."
      },
      {
        question: "Who developed the theory of relativity?",
        options: ["Isaac Newton", "Albert Einstein", "Stephen Hawking", "Galileo Galilei"],
        correctAnswer: "Albert Einstein",
        category: "Science",
        difficulty: "medium",
        explanation: "Albert Einstein developed the theory of relativity, publishing the Special Theory in 1905 and the General Theory in 1915."
      },
      {
        question: "In which city is the Taj Mahal located?",
        options: ["New Delhi", "Mumbai", "Agra", "Jaipur"],
        correctAnswer: "Agra",
        category: "Geography",
        difficulty: "medium",
        explanation: "The Taj Mahal is located in Agra, a city in the northern Indian state of Uttar Pradesh."
      }
    ];

    const result = await importQuestions(triviaQuestions);
    if (result) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        This will import 30 pre-defined trivia questions across various categories with difficulty levels.
      </p>
      
      {isImporting && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-muted-foreground text-center">
            Importing questions: {Math.round(progress)}%
          </p>
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="default" 
          onClick={handleImportTrivia}
          disabled={isImporting}
        >
          {isImporting ? "Importing..." : "Import 30 Trivia Questions"}
        </Button>
      </div>
    </div>
  );
};

export default TriviaImporter;
