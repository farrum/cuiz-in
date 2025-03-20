
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TriviaImporterProps {
  onSuccess: () => void;
}

const TriviaImporter: React.FC<TriviaImporterProps> = ({ onSuccess }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    
    try {
      // Sample trivia questions for importing
      const triviaQuestions = [
        {
          question: "Which planet is known as the Red Planet?",
          options: ["Venus", "Mars", "Jupiter", "Mercury"],
          correct_answer: "Mars",
          category: "Astronomy",
          difficulty: "easy",
          explanation: "Mars appears red because of iron oxide (rust) on its surface."
        },
        {
          question: "Who painted the Mona Lisa?",
          options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
          correct_answer: "Leonardo da Vinci",
          category: "Art",
          difficulty: "easy",
          explanation: "Leonardo da Vinci painted the Mona Lisa between 1503 and 1519."
        },
        {
          question: "What is the chemical symbol for gold?",
          options: ["Go", "Gd", "Au", "Ag"],
          correct_answer: "Au",
          category: "Chemistry",
          difficulty: "easy",
          explanation: "The symbol Au comes from the Latin word for gold, 'aurum'."
        },
        {
          question: "Which country is home to the kangaroo?",
          options: ["New Zealand", "South Africa", "Australia", "Brazil"],
          correct_answer: "Australia",
          category: "Geography",
          difficulty: "easy",
          explanation: "Kangaroos are native to Australia and are one of the country's most iconic animals."
        },
        {
          question: "What is the capital of Japan?",
          options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
          correct_answer: "Tokyo",
          category: "Geography",
          difficulty: "easy",
          explanation: "Tokyo is the capital and largest city of Japan."
        },
        {
          question: "Who wrote 'Romeo and Juliet'?",
          options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
          correct_answer: "William Shakespeare",
          category: "Literature",
          difficulty: "easy",
          explanation: "William Shakespeare wrote 'Romeo and Juliet' in the late 16th century."
        },
        {
          question: "What is the largest ocean on Earth?",
          options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
          correct_answer: "Pacific Ocean",
          category: "Geography",
          difficulty: "easy",
          explanation: "The Pacific Ocean is the largest and deepest ocean on Earth."
        },
        {
          question: "Which element has the chemical symbol 'O'?",
          options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
          correct_answer: "Oxygen",
          category: "Chemistry",
          difficulty: "easy",
          explanation: "Oxygen is represented by the symbol 'O' on the periodic table."
        },
        {
          question: "What is the smallest prime number?",
          options: ["0", "1", "2", "3"],
          correct_answer: "2",
          category: "Mathematics",
          difficulty: "easy",
          explanation: "2 is the smallest prime number and the only even prime number."
        },
        {
          question: "Who was the first person to step on the moon?",
          options: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "John Glenn"],
          correct_answer: "Neil Armstrong",
          category: "Space",
          difficulty: "easy",
          explanation: "Neil Armstrong was the first person to walk on the moon on July 20, 1969."
        },
        {
          question: "What is the freezing point of water in Celsius?",
          options: ["0°C", "-10°C", "10°C", "100°C"],
          correct_answer: "0°C",
          category: "Science",
          difficulty: "easy",
          explanation: "Water freezes at 0 degrees Celsius under standard conditions."
        },
        {
          question: "Which famous scientist developed the theory of relativity?",
          options: ["Isaac Newton", "Albert Einstein", "Galileo Galilei", "Stephen Hawking"],
          correct_answer: "Albert Einstein",
          category: "Science",
          difficulty: "medium",
          explanation: "Albert Einstein published his theory of relativity in the early 20th century."
        },
        {
          question: "What is the capital of France?",
          options: ["Berlin", "Madrid", "Paris", "Rome"],
          correct_answer: "Paris",
          category: "Geography",
          difficulty: "easy",
          explanation: "Paris is the capital and most populous city of France."
        },
        {
          question: "Which planet is known for its rings?",
          options: ["Mars", "Venus", "Jupiter", "Saturn"],
          correct_answer: "Saturn",
          category: "Astronomy",
          difficulty: "easy",
          explanation: "Saturn is most famous for its prominent ring system."
        },
        {
          question: "Who painted 'Starry Night'?",
          options: ["Pablo Picasso", "Claude Monet", "Salvador Dalí", "Vincent van Gogh"],
          correct_answer: "Vincent van Gogh",
          category: "Art",
          difficulty: "medium",
          explanation: "Vincent van Gogh painted 'Starry Night' in 1889."
        },
        {
          question: "What is the largest organ in the human body?",
          options: ["Heart", "Brain", "Liver", "Skin"],
          correct_answer: "Skin",
          category: "Biology",
          difficulty: "medium",
          explanation: "The skin is the largest organ, covering about 20 square feet in adults."
        },
        {
          question: "Which country is known as the Land of the Rising Sun?",
          options: ["China", "Thailand", "Japan", "Korea"],
          correct_answer: "Japan",
          category: "Geography",
          difficulty: "medium",
          explanation: "Japan is known as the Land of the Rising Sun because the sun appears to rise from Japan when viewed from China."
        },
        {
          question: "What is the most abundant gas in Earth's atmosphere?",
          options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
          correct_answer: "Nitrogen",
          category: "Science",
          difficulty: "medium",
          explanation: "Nitrogen makes up approximately 78% of Earth's atmosphere."
        },
        {
          question: "Who wrote 'To Kill a Mockingbird'?",
          options: ["J.K. Rowling", "Harper Lee", "Stephen King", "Ernest Hemingway"],
          correct_answer: "Harper Lee",
          category: "Literature",
          difficulty: "medium",
          explanation: "Harper Lee published 'To Kill a Mockingbird' in 1960."
        },
        {
          question: "What is the tallest mountain in the world?",
          options: ["K2", "Mount Kilimanjaro", "Mount Everest", "Mount Fuji"],
          correct_answer: "Mount Everest",
          category: "Geography",
          difficulty: "medium",
          explanation: "Mount Everest, at 29,032 feet, is the tallest mountain above sea level."
        },
        {
          question: "Who invented the telephone?",
          options: ["Thomas Edison", "Nikola Tesla", "Alexander Graham Bell", "Guglielmo Marconi"],
          correct_answer: "Alexander Graham Bell",
          category: "History",
          difficulty: "medium",
          explanation: "Alexander Graham Bell patented the first practical telephone in 1876."
        },
        {
          question: "What is the chemical symbol for silver?",
          options: ["Si", "Sv", "Sr", "Ag"],
          correct_answer: "Ag",
          category: "Chemistry",
          difficulty: "medium",
          explanation: "The symbol Ag comes from the Latin word for silver, 'argentum'."
        },
        {
          question: "Who discovered penicillin?",
          options: ["Alexander Fleming", "Marie Curie", "Louis Pasteur", "Joseph Lister"],
          correct_answer: "Alexander Fleming",
          category: "Medicine",
          difficulty: "medium",
          explanation: "Alexander Fleming discovered penicillin in 1928."
        },
        {
          question: "What is the hardest natural substance on Earth?",
          options: ["Gold", "Iron", "Diamond", "Titanium"],
          correct_answer: "Diamond",
          category: "Science",
          difficulty: "medium",
          explanation: "Diamond is the hardest known natural material on Earth."
        },
        {
          question: "Who is known as the 'Father of Computer Science'?",
          options: ["Bill Gates", "Alan Turing", "Steve Jobs", "Charles Babbage"],
          correct_answer: "Alan Turing",
          category: "Technology",
          difficulty: "hard",
          explanation: "Alan Turing is widely considered to be the father of theoretical computer science and artificial intelligence."
        },
        {
          question: "What is the smallest bone in the human body?",
          options: ["Stapes", "Femur", "Radius", "Humerus"],
          correct_answer: "Stapes",
          category: "Biology",
          difficulty: "hard",
          explanation: "The stapes (stirrup) bone in the middle ear is the smallest bone in the human body."
        },
        {
          question: "In which year did World War I begin?",
          options: ["1914", "1916", "1918", "1939"],
          correct_answer: "1914",
          category: "History",
          difficulty: "medium",
          explanation: "World War I began in 1914 with the assassination of Archduke Franz Ferdinand."
        },
        {
          question: "What is the main component of the Sun?",
          options: ["Oxygen", "Carbon", "Helium", "Hydrogen"],
          correct_answer: "Hydrogen",
          category: "Astronomy",
          difficulty: "medium",
          explanation: "The Sun is composed of approximately 73% hydrogen by mass."
        },
        {
          question: "Which famous equation is E=mc²?",
          options: ["Newton's Law", "Pythagorean Theorem", "Einstein's Theory of Relativity", "Schrödinger's Equation"],
          correct_answer: "Einstein's Theory of Relativity",
          category: "Physics",
          difficulty: "hard",
          explanation: "E=mc² is from Einstein's Theory of Special Relativity, relating energy to mass and the speed of light."
        }
      ];
      
      // Insert questions in batches to avoid timeout
      const BATCH_SIZE = 10;
      for (let i = 0; i < triviaQuestions.length; i += BATCH_SIZE) {
        const batch = triviaQuestions.slice(i, i + BATCH_SIZE);
        
        const { error } = await supabase
          .from('quiz_questions')
          .insert(batch);
          
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: `Imported ${triviaQuestions.length} trivia questions successfully!`,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error importing questions:', error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      
      toast({
        title: "Error",
        description: "Failed to import trivia questions.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center py-4">
        <div className="flex flex-col items-center text-center">
          <BookOpen className="h-12 w-12 text-primary mb-4" />
          <h3 className="text-lg font-medium">Ready to Import Trivia Pack</h3>
          <p className="text-muted-foreground mt-1 mb-4 max-w-md">
            This will add 30 pre-made trivia questions across various categories to your quiz database.
          </p>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-center">
        <Button 
          onClick={handleImport}
          disabled={isImporting}
          className="w-full md:w-auto"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : 'Import Trivia Pack'}
        </Button>
      </div>
    </div>
  );
};

export default TriviaImporter;
