
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from 'lucide-react';

interface MotivationalCharacterProps {
  mood?: 'happy' | 'sad' | 'neutral';
  message?: string;
  showMessage?: boolean;
}

const MotivationalCharacter: React.FC<MotivationalCharacterProps> = ({
  mood = 'neutral',
  message,
  showMessage = false
}) => {
  const [characterIndex, setCharacterIndex] = useState(0);
  const { toast } = useToast();
  
  // Character designs (SVG paths) for different moods
  const characters = {
    happy: [
      "M75,30 A45,45 0 1,1 74.99,30 M45,40 C35,40 35,50 45,50 C55,50 55,40 45,40 M30,35 A5,5 0 1,0 30,34.9 M60,35 A5,5 0 1,0 60,34.9",
      "M30,75 A45,45 0 1,0 30.01,75 M45,50 C55,50 55,60 45,60 C35,60 35,50 45,50 M60,35 A5,5 0 1,0 60,34.9 M30,35 A5,5 0 1,0 30,34.9",
    ],
    sad: [
      "M75,30 A45,45 0 1,1 74.99,30 M45,60 C35,60 35,50 45,50 C55,50 55,60 45,60 M30,35 A5,5 0 1,0 30,34.9 M60,35 A5,5 0 1,0 60,34.9",
      "M30,75 A45,45 0 1,0 30.01,75 M45,55 C55,55 55,65 45,65 C35,65 35,55 45,55 M60,35 A5,5 0 1,0 60,34.9 M30,35 A5,5 0 1,0 30,34.9",
    ],
    neutral: [
      "M75,30 A45,45 0 1,1 74.99,30 M30,55 L60,55 M30,35 A5,5 0 1,0 30,34.9 M60,35 A5,5 0 1,0 60,34.9",
      "M30,75 A45,45 0 1,0 30.01,75 M30,55 L60,55 M60,35 A5,5 0 1,0 60,34.9 M30,35 A5,5 0 1,0 30,34.9",
    ]
  };
  
  // Character colors for different moods
  const colors = {
    happy: "#FFD700",
    sad: "#6495ED",
    neutral: "#9370DB"
  };
  
  // Motivational phrases
  const motivationalPhrases = [
    "You're doing great!",
    "Keep up the good work!",
    "Learning is fun with you!",
    "You've got this!",
    "Every question makes you smarter!",
    "Knowledge is power!",
    "You're on fire today!",
    "Keep that brain growing!",
    "I believe in you!",
    "You're making fantastic progress!"
  ];
  
  useEffect(() => {
    // Randomly select a character design when component mounts
    setCharacterIndex(Math.floor(Math.random() * 2));
    
    // Show a random motivational message if none provided
    if (showMessage && !message) {
      const randomIndex = Math.floor(Math.random() * motivationalPhrases.length);
      toast({
        title: "Quiz Buddy says:",
        description: motivationalPhrases[randomIndex],
        variant: "default",
      });
    }
  }, []);

  return (
    <div className="character-container">
      <div className={`character-animation ${mood === 'happy' ? 'character-bounce' : mood === 'sad' ? 'pulse-soft' : 'floating'}`}>
        <svg 
          width="90" 
          height="90" 
          viewBox="0 0 100 100" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill={colors[mood]} 
            stroke="#333" 
            strokeWidth="2" 
          />
          <path 
            d={characters[mood][characterIndex]} 
            stroke="#333" 
            strokeWidth="3" 
            fill="none" 
            strokeLinecap="round"
          />
        </svg>
        
        {showMessage && message && (
          <div className="speech-bubble">
            <MessageCircle className="speech-icon" />
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MotivationalCharacter;
